<template>
  <div class="sound-settings">
    <!-- 標題區域 -->
    <div class="settings-header">
      <div class="header-content">
        <div class="header-icon">
          <Icon name="mdi:volume-high" />
        </div>
        <div class="header-text">
          <h3 class="header-title">音效設定</h3>
          <p class="header-description">調整提醒音效和音量</p>
        </div>
        <div class="header-controls">
          <button
            class="toggle-button"
            :class="{ 'toggle-button--active': soundEnabled }"
            @click="toggleSound"
          >
            <Icon :name="soundEnabled ? 'mdi:volume-high' : 'mdi:volume-off'" />
          </button>
        </div>
      </div>
    </div>

    <!-- 總開關和音量控制 -->
    <div class="main-controls">
      <!-- 音效總開關 -->
      <div class="control-group">
        <label class="control-label">
          <input
            v-model="soundEnabled"
            type="checkbox"
            class="control-checkbox"
          >
          <div class="checkbox-custom">
            <Icon name="mdi:check" />
          </div>
          <div class="control-content">
            <span class="control-name">啟用音效</span>
            <span class="control-description">開啟或關閉所有音效提醒</span>
          </div>
        </label>
      </div>

      <!-- 音量控制 -->
      <div v-if="soundEnabled" class="volume-control">
        <div class="volume-header">
          <label class="volume-label">
            <Icon name="mdi:volume-medium" />
            <span>音量</span>
          </label>
          <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
        </div>
        <div class="volume-slider-container">
          <Icon name="mdi:volume-low" class="volume-icon-left" />
          <input
            v-model.number="volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="volume-slider"
            :disabled="!soundEnabled"
          >
          <Icon name="mdi:volume-high" class="volume-icon-right" />
        </div>
        <div class="volume-presets">
          <button
            v-for="preset in volumePresets"
            :key="preset.value"
            class="volume-preset"
            :class="{ 'volume-preset--active': Math.abs(volume - preset.value) < 0.05 }"
            @click="volume = preset.value"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 音效選項 -->
    <div v-if="soundEnabled" class="sound-options">
      <h4 class="section-title">音效類型</h4>
      
      <div class="sound-list">
        <div
          v-for="(soundConfig, soundType) in soundTypes"
          :key="soundType"
          class="sound-item"
        >
          <div class="sound-info">
            <div class="sound-icon">
              <Icon :name="soundConfig.icon" />
            </div>
            <div class="sound-details">
              <h5 class="sound-name">{{ soundConfig.name }}</h5>
              <p class="sound-description">{{ soundConfig.description }}</p>
            </div>
          </div>
          
          <div class="sound-controls">
            <!-- 音效選擇下拉選單 -->
            <div class="sound-selector">
              <select
                :value="sounds.sounds[soundType as keyof typeof sounds.sounds]"
                class="sound-select"
                @change="updateSoundFile(soundType as keyof typeof sounds.sounds, $event)"
              >
                <option
                  v-for="option in soundConfig.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.name }}
                </option>
              </select>
            </div>
            
            <!-- 測試按鈕 -->
            <button
              class="test-button"
              :disabled="testingSound === soundType || !soundEnabled"
              @click="testSoundEffect(soundType as keyof typeof sounds.sounds)"
            >
              <Icon
                :name="testingSound === soundType ? 'mdi:loading' : 'mdi:play'"
                :class="{ 'animate-spin': testingSound === soundType }"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 進階選項 -->
    <div v-if="soundEnabled" class="advanced-section">
      <h4 class="section-title">進階設定</h4>
      
      <div class="advanced-options">
        <div class="option-item">
          <label class="option-label">
            <input
              v-model="fadeInEffect"
              type="checkbox"
              class="option-checkbox"
            >
            <div class="checkbox-custom">
              <Icon name="mdi:check" />
            </div>
            <div class="option-content">
              <span class="option-name">淡入效果</span>
              <span class="option-description">音效播放時逐漸增大音量</span>
            </div>
          </label>
        </div>

        <div class="option-item">
          <label class="option-label">
            <input
              v-model="repeatSound"
              type="checkbox"
              class="option-checkbox"
            >
            <div class="checkbox-custom">
              <Icon name="mdi:check" />
            </div>
            <div class="option-content">
              <span class="option-name">重複播放</span>
              <span class="option-description">重要提醒時重複播放音效</span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- 測試區域 -->
    <div class="test-section">
      <h4 class="section-title">音效測試</h4>
      <div class="test-controls">
        <button
          class="test-all-button"
          :disabled="!soundEnabled || testingAll"
          @click="testAllSounds"
        >
          <Icon
            :name="testingAll ? 'mdi:loading' : 'mdi:play-circle'"
            :class="{ 'animate-spin': testingAll }"
          />
          <span>{{ testingAll ? '測試中...' : '測試所有音效' }}</span>
        </button>
        
        <div class="test-info">
          <p class="test-description">
            點擊按鈕測試所有音效，確保音量和選擇適合
          </p>
        </div>
      </div>
    </div>

    <!-- 重置區域 -->
    <div class="reset-section">
      <button
        class="reset-button"
        :disabled="isLoading"
        @click="resetSoundSettings"
      >
        <Icon name="mdi:restore" />
        <span>重置音效設定</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { SoundSettings } from '~/types'

interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'test-sound', soundType: keyof SoundSettings['sounds']): void
  (e: 'settings-changed', settings: Partial<SoundSettings>): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

// 使用設定管理
const { settings, updateSoundSettings, testSound, isLoading } = useSettings()

// 本地狀態
const testingSound = ref<string | null>(null)
const testingAll = ref(false)

// 音效設定
const sounds = computed(() => settings.value.sounds)

const soundEnabled = computed({
  get: () => sounds.value.enabled,
  set: (value: boolean) => {
    updateSoundSettings({ enabled: value })
  }
})

const volume = computed({
  get: () => sounds.value.volume,
  set: (value: number) => {
    updateSoundSettings({ volume: Math.max(0, Math.min(1, value)) })
  }
})

// 進階選項（這裡模擬，實際可能需要擴展 SoundSettings 型別）
const fadeInEffect = ref(false)
const repeatSound = ref(false)

// 音量預設值
const volumePresets = [
  { label: '靜音', value: 0 },
  { label: '低', value: 0.3 },
  { label: '中', value: 0.7 },
  { label: '高', value: 1.0 }
]

// 音效類型配置
const soundTypes = {
  complete: {
    name: '完成提醒',
    description: '計時結束時播放',
    icon: 'mdi:check-circle',
    options: [
      { name: '鈴鐺', value: '/sounds/bell.mp3' },
      { name: '提示音', value: '/sounds/complete.mp3' },
      { name: '成功音', value: '/sounds/success.mp3' },
      { name: '優雅鈴聲', value: '/sounds/elegant.mp3' }
    ]
  },
  warning: {
    name: '警告提醒',
    description: '時間即將結束時播放',
    icon: 'mdi:alert-circle',
    options: [
      { name: '警告音', value: '/sounds/warning.mp3' },
      { name: '輕柔提醒', value: '/sounds/gentle-warning.mp3' },
      { name: '注意音', value: '/sounds/attention.mp3' }
    ]
  },
  start: {
    name: '開始提醒',
    description: '計時開始時播放',
    icon: 'mdi:play-circle',
    options: [
      { name: '開始音', value: '/sounds/start.mp3' },
      { name: '啟動音', value: '/sounds/power-on.mp3' },
      { name: '準備音', value: '/sounds/ready.mp3' }
    ]
  },
  pause: {
    name: '暫停提醒',
    description: '計時暫停時播放',
    icon: 'mdi:pause-circle',
    options: [
      { name: '暫停音', value: '/sounds/pause.mp3' },
      { name: '停止音', value: '/sounds/stop.mp3' },
      { name: '中斷音', value: '/sounds/break.mp3' }
    ]
  },
  tick: {
    name: '計時滴答',
    description: '計時過程中的節拍音',
    icon: 'mdi:metronome',
    options: [
      { name: '傳統滴答', value: '/sounds/tick.mp3' },
      { name: '數位嗶聲', value: '/sounds/beep.mp3' },
      { name: '輕柔節拍', value: '/sounds/soft-tick.mp3' },
      { name: '關閉', value: '' }
    ]
  }
}

// 方法
function toggleSound(): void {
  soundEnabled.value = !soundEnabled.value
}

function updateSoundFile(soundType: keyof SoundSettings['sounds'], event: Event): void {
  const target = event.target as HTMLSelectElement
  const newSounds = {
    ...sounds.value.sounds,
    [soundType]: target.value
  }
  updateSoundSettings({ sounds: newSounds })
}

async function testSoundEffect(soundType: keyof SoundSettings['sounds']): Promise<void> {
  if (!soundEnabled.value || props.disabled) return
  
  try {
    testingSound.value = soundType
    await testSound(soundType)
    emit('test-sound', soundType)
  } catch (error) {
    console.error(`測試音效 ${soundType} 失敗:`, error)
    // 可以在這裡顯示錯誤提示
  } finally {
    // 延遲重置，讓使用者看到載入狀態
    await new Promise(resolve => setTimeout(resolve, 500))
    testingSound.value = null
  }
}

async function testAllSounds(): Promise<void> {
  if (!soundEnabled.value || props.disabled) return
  
  try {
    testingAll.value = true
    
    // 按順序播放所有音效
    const soundSequence = Object.keys(soundTypes) as (keyof SoundSettings['sounds'])[]
    
    for (const soundType of soundSequence) {
      if (sounds.value.sounds[soundType]) { // 只播放有設定的音效
        testingSound.value = soundType
        await testSound(soundType)
        
        // 等待音效播放完畢
        await new Promise(resolve => setTimeout(resolve, 1000))
        testingSound.value = null
        
        // 短暫停頓
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  } catch (error) {
    console.error('測試所有音效失敗:', error)
  } finally {
    testingAll.value = false
    testingSound.value = null
  }
}

function resetSoundSettings(): void {
  updateSoundSettings({
    enabled: true,
    volume: 0.7,
    sounds: {
      complete: '/sounds/complete.mp3',
      warning: '/sounds/warning.mp3',
      tick: '/sounds/tick.mp3',
      start: '/sounds/start.mp3',
      pause: '/sounds/pause.mp3'
    }
  })
  
  fadeInEffect.value = false
  repeatSound.value = false
}

// 發送設定變更事件
watch([soundEnabled, volume, fadeInEffect, repeatSound], () => {
  const changedSettings: Partial<SoundSettings> = {
    enabled: soundEnabled.value,
    volume: volume.value
  }
  emit('settings-changed', changedSettings)
}, { deep: true })
</script>

<style scoped>
.sound-settings {
  @apply space-y-6;
}

/* 標題區域 */
.settings-header {
  @apply mb-6;
}

.header-content {
  @apply flex items-center gap-4;
}

.header-icon {
  @apply flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 text-xl;
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

.header-controls {
  @apply flex-shrink-0;
}

.toggle-button {
  @apply w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors;
}

.toggle-button--active {
  @apply border-green-500 bg-green-500 text-white hover:bg-green-600;
}

/* 主要控制區域 */
.main-controls {
  @apply space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl;
}

.control-group {
  @apply relative;
}

.control-label {
  @apply flex items-start gap-3 cursor-pointer;
}

.control-checkbox {
  @apply sr-only;
}

.checkbox-custom {
  @apply flex-shrink-0 w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-transparent transition-all duration-200;
}

.control-checkbox:checked + .checkbox-custom {
  @apply bg-green-500 border-green-500 text-white;
}

.control-content {
  @apply flex-1;
}

.control-name {
  @apply block font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.control-description {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* 音量控制 */
.volume-control {
  @apply space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.volume-header {
  @apply flex items-center justify-between;
}

.volume-label {
  @apply flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300;
}

.volume-value {
  @apply text-sm font-mono text-gray-500 dark:text-gray-400;
}

.volume-slider-container {
  @apply flex items-center gap-3;
}

.volume-icon-left,
.volume-icon-right {
  @apply flex-shrink-0 text-gray-400 dark:text-gray-500;
}

.volume-slider {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer;
}

.volume-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-green-500 rounded-full cursor-pointer shadow-md;
}

.volume-slider::-moz-range-thumb {
  @apply w-4 h-4 bg-green-500 rounded-full cursor-pointer shadow-md border-0;
}

.volume-presets {
  @apply flex gap-2;
}

.volume-preset {
  @apply px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors;
}

.volume-preset--active {
  @apply bg-green-500 text-white hover:bg-green-600;
}

/* 音效選項 */
.sound-options {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4;
}

.sound-list {
  @apply space-y-3;
}

.sound-item {
  @apply flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.sound-info {
  @apply flex items-center gap-3;
}

.sound-icon {
  @apply flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400;
}

.sound-details {
  @apply min-w-0;
}

.sound-name {
  @apply font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.sound-description {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.sound-controls {
  @apply flex items-center gap-2;
}

.sound-selector {
  @apply relative;
}

.sound-select {
  @apply px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent;
}

.test-button {
  @apply w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

/* 進階選項 */
.advanced-section {
  @apply space-y-4;
}

.advanced-options {
  @apply space-y-3;
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

.option-content {
  @apply flex-1;
}

.option-name {
  @apply block font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.option-description {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* 測試區域 */
.test-section {
  @apply space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800;
}

.test-controls {
  @apply flex flex-col sm:flex-row sm:items-center gap-4;
}

.test-all-button {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.test-info {
  @apply flex-1;
}

.test-description {
  @apply text-sm text-blue-700 dark:text-blue-300;
}

/* 重置區域 */
.reset-section {
  @apply pt-4 border-t border-gray-200 dark:border-gray-700;
}

.reset-button {
  @apply flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* 動畫 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 響應式設計 */
@media (max-width: 640px) {
  .sound-item {
    @apply flex-col items-start gap-3;
  }
  
  .sound-controls {
    @apply w-full justify-between;
  }
  
  .sound-select {
    @apply flex-1 min-w-0;
  }
}
</style>