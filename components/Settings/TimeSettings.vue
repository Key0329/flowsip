<template>
  <div class="time-settings">
    <!-- 標題區域 -->
    <div class="settings-header">
      <div class="header-content">
        <div class="header-icon">
          <Icon name="mdi:timer-cog" />
        </div>
        <div class="header-text">
          <h3 class="header-title">計時設定</h3>
          <p class="header-description">自訂計時器時間和行為</p>
        </div>
      </div>
    </div>

    <!-- 預設計時器選擇 -->
    <div class="default-timer-section">
      <h4 class="section-title">預設計時器</h4>
      <div class="preset-grid">
        <div
          v-for="preset in timerPresets"
          :key="preset.id"
          class="preset-card"
          :class="{
            'preset-card--active': defaultPresetId === preset.id,
            'preset-card--default': preset.isDefault
          }"
          @click="setDefaultPreset(preset.id)"
        >
          <div class="preset-header">
            <div class="preset-icon" :style="{ backgroundColor: preset.color + '20', color: preset.color }">
              <Icon :name="preset.icon" />
            </div>
            <div v-if="preset.isDefault" class="preset-badge">
              <Icon name="mdi:star" />
              <span>預設</span>
            </div>
          </div>
          
          <div class="preset-content">
            <h5 class="preset-name">{{ preset.name }}</h5>
            <p class="preset-description">{{ preset.description }}</p>
            <div class="preset-duration">
              {{ formatDuration(preset.duration) }}
            </div>
          </div>

          <!-- 選中指示器 -->
          <div v-if="defaultPresetId === preset.id" class="selected-indicator">
            <Icon name="mdi:check-circle" />
          </div>

          <!-- 自訂預設值的操作按鈕 -->
          <div v-if="!preset.isDefault" class="preset-actions">
            <button
              class="action-button action-button--edit"
              @click.stop="editPreset(preset)"
            >
              <Icon name="mdi:pencil" />
            </button>
            <button
              class="action-button action-button--delete"
              @click.stop="deletePreset(preset.id)"
            >
              <Icon name="mdi:delete" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增自訂計時器 -->
    <div class="custom-timer-section">
      <div class="section-header">
        <h4 class="section-title">自訂計時器</h4>
        <button
          class="add-button"
          @click="showAddTimer = true"
        >
          <Icon name="mdi:plus" />
          <span>新增</span>
        </button>
      </div>

      <!-- 新增/編輯表單 -->
      <div v-if="showAddTimer || editingPreset" class="timer-form">
        <div class="form-header">
          <h5 class="form-title">
            {{ editingPreset ? '編輯計時器' : '新增計時器' }}
          </h5>
          <button
            class="close-button"
            @click="cancelForm"
          >
            <Icon name="mdi:close" />
          </button>
        </div>

        <div class="form-content">
          <!-- 基本設定 -->
          <div class="form-group">
            <label class="form-label">名稱</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="例如：專注工作、休息時間"
              maxlength="20"
            >
          </div>

          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              placeholder="簡短說明這個計時器的用途"
              maxlength="50"
              rows="2"
            ></textarea>
          </div>

          <!-- 時間設定 -->
          <div class="form-group">
            <label class="form-label">計時時間</label>
            <div class="time-input-group">
              <div class="time-input">
                <input
                  v-model.number="timeHours"
                  type="number"
                  min="0"
                  max="23"
                  class="time-field"
                  placeholder="0"
                >
                <span class="time-unit">小時</span>
              </div>
              <div class="time-input">
                <input
                  v-model.number="timeMinutes"
                  type="number"
                  min="0"
                  max="59"
                  class="time-field"
                  placeholder="30"
                >
                <span class="time-unit">分鐘</span>
              </div>
              <div class="time-input">
                <input
                  v-model.number="timeSeconds"
                  type="number"
                  min="0"
                  max="59"
                  class="time-field"
                  placeholder="0"
                >
                <span class="time-unit">秒</span>
              </div>
            </div>
            <div class="total-time">
              總計時間：{{ formatDuration(totalDuration) }}
            </div>
          </div>

          <!-- 快速時間選項 -->
          <div class="form-group">
            <label class="form-label">快速選擇</label>
            <div class="quick-times">
              <button
                v-for="quick in quickTimes"
                :key="quick.label"
                class="quick-time-button"
                :class="{ 'quick-time-button--active': totalDuration === quick.seconds }"
                @click="setQuickTime(quick.seconds)"
              >
                {{ quick.label }}
              </button>
            </div>
          </div>

          <!-- 外觀設定 -->
          <div class="form-group">
            <label class="form-label">圖示</label>
            <div class="icon-grid">
              <button
                v-for="icon in iconOptions"
                :key="icon.name"
                class="icon-option"
                :class="{ 'icon-option--active': formData.icon === icon.name }"
                @click="formData.icon = icon.name"
              >
                <Icon :name="icon.name" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">顏色</label>
            <div class="color-grid">
              <button
                v-for="color in colorOptions"
                :key="color.value"
                class="color-option"
                :class="{ 'color-option--active': formData.color === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="formData.color = color.value"
              >
                <Icon v-if="formData.color === color.value" name="mdi:check" class="color-check" />
              </button>
            </div>
          </div>

          <!-- 分類 -->
          <div class="form-group">
            <label class="form-label">分類</label>
            <select v-model="formData.category" class="form-select">
              <option value="productivity">工作效率</option>
              <option value="health">健康提醒</option>
              <option value="break">休息時間</option>
              <option value="exercise">運動健身</option>
              <option value="study">學習專注</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button
            class="cancel-button"
            @click="cancelForm"
          >
            取消
          </button>
          <button
            class="save-button"
            :disabled="!isFormValid || isSaving"
            @click="savePreset"
          >
            <Icon v-if="isSaving" name="mdi:loading" class="animate-spin" />
            <span>{{ editingPreset ? '更新' : '新增' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 進階設定 -->
    <div class="advanced-settings">
      <h4 class="section-title">進階設定</h4>
      
      <div class="setting-item">
        <label class="setting-label">
          <input
            v-model="autoStartEnabled"
            type="checkbox"
            class="setting-checkbox"
          >
          <div class="checkbox-custom">
            <Icon name="mdi:check" />
          </div>
          <div class="setting-content">
            <span class="setting-name">自動開始下一個計時器</span>
            <span class="setting-description">當前計時結束後自動開始預設計時器</span>
          </div>
        </label>
      </div>

      <div class="setting-item">
        <label class="setting-label">
          <input
            v-model="showProgressRing"
            type="checkbox"
            class="setting-checkbox"
          >
          <div class="checkbox-custom">
            <Icon name="mdi:check" />
          </div>
          <div class="setting-content">
            <span class="setting-name">顯示進度環</span>
            <span class="setting-description">在計時器周圍顯示進度指示環</span>
          </div>
        </label>
      </div>

      <div class="setting-item">
        <label class="setting-label">
          <input
            v-model="keepScreenAwake"
            type="checkbox"
            class="setting-checkbox"
          >
          <div class="checkbox-custom">
            <Icon name="mdi:check" />
          </div>
          <div class="setting-content">
            <span class="setting-name">保持螢幕喚醒</span>
            <span class="setting-description">計時期間防止螢幕自動關閉</span>
          </div>
        </label>
      </div>
    </div>

    <!-- 重置區域 -->
    <div class="reset-section">
      <button
        class="reset-button"
        @click="resetTimeSettings"
        :disabled="isLoading"
      >
        <Icon name="mdi:restore" />
        <span>重置時間設定</span>
      </button>
    </div>

    <!-- 刪除確認對話框 -->
    <div v-if="showDeleteConfirm" class="delete-overlay">
      <div class="delete-dialog">
        <div class="delete-header">
          <Icon name="mdi:alert-circle" class="delete-icon" />
          <h3 class="delete-title">確認刪除</h3>
        </div>
        <p class="delete-message">
          確定要刪除「{{ deletingPreset?.name }}」嗎？此操作無法復原。
        </p>
        <div class="delete-actions">
          <button class="delete-cancel" @click="showDeleteConfirm = false">
            取消
          </button>
          <button class="delete-confirm" @click="confirmDelete">
            刪除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import type { TimerPreset } from '~/types'

interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'preset-added', preset: TimerPreset): void
  (e: 'preset-updated', preset: TimerPreset): void
  (e: 'preset-deleted', presetId: string): void
  (e: 'default-changed', presetId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

// 使用設定管理
const {
  timerPresets,
  defaultPreset,
  addTimerPreset,
  updateTimerPreset,
  removeTimerPreset,
  setDefaultPreset: setDefault,
  isLoading
} = useSettings()

// 本地狀態
const showAddTimer = ref(false)
const editingPreset = ref<TimerPreset | null>(null)
const showDeleteConfirm = ref(false)
const deletingPreset = ref<TimerPreset | null>(null)
const isSaving = ref(false)

// 表單數據
const formData = reactive({
  name: '',
  description: '',
  icon: 'mdi:timer',
  color: '#06b6d4',
  category: 'productivity' as TimerPreset['category']
})

const timeHours = ref(0)
const timeMinutes = ref(30)
const timeSeconds = ref(0)

// 進階設定
const autoStartEnabled = ref(false)
const showProgressRing = ref(true)
const keepScreenAwake = ref(false)

// 計算屬性
const defaultPresetId = computed(() => defaultPreset.value?.id || '')

const totalDuration = computed(() => {
  return (timeHours.value * 3600) + (timeMinutes.value * 60) + timeSeconds.value
})

const isFormValid = computed(() => {
  return formData.name.trim() !== '' && totalDuration.value > 0
})

// 快速時間選項
const quickTimes = [
  { label: '5分鐘', seconds: 5 * 60 },
  { label: '10分鐘', seconds: 10 * 60 },
  { label: '15分鐘', seconds: 15 * 60 },
  { label: '25分鐘', seconds: 25 * 60 },
  { label: '30分鐘', seconds: 30 * 60 },
  { label: '45分鐘', seconds: 45 * 60 },
  { label: '60分鐘', seconds: 60 * 60 }
]

// 圖示選項
const iconOptions = [
  { name: 'mdi:timer', label: '計時器' },
  { name: 'mdi:water', label: '水杯' },
  { name: 'mdi:coffee', label: '咖啡' },
  { name: 'mdi:book-open-page-variant', label: '書本' },
  { name: 'mdi:dumbbell', label: '啞鈴' },
  { name: 'mdi:meditation', label: '冥想' },
  { name: 'mdi:sleep', label: '睡眠' },
  { name: 'mdi:run', label: '跑步' },
  { name: 'mdi:eye-outline', label: '眼睛' },
  { name: 'mdi:heart-pulse', label: '心跳' },
  { name: 'mdi:brain', label: '大腦' },
  { name: 'mdi:lightbulb', label: '想法' }
]

// 顏色選項
const colorOptions = [
  { name: '藍色', value: '#3b82f6' },
  { name: '綠色', value: '#10b981' },
  { name: '紅色', value: '#ef4444' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '橙色', value: '#f59e0b' },
  { name: '粉色', value: '#ec4899' },
  { name: '青色', value: '#06b6d4' },
  { name: '灰色', value: '#6b7280' }
]

// 方法
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}小時 ${minutes}分鐘`
  } else if (minutes > 0) {
    return `${minutes}分鐘${secs > 0 ? ` ${secs}秒` : ''}`
  } else {
    return `${secs}秒`
  }
}

function setDefaultPreset(presetId: string): void {
  setDefault(presetId)
  emit('default-changed', presetId)
}

function setQuickTime(seconds: number): void {
  timeHours.value = Math.floor(seconds / 3600)
  timeMinutes.value = Math.floor((seconds % 3600) / 60)
  timeSeconds.value = seconds % 60
}

function editPreset(preset: TimerPreset): void {
  editingPreset.value = preset
  formData.name = preset.name
  formData.description = preset.description
  formData.icon = preset.icon
  formData.color = preset.color
  formData.category = preset.category

  // 設定時間
  const duration = preset.duration
  timeHours.value = Math.floor(duration / 3600)
  timeMinutes.value = Math.floor((duration % 3600) / 60)
  timeSeconds.value = duration % 60

  showAddTimer.value = true
}

function deletePreset(presetId: string): void {
  const preset = timerPresets.value.find(p => p.id === presetId)
  if (preset && !preset.isDefault) {
    deletingPreset.value = preset
    showDeleteConfirm.value = true
  }
}

function confirmDelete(): void {
  if (deletingPreset.value) {
    removeTimerPreset(deletingPreset.value.id)
    emit('preset-deleted', deletingPreset.value.id)
  }
  showDeleteConfirm.value = false
  deletingPreset.value = null
}

async function savePreset(): Promise<void> {
  if (!isFormValid.value) return

  try {
    isSaving.value = true

    const presetData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      duration: totalDuration.value,
      icon: formData.icon,
      color: formData.color,
      category: formData.category
    }

    if (editingPreset.value) {
      // 更新現有預設值
      updateTimerPreset(editingPreset.value.id, presetData)
      emit('preset-updated', { ...editingPreset.value, ...presetData })
    } else {
      // 新增預設值
      addTimerPreset(presetData)
      emit('preset-added', presetData as TimerPreset)
    }

    cancelForm()
  } catch (error) {
    console.error('儲存計時器預設值失敗:', error)
  } finally {
    isSaving.value = false
  }
}

function cancelForm(): void {
  showAddTimer.value = false
  editingPreset.value = null
  
  // 重置表單
  formData.name = ''
  formData.description = ''
  formData.icon = 'mdi:timer'
  formData.color = '#06b6d4'
  formData.category = 'productivity'
  
  timeHours.value = 0
  timeMinutes.value = 30
  timeSeconds.value = 0
}

function resetTimeSettings(): void {
  // 重置進階設定
  autoStartEnabled.value = false
  showProgressRing.value = true
  keepScreenAwake.value = false
  
  // 關閉表單
  cancelForm()
}

// 監聽表單變更，自動調整時間輸入
watch([timeHours, timeMinutes, timeSeconds], ([hours, minutes, seconds]) => {
  // 確保時間值在有效範圍內
  if (hours < 0) timeHours.value = 0
  if (hours > 23) timeHours.value = 23
  if (minutes < 0) timeMinutes.value = 0
  if (minutes > 59) timeMinutes.value = 59
  if (seconds < 0) timeSeconds.value = 0
  if (seconds > 59) timeSeconds.value = 59
})
</script>

<style scoped>
.time-settings {
  @apply space-y-8;
}

/* 標題區域 */
.settings-header {
  @apply mb-6;
}

.header-content {
  @apply flex items-center gap-4;
}

.header-icon {
  @apply flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 text-xl;
}

.header-text {
  @apply flex-grow;
}

.header-title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1;
}

.header-description {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* 區段標題 */
.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4;
}

.section-header {
  @apply flex items-center justify-between mb-4;
}

.add-button {
  @apply flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
}

/* 預設計時器網格 */
.preset-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.preset-card {
  @apply relative p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200;
}

.preset-card--active {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md;
}

.preset-card--default .preset-badge {
  @apply flex;
}

.preset-header {
  @apply flex items-center justify-between mb-3;
}

.preset-icon {
  @apply w-8 h-8 rounded-lg flex items-center justify-center text-lg;
}

.preset-badge {
  @apply hidden items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full;
}

.preset-content {
  @apply space-y-2;
}

.preset-name {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.preset-description {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.preset-duration {
  @apply text-lg font-semibold text-blue-600 dark:text-blue-400;
}

.selected-indicator {
  @apply absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm;
}

.preset-actions {
  @apply absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity;
}

.action-button {
  @apply w-6 h-6 rounded flex items-center justify-center text-xs transition-colors;
}

.action-button--edit {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600;
}

.action-button--delete {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-600;
}

/* 表單樣式 */
.timer-form {
  @apply p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl;
}

.form-header {
  @apply flex items-center justify-between mb-6;
}

.form-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.close-button {
  @apply w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600;
}

.form-content {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input,
.form-textarea,
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-textarea {
  @apply resize-none;
}

/* 時間輸入 */
.time-input-group {
  @apply flex gap-3;
}

.time-input {
  @apply flex-1 flex items-center gap-2;
}

.time-field {
  @apply flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.time-unit {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.total-time {
  @apply text-sm text-blue-600 dark:text-blue-400 font-medium;
}

/* 快速時間選項 */
.quick-times {
  @apply flex flex-wrap gap-2;
}

.quick-time-button {
  @apply px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}

.quick-time-button--active {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

/* 圖示和顏色選擇 */
.icon-grid,
.color-grid {
  @apply flex flex-wrap gap-2;
}

.icon-option {
  @apply w-8 h-8 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-blue-400 transition-colors;
}

.icon-option--active {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400;
}

.color-option {
  @apply w-8 h-8 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors;
}

.color-option--active {
  @apply border-white dark:border-gray-900;
}

.color-check {
  @apply text-white text-sm drop-shadow-sm;
}

/* 表單操作 */
.form-actions {
  @apply flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.cancel-button {
  @apply px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.save-button {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

/* 進階設定 */
.advanced-settings {
  @apply space-y-4;
}

.setting-item {
  @apply relative;
}

.setting-label {
  @apply flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.setting-checkbox {
  @apply sr-only;
}

.checkbox-custom {
  @apply flex-shrink-0 w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-transparent transition-all duration-200;
}

.setting-checkbox:checked + .checkbox-custom {
  @apply bg-purple-500 border-purple-500 text-white;
}

.setting-content {
  @apply flex-1;
}

.setting-name {
  @apply block font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.setting-description {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* 重置按鈕 */
.reset-section {
  @apply pt-4 border-t border-gray-200 dark:border-gray-700;
}

.reset-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 刪除確認對話框 */
.delete-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.delete-dialog {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4;
}

.delete-header {
  @apply flex items-center gap-3 mb-4;
}

.delete-icon {
  @apply text-red-500 text-2xl;
}

.delete-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.delete-message {
  @apply text-gray-600 dark:text-gray-400 mb-6;
}

.delete-actions {
  @apply flex gap-3 justify-end;
}

.delete-cancel {
  @apply px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.delete-confirm {
  @apply px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors;
}

/* 動畫 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .preset-grid {
    @apply grid-cols-1;
  }
  
  .time-input-group {
    @apply flex-col gap-2;
  }
  
  .quick-times {
    @apply grid grid-cols-3 gap-2;
  }
  
  .quick-time-button {
    @apply text-center;
  }
}
</style>