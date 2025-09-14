<template>
  <div class="sound-preview">
    <!-- 音效主題選擇 -->
    <div class="theme-selector">
      <h3 class="section-title">音效主題</h3>
      <div class="theme-grid">
        <button
          v-for="theme in availableThemes"
          :key="theme.key"
          class="theme-card"
          :class="{ 'theme-card--active': currentTheme === theme.key }"
          @click="selectTheme(theme.key)"
        >
          <div class="theme-icon">
            <Icon :name="theme.icon" />
          </div>
          <div class="theme-info">
            <h4 class="theme-name">{{ theme.name }}</h4>
            <p class="theme-description">{{ theme.description }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- 音效列表 -->
    <div class="sound-list">
      <h3 class="section-title">音效試聽</h3>
      <div class="sound-grid">
        <div
          v-for="sound in availableSounds"
          :key="sound.type"
          class="sound-item"
          :class="{ 'sound-item--playing': playingSound === sound.type }"
        >
          <!-- 音效資訊 -->
          <div class="sound-info">
            <div class="sound-header">
              <h4 class="sound-name">{{ sound.config.description }}</h4>
              <span class="sound-status" :class="`status--${sound.status}`">
                <Icon 
                  v-if="sound.status === 'loaded'" 
                  name="mdi:check-circle" 
                  class="status-icon" 
                />
                <Icon 
                  v-else-if="sound.status === 'loading'" 
                  name="mdi:loading" 
                  class="status-icon animate-spin" 
                />
                <Icon 
                  v-else-if="sound.status === 'error'" 
                  name="mdi:alert-circle" 
                  class="status-icon" 
                />
                <Icon 
                  v-else 
                  name="mdi:circle-outline" 
                  class="status-icon" 
                />
              </span>
            </div>
            
            <div class="sound-details">
              <span class="sound-type">{{ sound.type }}</span>
              <span class="sound-duration">{{ sound.config.duration }}ms</span>
            </div>
          </div>

          <!-- 音量控制 -->
          <div class="volume-control">
            <Icon name="mdi:volume-low" class="volume-icon" />
            <input
              v-model="sound.volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="volume-slider"
              @input="updateSoundVolume(sound.type, sound.volume)"
            >
            <Icon name="mdi:volume-high" class="volume-icon" />
            <span class="volume-value">{{ Math.round(sound.volume * 100) }}%</span>
          </div>

          <!-- 播放控制 -->
          <div class="play-controls">
            <button
              :disabled="!canPlaySound(sound)"
              class="play-btn"
              :class="{ 
                'play-btn--playing': playingSound === sound.type,
                'play-btn--disabled': !canPlaySound(sound)
              }"
              @click="toggleSound(sound.type)"
            >
              <Icon 
                v-if="playingSound === sound.type" 
                name="mdi:stop" 
                class="play-icon" 
              />
              <Icon 
                v-else 
                name="mdi:play" 
                class="play-icon" 
              />
              {{ playingSound === sound.type ? '停止' : '播放' }}
            </button>
            
            <button
              :disabled="!canPlaySound(sound)"
              class="test-btn"
              @click="testSound(sound.type)"
            >
              <Icon name="mdi:test-tube" class="test-icon" />
              測試
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 全域音量控制 -->
    <div class="master-controls">
      <h3 class="section-title">全域設定</h3>
      
      <div class="master-volume">
        <label class="control-label">
          <Icon name="mdi:volume-high" class="label-icon" />
          主音量
        </label>
        <div class="volume-control volume-control--master">
          <Icon name="mdi:volume-low" class="volume-icon" />
          <input
            v-model="masterVolume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="volume-slider volume-slider--master"
            @input="updateMasterVolume"
          >
          <Icon name="mdi:volume-high" class="volume-icon" />
          <span class="volume-value">{{ Math.round(masterVolume * 100) }}%</span>
        </div>
      </div>

      <div class="sound-toggle">
        <label class="control-label">
          <Icon name="mdi:volume-variant-off" class="label-icon" />
          音效開關
        </label>
        <button
          class="toggle-btn"
          :class="{ 'toggle-btn--active': soundsEnabled }"
          @click="toggleSounds"
        >
          <Icon 
            :name="soundsEnabled ? 'mdi:volume-high' : 'mdi:volume-off'" 
            class="toggle-icon" 
          />
          {{ soundsEnabled ? '已啟用' : '已關閉' }}
        </button>
      </div>

      <!-- 快速音量預設 -->
      <div class="quick-presets">
        <label class="control-label">快速設定</label>
        <div class="preset-buttons">
          <button
            v-for="preset in volumePresets"
            :key="preset.key"
            class="preset-btn"
            :class="{ 'preset-btn--active': isPresetActive(preset.value) }"
            @click="applyVolumePreset(preset.value)"
          >
            <Icon :name="preset.icon" class="preset-icon" />
            {{ preset.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="isLoading" class="loading-overlay">
      <LoadingSpinner variant="water" text="載入音效中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 音效測試與設定元件
 * 提供音效主題選擇、個別音效試聽和音量調整功能
 */

import type { SoundType } from '~/types'

const sounds = useSounds()

// 響應式狀態
const playingSound = ref<SoundType | null>(null)
const currentTheme = ref(sounds.settings.value.theme)
const masterVolume = ref(sounds.settings.value.masterVolume)
const soundsEnabled = ref(sounds.settings.value.enabled)

// 可用主題
const availableThemes = [
  {
    key: 'default' as const,
    name: '預設',
    description: '平衡的音效組合',
    icon: 'mdi:palette'
  },
  {
    key: 'nature' as const,
    name: '自然',
    description: '自然環境音效',
    icon: 'mdi:leaf'
  },
  {
    key: 'electronic' as const,
    name: '電子',
    description: '科技感音效',
    icon: 'mdi:cpu-64-bit'
  },
  {
    key: 'minimal' as const,
    name: '簡約',
    description: '簡潔低調音效',
    icon: 'mdi:circle-outline'
  }
]

// 音量預設
const volumePresets = [
  { key: 'silent', name: '靜音', value: 0, icon: 'mdi:volume-off' },
  { key: 'quiet', name: '安靜', value: 0.3, icon: 'mdi:volume-low' },
  { key: 'normal', name: '正常', value: 0.7, icon: 'mdi:volume-medium' },
  { key: 'loud', name: '響亮', value: 1.0, icon: 'mdi:volume-high' }
]

// 計算屬性
const isLoading = computed(() => sounds.isLoading.value)

const availableSounds = computed(() => {
  return sounds.availableSounds.value.map(sound => ({
    ...sound,
    ...sounds.getSoundInfo(sound.type),
    volume: sounds.settings.value.soundVolumes[sound.type]
  }))
})

// 方法
function canPlaySound(sound: any): boolean {
  return sounds.isSupported.value && sound.status !== 'error' && soundsEnabled.value
}

async function selectTheme(theme: typeof currentTheme.value): Promise<void> {
  if (currentTheme.value === theme) return
  
  // 停止當前播放的音效
  if (playingSound.value) {
    sounds.stopSound(playingSound.value)
    playingSound.value = null
  }
  
  currentTheme.value = theme
  await sounds.setTheme(theme)
}

async function toggleSound(type: SoundType): Promise<void> {
  if (playingSound.value === type) {
    // 停止當前音效
    sounds.stopSound(type)
    playingSound.value = null
  } else {
    // 停止其他音效，播放新音效
    if (playingSound.value) {
      sounds.stopSound(playingSound.value)
    }
    
    const success = await sounds.playSound(type, undefined, { loop: true })
    if (success) {
      playingSound.value = type
      
      // 設定自動停止（避免無限播放）
      setTimeout(() => {
        if (playingSound.value === type) {
          sounds.stopSound(type)
          playingSound.value = null
        }
      }, 5000) // 5秒後自動停止
    }
  }
}

async function testSound(type: SoundType): Promise<void> {
  await sounds.testSound(type)
}

function updateSoundVolume(type: SoundType, volume: number): void {
  sounds.setSoundVolume(type, volume)
}

function updateMasterVolume(): void {
  sounds.setMasterVolume(masterVolume.value)
}

function toggleSounds(): void {
  sounds.toggleSounds()
  soundsEnabled.value = sounds.settings.value.enabled
  
  // 如果關閉音效，停止所有播放中的音效
  if (!soundsEnabled.value && playingSound.value) {
    sounds.stopSound(playingSound.value)
    playingSound.value = null
  }
}

function isPresetActive(presetValue: number): boolean {
  return Math.abs(masterVolume.value - presetValue) < 0.05
}

function applyVolumePreset(volume: number): void {
  masterVolume.value = volume
  sounds.setMasterVolume(volume)
}

// 監聽設定變更
watch(() => sounds.settings.value.masterVolume, (newVolume) => {
  masterVolume.value = newVolume
})

watch(() => sounds.settings.value.enabled, (newEnabled) => {
  soundsEnabled.value = newEnabled
})

watch(() => sounds.settings.value.theme, (newTheme) => {
  currentTheme.value = newTheme
})

// 組件卸載時停止音效
onUnmounted(() => {
  if (playingSound.value) {
    sounds.stopSound(playingSound.value)
  }
})
</script>

<style scoped>
.sound-preview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 章節標題 */
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--color-foreground));
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 主題選擇器 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.theme-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgb(var(--color-background-secondary));
  border: 2px solid rgb(var(--color-border));
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-card:hover {
  border-color: rgb(var(--color-primary));
  box-shadow: 0 4px 12px rgb(var(--color-primary) / 0.1);
}

.theme-card--active {
  border-color: rgb(var(--color-primary));
  background: rgb(var(--color-primary) / 0.05);
  box-shadow: 0 4px 12px rgb(var(--color-primary) / 0.2);
}

.theme-icon {
  font-size: 1.5rem;
  color: rgb(var(--color-primary));
}

.theme-info {
  flex: 1;
  text-align: left;
}

.theme-name {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
  margin-bottom: 0.25rem;
}

.theme-description {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-secondary));
  margin: 0;
}

/* 音效列表 */
.sound-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sound-item {
  padding: 1.5rem;
  background: rgb(var(--color-background-secondary));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.sound-item--playing {
  border-color: rgb(var(--color-success-500));
  background: rgb(var(--color-success-500) / 0.05);
  box-shadow: 0 4px 12px rgb(var(--color-success-500) / 0.1);
}

.sound-info {
  margin-bottom: 1rem;
}

.sound-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sound-name {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
  margin: 0;
}

.sound-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status--loaded {
  color: rgb(var(--color-success-500));
}

.status--loading {
  color: rgb(var(--color-water-500));
}

.status--error {
  color: rgb(var(--color-error-500));
}

.status--idle {
  color: rgb(var(--color-foreground-tertiary));
}

.status-icon {
  font-size: 0.875rem;
}

.sound-details {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: rgb(var(--color-foreground-tertiary));
}

.sound-type {
  font-family: 'SF Mono', monospace;
  background: rgb(var(--color-background-tertiary));
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* 音量控制 */
.volume-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.volume-control--master {
  margin-bottom: 0;
}

.volume-icon {
  font-size: 1rem;
  color: rgb(var(--color-foreground-secondary));
}

.volume-slider {
  flex: 1;
  height: 4px;
  background: rgb(var(--color-border));
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.volume-slider--master {
  height: 6px;
}

.volume-slider--master::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
}

.volume-slider--master::-moz-range-thumb {
  width: 20px;
  height: 20px;
}

.volume-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
  min-width: 2.5rem;
  text-align: right;
}

/* 播放控制 */
.play-controls {
  display: flex;
  gap: 0.75rem;
}

.play-btn,
.test-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgb(var(--color-primary));
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-btn:hover:not(.play-btn--disabled),
.test-btn:hover {
  background: rgb(var(--color-primary-dark));
  transform: translateY(-1px);
}

.play-btn--playing {
  background: rgb(var(--color-warning-500));
}

.play-btn--playing:hover {
  background: rgb(var(--color-warning-600));
}

.play-btn--disabled {
  background: rgb(var(--color-foreground-tertiary));
  cursor: not-allowed;
  opacity: 0.5;
}

.test-btn {
  background: rgb(var(--color-secondary));
}

.test-btn:hover {
  background: rgb(var(--color-secondary-dark));
}

.play-icon,
.test-icon {
  font-size: 1rem;
}

/* 全域控制 */
.master-controls {
  padding: 1.5rem;
  background: rgb(var(--color-background-secondary));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.75rem;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
  margin-bottom: 0.75rem;
}

.label-icon {
  font-size: 1rem;
  color: rgb(var(--color-primary));
}

.master-volume {
  margin-bottom: 2rem;
}

.sound-toggle {
  margin-bottom: 2rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgb(var(--color-background));
  border: 2px solid rgb(var(--color-border));
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--color-foreground));
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  border-color: rgb(var(--color-primary));
}

.toggle-btn--active {
  background: rgb(var(--color-success-500));
  border-color: rgb(var(--color-success-500));
  color: white;
}

.toggle-icon {
  font-size: 1rem;
}

.quick-presets {
  margin-bottom: 0;
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: rgb(var(--color-background));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(var(--color-foreground-secondary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-foreground));
}

.preset-btn--active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: white;
}

.preset-icon {
  font-size: 0.875rem;
}

/* 載入狀態 */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
  
  .play-controls {
    flex-direction: column;
  }
  
  .preset-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>