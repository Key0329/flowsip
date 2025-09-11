<template>
  <div class="mode-switch" :class="switchClasses">
    <!-- 標題 -->
    <div v-if="showTitle" class="switch-header">
      <h3 class="switch-title">選擇計時模式</h3>
      <p v-if="showSubtitle" class="switch-subtitle">選擇適合你的計時方式</p>
    </div>

    <!-- 模式選項 -->
    <div class="mode-options">
      <div
        v-for="mode in availableModes"
        :key="mode.value"
        class="mode-option"
        :class="{
          'mode-option--active': currentMode === mode.value,
          'mode-option--disabled': disabled || mode.disabled
        }"
        :tabindex="disabled || mode.disabled ? -1 : 0"
        @click="handleModeSelect(mode.value)"
        @keydown.enter="handleModeSelect(mode.value)"
        @keydown.space.prevent="handleModeSelect(mode.value)"
      >
        <!-- 模式圖示 -->
        <div class="mode-icon">
          <Icon :name="mode.icon" />
        </div>
        
        <!-- 模式資訊 -->
        <div class="mode-info">
          <h4 class="mode-name">{{ mode.name }}</h4>
          <p class="mode-description">{{ mode.description }}</p>
          <div v-if="mode.defaultDuration" class="mode-duration">
            <Icon name="mdi:clock-outline" />
            <span>{{ formatDuration(mode.defaultDuration) }}</span>
          </div>
        </div>
        
        <!-- 選中指示器 -->
        <div v-if="currentMode === mode.value" class="mode-indicator">
          <Icon name="mdi:check-circle" />
        </div>
      </div>
    </div>

    <!-- 自定義時間設定 -->
    <div v-if="showCustomDuration && selectedMode" class="custom-duration">
      <label class="duration-label">
        <Icon name="mdi:timer-settings" />
        <span>自定義時間</span>
      </label>
      
      <div class="duration-controls">
        <!-- 時間輸入 -->
        <div class="time-input">
          <input
            v-model.number="customMinutes"
            type="number"
            min="1"
            max="180"
            :disabled="disabled"
            class="time-field"
            placeholder="分鐘"
            @input="handleCustomDurationChange"
          >
          <span class="time-unit">分鐘</span>
        </div>
        
        <!-- 快速選項 -->
        <div class="quick-durations">
          <button
            v-for="preset in quickDurations"
            :key="preset.value"
            :disabled="disabled"
            class="quick-btn"
            :class="{ 'quick-btn--active': customMinutes === preset.value }"
            @click="handleQuickDuration(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 確認按鈕 -->
    <div v-if="showActions" class="switch-actions">
      <button
        :disabled="!canConfirm || disabled"
        class="confirm-btn"
        :class="{ 'confirm-btn--disabled': !canConfirm || disabled }"
        @click="handleConfirm"
      >
        <Icon name="mdi:check" />
        <span>確認選擇</span>
      </button>
      
      <button
        v-if="allowCancel"
        :disabled="disabled"
        class="cancel-btn"
        :class="{ 'cancel-btn--disabled': disabled }"
        @click="handleCancel"
      >
        <Icon name="mdi:close" />
        <span>取消</span>
      </button>
    </div>

    <!-- 模式預覽 -->
    <div v-if="showPreview && selectedMode" class="mode-preview">
      <div class="preview-header">
        <Icon name="mdi:eye" />
        <span>預覽</span>
      </div>
      <div class="preview-content">
        <div class="preview-mode">
          <Icon :name="selectedModeData?.icon" />
          <span>{{ selectedModeData?.name }}</span>
        </div>
        <div class="preview-duration">
          <Icon name="mdi:clock" />
          <span>{{ formatDuration(finalDuration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TimerMode } from '~/types/index'

/**
 * 模式選項定義
 */
interface ModeOption {
  value: TimerMode
  name: string
  description: string
  icon: string
  defaultDuration: number // 毫秒
  disabled?: boolean
}

/**
 * 快速時間選項
 */
interface QuickDuration {
  label: string
  value: number // 分鐘
}

/**
 * 模式切換元件屬性
 */
interface Props {
  /** 當前選中的模式 */
  modelValue?: TimerMode | null
  
  /** 當前選中的時長（毫秒） */
  duration?: number
  
  /** 是否禁用 */
  disabled?: boolean
  
  /** 可用的模式 */
  modes?: TimerMode[]
  
  /** 是否顯示標題 */
  showTitle?: boolean
  
  /** 是否顯示副標題 */
  showSubtitle?: boolean
  
  /** 是否顯示自定義時間設定 */
  showCustomDuration?: boolean
  
  /** 是否顯示操作按鈕 */
  showActions?: boolean
  
  /** 是否允許取消 */
  allowCancel?: boolean
  
  /** 是否顯示預覽 */
  showPreview?: boolean
  
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  
  /** 佈局方向 */
  layout?: 'vertical' | 'horizontal'
}

/**
 * 模式切換元件事件
 */
interface Emits {
  /** 更新選中的模式 */
  (e: 'update:modelValue', mode: TimerMode | null): void
  
  /** 更新時長 */
  (e: 'update:duration', duration: number): void
  
  /** 模式改變 */
  (e: 'mode-change', mode: TimerMode | null, duration: number): void
  
  /** 確認選擇 */
  (e: 'confirm', mode: TimerMode, duration: number): void
  
  /** 取消選擇 */
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modes: () => ['water', 'pomodoro'],
  showTitle: true,
  showSubtitle: false,
  showCustomDuration: true,
  showActions: false,
  allowCancel: false,
  showPreview: true,
  size: 'md',
  layout: 'vertical'
})

const emit = defineEmits<Emits>()

// 響應式狀態
const customMinutes = ref<number>(25)
const selectedMode = ref<TimerMode | null>(props.modelValue || null)

// 預定義模式選項
const modeDefinitions: Record<TimerMode, ModeOption> = {
  water: {
    value: 'water',
    name: '喝水提醒',
    description: '定時提醒你補充水分',
    icon: 'mdi:water',
    defaultDuration: 30 * 60 * 1000 // 30分鐘
  },
  pomodoro: {
    value: 'pomodoro',
    name: '番茄鐘',
    description: '專注工作與休息的時間管理',
    icon: 'mdi:timer',
    defaultDuration: 25 * 60 * 1000 // 25分鐘
  }
}

// 快速時間選項
const quickDurations = computed<QuickDuration[]>(() => {
  if (selectedMode.value === 'pomodoro') {
    return [
      { label: '25分', value: 25 },
      { label: '45分', value: 45 },
      { label: '90分', value: 90 }
    ]
  }
  
  if (selectedMode.value === 'water') {
    return [
      { label: '15分', value: 15 },
      { label: '30分', value: 30 },
      { label: '60分', value: 60 },
      { label: '120分', value: 120 }
    ]
  }
  
  return [
    { label: '5分', value: 5 },
    { label: '15分', value: 15 },
    { label: '30分', value: 30 },
    { label: '60分', value: 60 }
  ]
})

// 計算屬性
const availableModes = computed<ModeOption[]>(() => {
  return props.modes.map(mode => modeDefinitions[mode]).filter(Boolean)
})

const currentMode = computed(() => props.modelValue)

const selectedModeData = computed(() => {
  if (!selectedMode.value) return null
  return modeDefinitions[selectedMode.value]
})

const finalDuration = computed(() => {
  if (props.duration) return props.duration
  if (selectedMode.value && customMinutes.value > 0) {
    return customMinutes.value * 60 * 1000
  }
  return selectedModeData.value?.defaultDuration || 0
})

const canConfirm = computed(() => {
  return selectedMode.value && finalDuration.value > 0
})

const switchClasses = computed(() => {
  return {
    [`mode-switch--${props.size}`]: true,
    [`mode-switch--${props.layout}`]: true,
    'mode-switch--disabled': props.disabled
  }
})

// 監聽器
watch(() => props.modelValue, (newMode) => {
  selectedMode.value = newMode
  if (newMode && modeDefinitions[newMode]) {
    customMinutes.value = Math.round(modeDefinitions[newMode].defaultDuration / 60000)
  }
}, { immediate: true })

watch(() => props.duration, (newDuration) => {
  if (newDuration) {
    customMinutes.value = Math.round(newDuration / 60000)
  }
}, { immediate: true })

// 事件處理函數
function handleModeSelect(mode: TimerMode): void {
  if (props.disabled) return
  
  selectedMode.value = mode
  const defaultDuration = modeDefinitions[mode].defaultDuration
  customMinutes.value = Math.round(defaultDuration / 60000)
  
  emit('update:modelValue', mode)
  emit('update:duration', defaultDuration)
  emit('mode-change', mode, defaultDuration)
}

function handleCustomDurationChange(): void {
  if (props.disabled || !selectedMode.value) return
  
  const duration = customMinutes.value * 60 * 1000
  emit('update:duration', duration)
  
  if (selectedMode.value) {
    emit('mode-change', selectedMode.value, duration)
  }
}

function handleQuickDuration(minutes: number): void {
  if (props.disabled) return
  
  customMinutes.value = minutes
  handleCustomDurationChange()
}

function handleConfirm(): void {
  if (!canConfirm.value || props.disabled) return
  
  emit('confirm', selectedMode.value!, finalDuration.value)
}

function handleCancel(): void {
  if (props.disabled) return
  
  emit('cancel')
}

/**
 * 格式化時間長度顯示
 */
function formatDuration(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours > 0) {
    return `${hours} 小時 ${remainingMinutes} 分鐘`
  }
  
  return `${minutes} 分鐘`
}
</script>

<style scoped>
.mode-switch {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.05);
  border: 1px solid rgb(255 255 255 / 0.1);
  backdrop-filter: blur(10px);
}

/* 尺寸變體 */
.mode-switch--sm {
  padding: 1rem;
  gap: 1rem;
}

.mode-switch--lg {
  padding: 2rem;
  gap: 2rem;
}

/* 佈局變體 */
.mode-switch--horizontal .mode-options {
  flex-direction: row;
  justify-content: center;
}

.mode-switch--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 標題區域 */
.switch-header {
  text-align: center;
}

.switch-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.mode-switch--sm .switch-title {
  font-size: 1.125rem;
}

.mode-switch--lg .switch-title {
  font-size: 1.5rem;
}

.switch-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: rgb(255 255 255 / 0.7);
}

/* 模式選項 */
.mode-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.05);
  border: 2px solid rgb(255 255 255 / 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.mode-option:hover:not(.mode-option--disabled) {
  background: rgb(255 255 255 / 0.1);
  border-color: rgb(255 255 255 / 0.2);
  transform: translateY(-2px);
}

.mode-option:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgb(59 130 246 / 0.5);
}

.mode-option--active {
  background: rgb(59 130 246 / 0.1);
  border-color: rgb(59 130 246 / 0.5);
  box-shadow: 0 0 15px rgb(59 130 246 / 0.2);
}

.mode-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-switch--horizontal .mode-option {
  flex-direction: column;
  text-align: center;
  min-width: 150px;
}

/* 模式圖示 */
.mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.1);
  font-size: 1.5rem;
  color: rgb(255 255 255 / 0.8);
}

.mode-switch--sm .mode-icon {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.25rem;
}

.mode-switch--lg .mode-icon {
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.75rem;
}

.mode-option--active .mode-icon {
  background: rgb(59 130 246 / 0.2);
  color: rgb(59 130 246);
}

/* 模式資訊 */
.mode-info {
  flex: 1;
  min-width: 0;
}

.mode-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.mode-description {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: rgb(255 255 255 / 0.7);
  line-height: 1.4;
}

.mode-duration {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.6);
}

/* 選中指示器 */
.mode-indicator {
  color: rgb(59 130 246);
  font-size: 1.25rem;
}

/* 自定義時間設定 */
.custom-duration {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.05);
  border: 1px solid rgb(255 255 255 / 0.1);
}

.duration-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.duration-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-field {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 0.5rem;
  background: rgb(255 255 255 / 0.1);
  color: white;
  font-size: 0.875rem;
}

.time-field:focus {
  outline: none;
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 2px rgb(59 130 246 / 0.2);
}

.time-field::placeholder {
  color: rgb(255 255 255 / 0.5);
}

.time-unit {
  font-size: 0.875rem;
  color: rgb(255 255 255 / 0.7);
}

.quick-durations {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 1rem;
  background: transparent;
  color: rgb(255 255 255 / 0.8);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.1);
  border-color: rgb(255 255 255 / 0.3);
}

.quick-btn--active {
  background: rgb(59 130 246);
  border-color: rgb(59 130 246);
  color: white;
}

/* 操作按鈕 */
.switch-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.confirm-btn,
.cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn {
  background: rgb(34 197 94);
  color: white;
}

.confirm-btn:hover:not(.confirm-btn--disabled) {
  background: rgb(22 163 74);
  transform: translateY(-2px);
}

.confirm-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: rgb(107 114 128);
  color: white;
}

.cancel-btn:hover:not(.cancel-btn--disabled) {
  background: rgb(75 85 99);
  transform: translateY(-2px);
}

.cancel-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 預覽區域 */
.mode-preview {
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgb(59 130 246 / 0.1);
  border: 1px solid rgb(59 130 246 / 0.2);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(59 130 246);
}

.preview-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.preview-mode,
.preview-duration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 0.875rem;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .mode-switch {
    padding: 1rem;
    gap: 1rem;
  }
  
  .mode-option {
    padding: 0.75rem;
  }
  
  .mode-switch--horizontal .mode-options {
    flex-direction: column;
  }
  
  .mode-switch--horizontal .mode-option {
    flex-direction: row;
    text-align: left;
  }
  
  .switch-actions {
    flex-direction: column;
  }
  
  .confirm-btn,
  .cancel-btn {
    justify-content: center;
  }
}
</style>