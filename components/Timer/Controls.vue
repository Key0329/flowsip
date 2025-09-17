<template>
  <div class="timer-controls" :class="controlsClasses">
    <!-- 主要控制按鈕 -->
    <div class="main-controls">
      <!-- 開始/暫停按鈕 -->
      <button
        v-if="!isRunning || isPaused"
        :disabled="isDisabled"
        class="control-btn control-btn--primary control-btn--start"
        :class="{ 'control-btn--disabled': isDisabled }"
        :aria-label="isPaused ? '繼續計時器' : '開始計時器'"
        :aria-describedby="isDisabled ? 'timer-disabled-reason' : undefined"
        @click="handleStart"
      >
        <Icon name="mdi:play" class="btn-icon" aria-hidden="true" />
        <span class="btn-text">{{ isPaused ? '繼續' : '開始' }}</span>
      </button>

      <!-- 暫停按鈕 -->
      <button
        v-else
        :disabled="isDisabled"
        class="control-btn control-btn--warning control-btn--pause"
        :class="{ 'control-btn--disabled': isDisabled }"
        aria-label="暫停計時器"
        :aria-describedby="isDisabled ? 'timer-disabled-reason' : undefined"
        @click="handlePause"
      >
        <Icon name="mdi:pause" class="btn-icon" aria-hidden="true" />
        <span class="btn-text">暫停</span>
      </button>

      <!-- 停止按鈕 -->
      <button
        v-if="isRunning || isPaused || (remaining < duration && duration > 0)"
        :disabled="isDisabled"
        class="control-btn control-btn--danger control-btn--stop"
        :class="{ 'control-btn--disabled': isDisabled }"
        aria-label="停止計時器"
        :aria-describedby="isDisabled ? 'timer-disabled-reason' : undefined"
        @click="handleStop"
      >
        <Icon name="mdi:stop" class="btn-icon" aria-hidden="true" />
        <span class="btn-text">停止</span>
      </button>

      <!-- 重置按鈕 -->
      <button
        v-if="(!isRunning && !isPaused && remaining === 0 && duration > 0) || 
              (!isRunning && !isPaused && remaining < duration)"
        :disabled="isDisabled"
        class="control-btn control-btn--secondary control-btn--reset"
        :class="{ 'control-btn--disabled': isDisabled }"
        @click="handleReset"
      >
        <Icon name="mdi:refresh" class="btn-icon" />
        <span class="btn-text">重置</span>
      </button>
    </div>

    <!-- 次要控制按鈕 -->
    <div v-if="showSecondaryControls" class="secondary-controls">
      <!-- 快速設定按鈕 -->
      <div class="quick-actions">
        <button
          v-for="preset in quickPresets"
          :key="preset.value"
          :disabled="isRunning || isDisabled"
          class="control-btn control-btn--small control-btn--outline"
          :class="{ 
            'control-btn--disabled': isRunning || isDisabled,
            'control-btn--active': duration === preset.value
          }"
          @click="handleQuickSet(preset.value)"
        >
          <span class="btn-text">{{ preset.label }}</span>
        </button>
      </div>

      <!-- 進階控制 -->
      <div v-if="showAdvancedControls" class="advanced-controls">
        <!-- 加減時間按鈕 -->
        <div class="time-adjust">
          <button
            :disabled="!canAdjustTime || isDisabled"
            class="control-btn control-btn--small control-btn--outline"
            :class="{ 'control-btn--disabled': !canAdjustTime || isDisabled }"
            @click="handleAdjustTime(-60000)"
          >
            <Icon name="mdi:minus" class="btn-icon" />
            <span class="btn-text">-1分</span>
          </button>
          
          <button
            :disabled="!canAdjustTime || isDisabled"
            class="control-btn control-btn--small control-btn--outline"
            :class="{ 'control-btn--disabled': !canAdjustTime || isDisabled }"
            @click="handleAdjustTime(60000)"
          >
            <Icon name="mdi:plus" class="btn-icon" />
            <span class="btn-text">+1分</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 狀態提示 -->
    <div v-if="showStatus" class="control-status">
      <div v-if="isDisabled" class="status-message status-message--warning">
        <Icon name="mdi:alert" />
        <span>{{ disabledReason || '功能暫時無法使用' }}</span>
      </div>
      <div v-else-if="isRunning && remaining <= 60000" class="status-message status-message--urgent">
        <Icon name="mdi:clock-alert" />
        <span>即將完成！</span>
      </div>
      <div v-else-if="isPaused" class="status-message status-message--info">
        <Icon name="mdi:information" />
        <span>計時器已暫停，點擊繼續恢復</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TimerMode, TimerStatus } from '~/types/index'

/**
 * 快速設定預設值
 */
interface QuickPreset {
  label: string
  value: number // 毫秒
}

/**
 * 控制按鈕元件屬性
 */
interface Props {
  /** 計時器狀態 */
  status: TimerStatus
  
  /** 計時器模式 */
  mode?: TimerMode | null
  
  /** 總時長（毫秒） */
  duration: number
  
  /** 剩餘時間（毫秒） */
  remaining: number
  
  /** 是否禁用所有按鈕 */
  disabled?: boolean
  
  /** 禁用原因說明 */
  disabledReason?: string
  
  /** 是否顯示次要控制 */
  showSecondaryControls?: boolean
  
  /** 是否顯示進階控制 */
  showAdvancedControls?: boolean
  
  /** 是否顯示狀態提示 */
  showStatus?: boolean
  
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  
  /** 主題變體 */
  variant?: 'water' | 'pomodoro' | 'default'
  
  /** 自定義快速設定 */
  customPresets?: QuickPreset[]
}

/**
 * 控制按鈕元件事件
 */
interface Emits {
  /** 開始計時 */
  (e: 'start'): void
  
  /** 暫停計時 */
  (e: 'pause'): void
  
  /** 停止計時 */
  (e: 'stop'): void
  
  /** 重置計時器 */
  (e: 'reset'): void
  
  /** 設定時間 */
  (e: 'set-duration', duration: number): void
  
  /** 調整時間 */
  (e: 'adjust-time', adjustment: number): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showSecondaryControls: false,
  showAdvancedControls: false,
  showStatus: true,
  size: 'md',
  variant: 'default'
})

const emit = defineEmits<Emits>()

// 計算屬性
const isRunning = computed(() => props.status === 'running')
const isPaused = computed(() => props.status === 'paused')
const isDisabled = computed(() => props.disabled)

// 是否可以調整時間（未開始或已暫停時可調整）
const canAdjustTime = computed(() => {
  return !isRunning.value && props.duration > 0
})

// 快速設定預設值
const quickPresets = computed<QuickPreset[]>(() => {
  if (props.customPresets) {
    return props.customPresets
  }
  
  // 根據模式提供不同的快速設定
  const basePresets: QuickPreset[] = [
    { label: '5分', value: 5 * 60 * 1000 },
    { label: '10分', value: 10 * 60 * 1000 },
    { label: '15分', value: 15 * 60 * 1000 },
    { label: '30分', value: 30 * 60 * 1000 }
  ]
  
  if (props.mode === 'pomodoro') {
    return [
      { label: '25分', value: 25 * 60 * 1000 },
      { label: '5分', value: 5 * 60 * 1000 },
      { label: '15分', value: 15 * 60 * 1000 },
      { label: '30分', value: 30 * 60 * 1000 }
    ]
  }
  
  if (props.mode === 'water') {
    return [
      { label: '30分', value: 30 * 60 * 1000 },
      { label: '45分', value: 45 * 60 * 1000 },
      { label: '60分', value: 60 * 60 * 1000 },
      { label: '90分', value: 90 * 60 * 1000 }
    ]
  }
  
  return basePresets
})

// 控制器樣式類別
const controlsClasses = computed(() => {
  return {
    [`timer-controls--${props.size}`]: true,
    [`timer-controls--${props.variant}`]: true,
    'timer-controls--disabled': isDisabled.value,
    'timer-controls--running': isRunning.value,
    'timer-controls--paused': isPaused.value
  }
})

// 事件處理函數
function handleStart(): void {
  if (isDisabled.value) return
  emit('start')
}

function handlePause(): void {
  if (isDisabled.value) return
  emit('pause')
}

function handleStop(): void {
  if (isDisabled.value) return
  emit('stop')
}

function handleReset(): void {
  if (isDisabled.value) return
  emit('reset')
}

function handleQuickSet(duration: number): void {
  if (isRunning.value || isDisabled.value) return
  emit('set-duration', duration)
}

function handleAdjustTime(adjustment: number): void {
  if (!canAdjustTime.value || isDisabled.value) return
  emit('adjust-time', adjustment)
}
</script>

<style scoped>
.timer-controls {
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
.timer-controls--sm {
  padding: 1rem;
  gap: 1rem;
}

.timer-controls--lg {
  padding: 2rem;
  gap: 2rem;
}

/* 主題色彩變體 */
.timer-controls--water {
  background: rgb(59 130 246 / 0.05);
  border-color: rgb(59 130 246 / 0.1);
}

.timer-controls--pomodoro {
  background: rgb(239 68 68 / 0.05);
  border-color: rgb(239 68 68 / 0.1);
}

/* 狀態變體 */
.timer-controls--running {
  box-shadow: 0 0 15px rgb(34 197 94 / 0.2);
}

.timer-controls--paused {
  box-shadow: 0 0 15px rgb(234 179 8 / 0.2);
}

.timer-controls--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 主要控制按鈕 */
.main-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* 控制按鈕基礎樣式 */
.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgb(255 255 255 / 0.1);
  color: white;
  border: 1px solid rgb(255 255 255 / 0.2);
  transform-origin: center;
  backdrop-filter: blur(10px);
}

/* 按鈕懸停效果 */
.control-btn:hover:not(.control-btn--disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 8px 25px rgb(0 0 0 / 0.15),
    0 0 0 1px rgb(255 255 255 / 0.1);
  filter: brightness(1.1);
}

/* 按鈕點擊效果 */
.control-btn:active:not(.control-btn--disabled) {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
  box-shadow: 
    0 2px 8px rgb(0 0 0 / 0.2),
    inset 0 2px 4px rgb(0 0 0 / 0.1);
}

/* 波紋效果 */
.control-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.control-btn:active:not(.control-btn--disabled)::before {
  width: 300px;
  height: 300px;
}

/* 按鈕尺寸變體 */
.timer-controls--sm .control-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.timer-controls--lg .control-btn {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.control-btn--small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* 按鈕變體 */
.control-btn--primary {
  background: linear-gradient(135deg, rgb(34 197 94), rgb(22 163 74));
  border-color: rgb(34 197 94);
  color: white;
  box-shadow: 0 0 0 0 rgb(34 197 94 / 0.3);
}

.control-btn--primary:hover:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(22 163 74), rgb(21 128 61));
  box-shadow: 
    0 8px 25px rgb(34 197 94 / 0.3),
    0 0 20px rgb(34 197 94 / 0.2);
  border-color: rgb(22 163 74);
}

.control-btn--primary:active:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(21 128 61), rgb(20 83 45));
}

.control-btn--warning {
  background: linear-gradient(135deg, rgb(234 179 8), rgb(202 138 4));
  border-color: rgb(234 179 8);
  color: rgb(31 41 55);
}

.control-btn--warning:hover:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(202 138 4), rgb(180 83 9));
  box-shadow: 
    0 8px 25px rgb(234 179 8 / 0.3),
    0 0 20px rgb(234 179 8 / 0.2);
  border-color: rgb(202 138 4);
}

.control-btn--warning:active:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(180 83 9), rgb(146 64 14));
}

.control-btn--danger {
  background: linear-gradient(135deg, rgb(239 68 68), rgb(220 38 38));
  border-color: rgb(239 68 68);
  color: white;
}

.control-btn--danger:hover:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(220 38 38), rgb(185 28 28));
  box-shadow: 
    0 8px 25px rgb(239 68 68 / 0.3),
    0 0 20px rgb(239 68 68 / 0.2);
  border-color: rgb(220 38 38);
}

.control-btn--danger:active:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(185 28 28), rgb(153 27 27));
}

.control-btn--secondary {
  background: linear-gradient(135deg, rgb(107 114 128), rgb(75 85 99));
  border-color: rgb(107 114 128);
  color: white;
}

.control-btn--secondary:hover:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(75 85 99), rgb(55 65 81));
  box-shadow: 
    0 8px 25px rgb(107 114 128 / 0.3),
    0 0 20px rgb(107 114 128 / 0.2);
  border-color: rgb(75 85 99);
}

.control-btn--secondary:active:not(.control-btn--disabled) {
  background: linear-gradient(135deg, rgb(55 65 81), rgb(31 41 55));
}

.control-btn--outline {
  background: transparent;
  border-color: rgb(255 255 255 / 0.3);
  color: rgb(255 255 255 / 0.8);
}

.control-btn--outline:hover:not(.control-btn--disabled) {
  background: rgb(255 255 255 / 0.1);
  border-color: rgb(255 255 255 / 0.5);
  color: white;
}

.control-btn--active {
  background: rgb(59 130 246);
  border-color: rgb(59 130 246);
  color: white;
}

.control-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 按鈕圖示和文字 */
.btn-icon {
  font-size: 1.25rem;
}

.control-btn--small .btn-icon {
  font-size: 1rem;
}

.btn-text {
  font-weight: inherit;
}

/* 次要控制 */
.secondary-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.advanced-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.time-adjust {
  display: flex;
  gap: 0.5rem;
}

/* 狀態提示 */
.control-status {
  display: flex;
  justify-content: center;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-message--info {
  background: rgb(59 130 246 / 0.1);
  border: 1px solid rgb(59 130 246 / 0.2);
  color: rgb(59 130 246);
}

.status-message--warning {
  background: rgb(234 179 8 / 0.1);
  border: 1px solid rgb(234 179 8 / 0.2);
  color: rgb(234 179 8);
}

.status-message--urgent {
  background: rgb(239 68 68 / 0.1);
  border: 1px solid rgb(239 68 68 / 0.2);
  color: rgb(239 68 68);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 響應式設計 */
@media (max-width: 640px) {
  .timer-controls {
    padding: 1rem;
    gap: 1rem;
  }
  
  .main-controls {
    flex-direction: column;
  }
  
  .control-btn {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
  
  .quick-actions {
    gap: 0.25rem;
  }
  
  .control-btn--small {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .quick-actions {
    flex-direction: column;
  }
  
  .time-adjust {
    flex-direction: column;
    width: 100%;
  }
  
  .time-adjust .control-btn {
    width: 100%;
  }
}
</style>