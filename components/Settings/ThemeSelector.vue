<template>
  <div class="theme-selector">
    <!-- 標題區域 -->
    <div class="selector-header">
      <div class="header-content">
        <div class="header-icon">
          <Icon name="mdi:palette-outline" />
        </div>
        <div class="header-text">
          <h3 class="header-title">主題外觀</h3>
          <p class="header-description">選擇您偏好的介面主題</p>
        </div>
      </div>
    </div>

    <!-- 主題選項 -->
    <div class="theme-options">
      <div
        v-for="option in themeOptions"
        :key="option.value"
        class="theme-option"
        :class="{
          'theme-option--active': modelValue === option.value,
          'theme-option--disabled': option.disabled
        }"
        @click="!option.disabled && selectTheme(option.value)"
      >
        <!-- 主題預覽 -->
        <div class="theme-preview" :class="`theme-preview--${option.value}`">
          <div class="preview-header">
            <div class="preview-circles">
              <div class="preview-circle preview-circle--red"></div>
              <div class="preview-circle preview-circle--yellow"></div>
              <div class="preview-circle preview-circle--green"></div>
            </div>
          </div>
          <div class="preview-content">
            <div class="preview-sidebar"></div>
            <div class="preview-main">
              <div class="preview-bar"></div>
              <div class="preview-text">
                <div class="preview-line preview-line--long"></div>
                <div class="preview-line preview-line--medium"></div>
                <div class="preview-line preview-line--short"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主題資訊 -->
        <div class="theme-info">
          <div class="theme-icon">
            <Icon :name="option.icon" />
          </div>
          <div class="theme-details">
            <h4 class="theme-name">{{ option.name }}</h4>
            <p class="theme-description">{{ option.description }}</p>
            
            <!-- 系統偏好指示器 -->
            <div v-if="option.value === 'auto' && systemTheme" class="system-preference">
              <Icon :name="systemTheme === 'dark' ? 'mdi:weather-night' : 'mdi:weather-sunny'" />
              <span>目前跟隨: {{ systemTheme === 'dark' ? '深色' : '淺色' }}</span>
            </div>
          </div>
          
          <!-- 選中指示器 -->
          <div v-if="modelValue === option.value" class="selected-indicator">
            <Icon name="mdi:check-circle" />
          </div>
        </div>

        <!-- 時間顯示（僅自動模式） -->
        <div v-if="option.value === 'auto'" class="auto-schedule">
          <div class="schedule-item">
            <Icon name="mdi:weather-sunny" />
            <span>日間模式</span>
            <span class="schedule-time">06:00 - 18:00</span>
          </div>
          <div class="schedule-item">
            <Icon name="mdi:weather-night" />
            <span>夜間模式</span>
            <span class="schedule-time">18:00 - 06:00</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 進階選項 -->
    <div class="advanced-options">
      <div class="option-item">
        <label class="option-label">
          <input
            v-model="highContrast"
            type="checkbox"
            class="option-checkbox"
          >
          <div class="checkbox-custom">
            <Icon name="mdi:check" />
          </div>
          <div class="option-content">
            <span class="option-name">高對比度模式</span>
            <span class="option-description">提高介面對比度，改善可讀性</span>
          </div>
        </label>
      </div>

      <div class="option-item">
        <label class="option-label">
          <input
            v-model="reducedMotion"
            type="checkbox"
            class="option-checkbox"
          >
          <div class="checkbox-custom">
            <Icon name="mdi:check" />
          </div>
          <div class="option-content">
            <span class="option-name">減少動畫效果</span>
            <span class="option-description">降低或停用介面動畫</span>
          </div>
        </label>
      </div>
    </div>

    <!-- 重置按鈕 -->
    <div class="reset-section">
      <button
        class="reset-button"
        @click="resetToDefault"
        :disabled="isLoading"
      >
        <Icon name="mdi:restore" />
        <span>重置為預設</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { ThemeMode } from '~/types'

interface Props {
  modelValue: ThemeMode
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: ThemeMode): void
  (e: 'change', value: ThemeMode): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

// 使用設定管理
const { settings, updateSetting, isLoading } = useSettings()

// 系統主題偵測
const systemTheme = ref<'light' | 'dark'>('light')

// 主題選項配置
const themeOptions = [
  {
    value: 'light' as ThemeMode,
    name: '淺色模式',
    description: '明亮清新的介面風格',
    icon: 'mdi:weather-sunny',
    disabled: false
  },
  {
    value: 'dark' as ThemeMode,
    name: '深色模式',
    description: '護眼的暗色介面風格',
    icon: 'mdi:weather-night',
    disabled: false
  },
  {
    value: 'auto' as ThemeMode,
    name: '自動切換',
    description: '跟隨系統設定自動切換',
    icon: 'mdi:theme-light-dark',
    disabled: false
  }
]

// 無障礙選項
const highContrast = computed({
  get: () => settings.value.accessibility.highContrast,
  set: (value: boolean) => {
    updateSetting('accessibility', {
      ...settings.value.accessibility,
      highContrast: value
    })
    applyAccessibilitySettings()
  }
})

const reducedMotion = computed({
  get: () => settings.value.accessibility.reducedMotion,
  set: (value: boolean) => {
    updateSetting('accessibility', {
      ...settings.value.accessibility,
      reducedMotion: value
    })
    applyAccessibilitySettings()
  }
})

// 主題選擇
function selectTheme(theme: ThemeMode): void {
  if (props.disabled) return
  
  emit('update:modelValue', theme)
  emit('change', theme)
}

// 重置為預設
function resetToDefault(): void {
  selectTheme('auto')
  highContrast.value = false
  reducedMotion.value = false
}

// 偵測系統主題
function detectSystemTheme(): void {
  if (process.client && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemTheme.value = mediaQuery.matches ? 'dark' : 'light'
  }
}

// 應用無障礙設定
function applyAccessibilitySettings(): void {
  if (!process.client) return
  
  const root = document.documentElement
  
  // 高對比度
  root.classList.toggle('high-contrast', highContrast.value)
  
  // 減少動畫
  root.classList.toggle('reduce-motion', reducedMotion.value)
}

// 系統主題監聽
let mediaQuery: MediaQueryList | null = null

onMounted(() => {
  detectSystemTheme()
  applyAccessibilitySettings()
  
  if (process.client && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      systemTheme.value = e.matches ? 'dark' : 'light'
    }
    mediaQuery.addEventListener('change', handleChange)
  }
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', () => {})
  }
})
</script>

<style scoped>
.theme-selector {
  @apply space-y-6;
}

/* 標題區域 */
.selector-header {
  @apply mb-6;
}

.header-content {
  @apply flex items-center gap-4;
}

.header-icon {
  @apply flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl;
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

/* 主題選項 */
.theme-options {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.theme-option {
  @apply relative border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md;
}

.theme-option--active {
  @apply border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md;
}

.theme-option--disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 主題預覽 */
.theme-preview {
  @apply relative w-full h-20 rounded-lg mb-4 overflow-hidden border border-gray-300 dark:border-gray-600;
}

.theme-preview--light {
  @apply bg-white;
}

.theme-preview--light .preview-header {
  @apply bg-gray-100;
}

.theme-preview--light .preview-sidebar {
  @apply bg-gray-200;
}

.theme-preview--light .preview-bar {
  @apply bg-gray-300;
}

.theme-preview--light .preview-line {
  @apply bg-gray-400;
}

.theme-preview--dark {
  @apply bg-gray-900;
}

.theme-preview--dark .preview-header {
  @apply bg-gray-800;
}

.theme-preview--dark .preview-sidebar {
  @apply bg-gray-700;
}

.theme-preview--dark .preview-bar {
  @apply bg-gray-600;
}

.theme-preview--dark .preview-line {
  @apply bg-gray-500;
}

.theme-preview--auto {
  @apply bg-gradient-to-r from-white via-gray-400 to-gray-900;
}

.theme-preview--auto .preview-header {
  @apply bg-gradient-to-r from-gray-100 to-gray-800;
}

.theme-preview--auto .preview-sidebar {
  @apply bg-gradient-to-b from-gray-200 to-gray-700;
}

.preview-header {
  @apply h-3 flex items-center px-2;
}

.preview-circles {
  @apply flex gap-1;
}

.preview-circle {
  @apply w-1.5 h-1.5 rounded-full;
}

.preview-circle--red {
  @apply bg-red-500;
}

.preview-circle--yellow {
  @apply bg-yellow-500;
}

.preview-circle--green {
  @apply bg-green-500;
}

.preview-content {
  @apply flex h-full;
}

.preview-sidebar {
  @apply w-1/4 h-full;
}

.preview-main {
  @apply flex-1 p-2 space-y-1;
}

.preview-bar {
  @apply w-full h-1 rounded;
}

.preview-text {
  @apply space-y-0.5;
}

.preview-line {
  @apply h-0.5 rounded;
}

.preview-line--long {
  @apply w-full;
}

.preview-line--medium {
  @apply w-3/4;
}

.preview-line--short {
  @apply w-1/2;
}

/* 主題資訊 */
.theme-info {
  @apply flex items-start gap-3 relative;
}

.theme-icon {
  @apply flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400;
}

.theme-details {
  @apply flex-1 min-w-0;
}

.theme-name {
  @apply font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.theme-description {
  @apply text-sm text-gray-500 dark:text-gray-400 mb-2;
}

.system-preference {
  @apply flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400;
}

.selected-indicator {
  @apply absolute -top-1 -right-1 w-6 h-6 bg-blue-500 dark:bg-blue-400 text-white rounded-full flex items-center justify-center text-sm;
}

/* 自動模式時程 */
.auto-schedule {
  @apply mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2;
}

.schedule-item {
  @apply flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400;
}

.schedule-time {
  @apply ml-auto font-mono;
}

/* 進階選項 */
.advanced-options {
  @apply space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.option-item {
  @apply relative;
}

.option-label {
  @apply flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.option-checkbox {
  @apply sr-only;
}

.checkbox-custom {
  @apply flex-shrink-0 w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-transparent transition-all duration-200;
}

.option-checkbox:checked + .checkbox-custom {
  @apply bg-blue-500 border-blue-500 text-white;
}

.option-content {
  @apply flex-1;
}

.option-name {
  @apply block font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.option-description {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* 重置區域 */
.reset-section {
  @apply pt-4 border-t border-gray-200 dark:border-gray-700;
}

.reset-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .theme-options {
    @apply grid-cols-1;
  }
  
  .header-content {
    @apply flex-col text-center gap-2;
  }
  
  .header-icon {
    @apply mx-auto;
  }
}

/* 高對比度模式樣式 */
:global(.high-contrast) .theme-option {
  @apply border-4;
}

:global(.high-contrast) .theme-option--active {
  @apply border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30;
}

/* 減少動畫模式樣式 */
:global(.reduce-motion) .theme-option,
:global(.reduce-motion) .option-label,
:global(.reduce-motion) .checkbox-custom,
:global(.reduce-motion) .reset-button {
  @apply transition-none;
}
</style>