<template>
  <div class="animation-settings">
    <!-- 標題區域 -->
    <div class="settings-header">
      <h3 class="settings-title">
        <Icon name="mdi:animation" class="title-icon" />
        動畫效果設定
      </h3>
      <p class="settings-description">
        自訂動畫效果以符合您的偏好和需求。減少動畫有助於改善效能和降低視覺干擾
      </p>
    </div>

    <!-- 快速設定 -->
    <div class="quick-presets">
      <h4 class="section-title">快速設定</h4>
      <div class="preset-grid">
        <button
          v-for="preset in animationPresets"
          :key="preset.key"
          class="preset-card"
          :class="{ 'preset-card--active': isPresetActive(preset) }"
          @click="applyPreset(preset)"
        >
          <Icon :name="preset.icon" class="preset-icon" />
          <div class="preset-info">
            <h5 class="preset-name">{{ preset.name }}</h5>
            <p class="preset-description">{{ preset.description }}</p>
          </div>
          <div class="preset-status">
            <Icon 
              v-if="isPresetActive(preset)" 
              name="mdi:check-circle" 
              class="status-icon status-icon--active" 
            />
            <Icon 
              v-else 
              name="mdi:circle-outline" 
              class="status-icon" 
            />
          </div>
        </button>
      </div>
    </div>

    <!-- 詳細動畫控制 -->
    <div class="detailed-controls">
      <h4 class="section-title">詳細控制</h4>
      
      <div class="control-sections">
        <!-- 全域動畫控制 -->
        <div class="control-section">
          <div class="section-header">
            <Icon name="mdi:earth" class="header-icon" />
            <h5 class="section-name">全域動畫</h5>
          </div>
          
          <div class="control-item">
            <div class="control-info">
              <label class="control-label">啟用動畫效果</label>
              <p class="control-description">控制整個應用程式的動畫效果</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.enabled }"
              @click="toggleAnimation('enabled')"
            >
              <div class="toggle-thumb"/>
            </button>
          </div>

          <div class="control-item">
            <div class="control-info">
              <label class="control-label">動畫速度</label>
              <p class="control-description">調整動畫播放速度</p>
            </div>
            <div class="speed-control">
              <select 
                v-model="animationSettings.speed"
                class="speed-select"
                @change="updateAnimationSettings"
              >
                <option value="0.5">慢速 (50%)</option>
                <option value="0.75">較慢 (75%)</option>
                <option value="1">標準 (100%)</option>
                <option value="1.25">較快 (125%)</option>
                <option value="1.5">快速 (150%)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 介面動畫控制 -->
        <div class="control-section">
          <div class="section-header">
            <Icon name="mdi:view-dashboard" class="header-icon" />
            <h5 class="section-name">介面動畫</h5>
          </div>
          
          <div class="control-item">
            <div class="control-info">
              <label class="control-label">頁面轉場</label>
              <p class="control-description">頁面切換時的動畫效果</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.pageTransitions }"
              @click="toggleAnimation('pageTransitions')"
            >
              <div class="toggle-thumb"/>
            </button>
          </div>

          <div class="control-item">
            <div class="control-info">
              <label class="control-label">載入動畫</label>
              <p class="control-description">載入狀態的動畫指示器</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.loadingAnimations }"
              @click="toggleAnimation('loadingAnimations')"
            >
              <div class="toggle-thumb"/>
            </button>
          </div>

          <div class="control-item">
            <div class="control-info">
              <label class="control-label">懸停效果</label>
              <p class="control-description">滑鼠懸停時的視覺回饋</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.hoverEffects }"
              @click="toggleAnimation('hoverEffects')"
            >
              <div class="toggle-thumb"/>
            </button>
          </div>
        </div>

        <!-- 計時器動畫控制 */
        <div class="control-section">
          <div class="section-header">
            <Icon name="mdi:timer" class="header-icon" />
            <h5 class="section-name">計時器動畫</h5>
          </div>
          
          <div class="control-item">
            <div class="control-info">
              <label class="control-label">進度動畫</label>
              <p class="control-description">計時器進度圓環的動畫效果</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.timerAnimations }"
              @click="toggleAnimation('timerAnimations')"
            >
              <div class="toggle-thumb"></div>
            </button>
          </div>

          <div class="control-item">
            <div class="control-info">
              <label class="control-label">脈動效果</label>
              <p class="control-description">計時器運行時的脈動指示</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.pulseEffects }"
              @click="toggleAnimation('pulseEffects')"
            >
              <div class="toggle-thumb"></div>
            </button>
          </div>

          <div class="control-item">
            <div class="control-info">
              <label class="control-label">完成慶祝</label>
              <p class="control-description">計時完成時的慶祝動畫</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.celebrationEffects }"
              @click="toggleAnimation('celebrationEffects')"
            >
              <div class="toggle-thumb"></div>
            </button>
          </div>
        </div>

        <!-- 統計圖表動畫 -->
        <div class="control-section">
          <div class="section-header">
            <Icon name="mdi:chart-line" class="header-icon" />
            <h5 class="section-name">圖表動畫</h5>
          </div>
          
          <div class="control-item">
            <div class="control-info">
              <label class="control-label">圖表進入</label>
              <p class="control-description">統計圖表載入時的動畫</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.chartAnimations }"
              @click="toggleAnimation('chartAnimations')"
            >
              <div class="toggle-thumb"/>
            </button>
          </div>

          <div class="control-item">
            <div class="control-info">
              <label class="control-label">數據更新</label>
              <p class="control-description">統計數據變化時的過渡效果</p>
            </div>
            <button
              class="toggle-switch"
              :class="{ 'toggle-switch--active': animationSettings.dataTransitions }"
              @click="toggleAnimation('dataTransitions')"
            >
              <div class="toggle-thumb"/>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 系統偏好檢測 -->
    <div class="system-preferences">
      <h4 class="section-title">系統偏好</h4>
      <div class="preference-info">
        <div class="preference-item">
          <Icon name="mdi:monitor" class="preference-icon" />
          <div class="preference-text">
            <span class="preference-label">系統動畫偏好</span>
            <span class="preference-value">
              {{ systemPreferencesDetection.reducedMotion ? '減少動畫' : '標準動畫' }}
            </span>
          </div>
        </div>
        
        <button
          class="sync-btn"
          @click="syncWithSystemPreferences"
        >
          <Icon name="mdi:sync" class="sync-icon" />
          同步系統設定
        </button>
      </div>
    </div>

    <!-- 預覽區域 -->
    <div class="animation-preview">
      <h4 class="section-title">動畫預覽</h4>
      <div class="preview-container">
        <div class="preview-items">
          <div 
            class="preview-card" 
            :class="{ 'preview-card--animated': previewEnabled }"
          >
            <Icon name="mdi:water" class="preview-icon" />
            <span class="preview-text">懸停查看效果</span>
          </div>
          
          <div 
            class="preview-progress"
            :class="{ 'preview-progress--animated': previewEnabled }"
          >
            <div class="progress-bar"/>
          </div>
          
          <button
            class="preview-button"
            :class="{ 'preview-button--animated': previewEnabled }"
            @click="triggerPreview"
          >
            <Icon name="mdi:play" class="button-icon" />
            測試動畫
          </button>
        </div>
        
        <div class="preview-controls">
          <button
            class="preview-toggle"
            :class="{ 'preview-toggle--active': previewEnabled }"
            @click="togglePreview"
          >
            <Icon :name="previewEnabled ? 'mdi:pause' : 'mdi:play'" class="toggle-icon" />
            {{ previewEnabled ? '暫停預覽' : '啟用預覽' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 套用狀態 -->
    <div v-if="isApplying" class="applying-status">
      <Icon name="mdi:loading" class="status-icon animate-spin" />
      <span class="status-text">正在套用動畫設定...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 動畫效果控制元件
 * 提供詳細的動畫設定和控制選項
 */

/**
 * 動畫設定介面
 */
interface AnimationSettings {
  enabled: boolean
  speed: number
  pageTransitions: boolean
  loadingAnimations: boolean
  hoverEffects: boolean
  timerAnimations: boolean
  pulseEffects: boolean
  celebrationEffects: boolean
  chartAnimations: boolean
  dataTransitions: boolean
}

/**
 * 動畫預設配置
 */
interface AnimationPreset {
  key: string
  name: string
  description: string
  icon: string
  settings: Partial<AnimationSettings>
}

/**
 * 系統偏好檢測
 */
interface SystemPreferences {
  reducedMotion: boolean
  prefersReducedData: boolean
}

/**
 * 預設動畫設定
 */
const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  enabled: true,
  speed: 1,
  pageTransitions: true,
  loadingAnimations: true,
  hoverEffects: true,
  timerAnimations: true,
  pulseEffects: true,
  celebrationEffects: true,
  chartAnimations: true,
  dataTransitions: true
}

/**
 * 動畫預設配置
 */
const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    key: 'full',
    name: '完整動畫',
    description: '啟用所有動畫效果，提供最豐富的視覺體驗',
    icon: 'mdi:animation-play',
    settings: DEFAULT_ANIMATION_SETTINGS
  },
  {
    key: 'reduced',
    name: '減少動畫',
    description: '保留基本動畫，減少視覺干擾',
    icon: 'mdi:animation',
    settings: {
      enabled: true,
      speed: 0.75,
      pageTransitions: true,
      loadingAnimations: true,
      hoverEffects: false,
      timerAnimations: true,
      pulseEffects: false,
      celebrationEffects: false,
      chartAnimations: false,
      dataTransitions: true
    }
  },
  {
    key: 'minimal',
    name: '最少動畫',
    description: '僅保留必要的載入和轉場動畫',
    icon: 'mdi:minus-circle',
    settings: {
      enabled: true,
      speed: 0.5,
      pageTransitions: true,
      loadingAnimations: true,
      hoverEffects: false,
      timerAnimations: false,
      pulseEffects: false,
      celebrationEffects: false,
      chartAnimations: false,
      dataTransitions: false
    }
  },
  {
    key: 'disabled',
    name: '停用動畫',
    description: '完全停用動畫，最大化效能和可訪問性',
    icon: 'mdi:stop-circle',
    settings: {
      enabled: false,
      speed: 1,
      pageTransitions: false,
      loadingAnimations: false,
      hoverEffects: false,
      timerAnimations: false,
      pulseEffects: false,
      celebrationEffects: false,
      chartAnimations: false,
      dataTransitions: false
    }
  }
]

// 響應式狀態
const animationSettings = ref<AnimationSettings>({ ...DEFAULT_ANIMATION_SETTINGS })
const systemPreferencesDetection = ref<SystemPreferences>({
  reducedMotion: false,
  prefersReducedData: false
})
const isApplying = ref(false)
const previewEnabled = ref(true)

// 計算屬性
const animationPresets = computed(() => ANIMATION_PRESETS)

/**
 * 從本地存儲載入設定
 */
function loadAnimationSettings(): void {
  if (!import.meta.client) return
  
  try {
    const stored = localStorage.getItem('flowsip-animation-settings')
    if (stored) {
      const settings = JSON.parse(stored)
      animationSettings.value = { ...DEFAULT_ANIMATION_SETTINGS, ...settings }
    }
  } catch (error) {
    console.warn('載入動畫設定失敗:', error)
    animationSettings.value = { ...DEFAULT_ANIMATION_SETTINGS }
  }
}

/**
 * 保存設定到本地存儲
 */
function saveAnimationSettings(): void {
  if (!import.meta.client) return
  
  try {
    localStorage.setItem('flowsip-animation-settings', JSON.stringify(animationSettings.value))
  } catch (error) {
    console.error('保存動畫設定失敗:', error)
  }
}

/**
 * 檢測系統動畫偏好
 */
function detectSystemPreferences(): void {
  if (!import.meta.client) return
  
  try {
    // 檢測減少動畫偏好
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    systemPreferencesDetection.value.reducedMotion = reducedMotionQuery.matches
    
    // 檢測減少資料偏好（用於移動裝置）
    const reducedDataQuery = window.matchMedia('(prefers-reduced-data: reduce)')
    systemPreferencesDetection.value.prefersReducedData = reducedDataQuery.matches || false
    
    // 監聽系統偏好變更
    reducedMotionQuery.addListener?.((e) => {
      systemPreferencesDetection.value.reducedMotion = e.matches
      if (e.matches && animationSettings.value.enabled) {
        // 自動切換到減少動畫模式
        applyPreset(ANIMATION_PRESETS.find(p => p.key === 'reduced')!)
      }
    }) || reducedMotionQuery.addEventListener('change', (e) => {
      systemPreferencesDetection.value.reducedMotion = e.matches
    })
    
  } catch (error) {
    console.warn('檢測系統動畫偏好失敗:', error)
  }
}

/**
 * 套用動畫設定到 DOM
 */
async function applyAnimationSettings(): Promise<void> {
  if (!import.meta.client) return
  
  isApplying.value = true
  
  try {
    const html = document.documentElement
    const body = document.body
    
    // 移除所有動畫相關類別
    html.classList.remove(
      'animations-enabled', 'animations-disabled',
      'animations-reduced', 'animations-minimal'
    )
    
    // 設定 CSS 自定義屬性
    html.style.setProperty('--animation-speed', animationSettings.value.speed.toString())
    html.style.setProperty('--animation-enabled', animationSettings.value.enabled ? '1' : '0')
    
    // 應用動畫類別
    if (!animationSettings.value.enabled) {
      html.classList.add('animations-disabled')
      body.style.setProperty('animation', 'none', 'important')
      body.style.setProperty('transition', 'none', 'important')
    } else {
      html.classList.add('animations-enabled')
      body.style.removeProperty('animation')
      body.style.removeProperty('transition')
    }
    
    // 應用具體動畫控制
    html.style.setProperty('--page-transitions', animationSettings.value.pageTransitions ? '1' : '0')
    html.style.setProperty('--loading-animations', animationSettings.value.loadingAnimations ? '1' : '0')
    html.style.setProperty('--hover-effects', animationSettings.value.hoverEffects ? '1' : '0')
    html.style.setProperty('--timer-animations', animationSettings.value.timerAnimations ? '1' : '0')
    html.style.setProperty('--pulse-effects', animationSettings.value.pulseEffects ? '1' : '0')
    html.style.setProperty('--celebration-effects', animationSettings.value.celebrationEffects ? '1' : '0')
    html.style.setProperty('--chart-animations', animationSettings.value.chartAnimations ? '1' : '0')
    html.style.setProperty('--data-transitions', animationSettings.value.dataTransitions ? '1' : '0')
    
    // 保存設定
    saveAnimationSettings()
    
    // 模擬套用時間
    await new Promise(resolve => setTimeout(resolve, 500))
    
  } catch (error) {
    console.error('套用動畫設定失敗:', error)
  } finally {
    isApplying.value = false
  }
}

/**
 * 檢查是否為預設配置
 */
function isPresetActive(preset: AnimationPreset): boolean {
  return Object.keys(preset.settings).every(key => {
    const settingKey = key as keyof AnimationSettings
    return animationSettings.value[settingKey] === preset.settings[settingKey]
  })
}

/**
 * 套用預設配置
 */
async function applyPreset(preset: AnimationPreset): Promise<void> {
  animationSettings.value = { ...animationSettings.value, ...preset.settings }
  await applyAnimationSettings()
}

/**
 * 切換單個動畫設定
 */
async function toggleAnimation(key: keyof AnimationSettings): Promise<void> {
  if (typeof animationSettings.value[key] === 'boolean') {
    (animationSettings.value[key] as boolean) = !(animationSettings.value[key] as boolean)
    await updateAnimationSettings()
  }
}

/**
 * 更新動畫設定
 */
async function updateAnimationSettings(): Promise<void> {
  await applyAnimationSettings()
}

/**
 * 同步系統偏好設定
 */
async function syncWithSystemPreferences(): Promise<void> {
  if (systemPreferencesDetection.value.reducedMotion) {
    await applyPreset(ANIMATION_PRESETS.find(p => p.key === 'reduced')!)
  } else {
    await applyPreset(ANIMATION_PRESETS.find(p => p.key === 'full')!)
  }
}

/**
 * 切換預覽模式
 */
function togglePreview(): void {
  previewEnabled.value = !previewEnabled.value
}

/**
 * 觸發預覽動畫
 */
function triggerPreview(): void {
  if (!previewEnabled.value) return
  
  const previewElements = document.querySelectorAll('.preview-card, .preview-progress, .preview-button')
  previewElements.forEach(element => {
    element.classList.remove('preview-triggered')
    // 強制重繪
    void element.offsetHeight
    element.classList.add('preview-triggered')
  })
  
  // 移除預覽類別
  setTimeout(() => {
    previewElements.forEach(element => {
      element.classList.remove('preview-triggered')
    })
  }, 2000)
}

// 生命週期
onMounted(() => {
  loadAnimationSettings()
  detectSystemPreferences()
  applyAnimationSettings()
})
</script>

<style scoped>
.animation-settings {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 標題區域 */
.settings-header {
  text-align: center;
}

.settings-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--color-foreground));
  margin-bottom: 0.5rem;
}

.title-icon {
  font-size: 1.75rem;
  color: rgb(var(--color-primary));
}

.settings-description {
  color: rgb(var(--color-foreground-secondary));
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 600px;
  margin: 0 auto;
}

/* 區段標題 */
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
  margin-bottom: 1rem;
}

/* 快速預設 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgb(var(--color-background));
  border: 2px solid rgb(var(--color-border));
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-card:hover {
  border-color: rgb(var(--color-primary));
  box-shadow: 0 4px 12px rgb(var(--color-primary) / 0.1);
}

.preset-card--active {
  border-color: rgb(var(--color-primary));
  background: rgb(var(--color-primary) / 0.05);
  box-shadow: 0 4px 12px rgb(var(--color-primary) / 0.2);
}

.preset-icon {
  font-size: 2rem;
  color: rgb(var(--color-primary));
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
  margin-bottom: 0.25rem;
}

.preset-description {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-secondary));
  line-height: 1.4;
}

.preset-status {
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 1.5rem;
  color: rgb(var(--color-border-secondary));
  transition: color 0.2s ease;
}

.status-icon--active {
  color: rgb(var(--color-primary));
}

/* 詳細控制 */
.control-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.control-section {
  padding: 1.5rem;
  background: rgb(var(--color-background-secondary));
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--color-border));
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.header-icon {
  font-size: 1.25rem;
  color: rgb(var(--color-primary));
}

.section-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgb(var(--color-border));
}

.control-item:last-child {
  border-bottom: none;
}

.control-info {
  flex: 1;
}

.control-label {
  font-size: 1rem;
  font-weight: 500;
  color: rgb(var(--color-foreground));
  display: block;
  margin-bottom: 0.25rem;
}

.control-description {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-secondary));
  line-height: 1.4;
}

/* 切換開關 */
.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  background: rgb(var(--color-border-secondary));
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle-switch--active {
  background: rgb(var(--color-primary));
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgb(var(--color-shadow) / 0.2);
}

.toggle-switch--active .toggle-thumb {
  transform: translateX(24px);
}

/* 速度選擇 */
.speed-control {
  min-width: 140px;
}

.speed-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgb(var(--color-background));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.5rem;
  color: rgb(var(--color-foreground));
  font-size: 0.875rem;
  cursor: pointer;
}

.speed-select:focus {
  border-color: rgb(var(--color-primary));
  outline: none;
  box-shadow: 0 0 0 3px rgb(var(--color-primary) / 0.1);
}

/* 系統偏好 */
.preference-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgb(var(--color-background-secondary));
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--color-border));
}

.preference-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preference-icon {
  font-size: 1.25rem;
  color: rgb(var(--color-primary));
}

.preference-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preference-label {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-secondary));
}

.preference-value {
  font-size: 1rem;
  font-weight: 500;
  color: rgb(var(--color-foreground));
}

.sync-btn {
  display: flex;
  align-items: center;
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

.sync-btn:hover {
  background: rgb(var(--color-primary-dark));
  transform: translateY(-1px);
}

.sync-icon {
  font-size: 1rem;
}

/* 預覽區域 */
.preview-container {
  padding: 2rem;
  background: rgb(var(--color-background-secondary));
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--color-border));
}

.preview-items {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgb(var(--color-background));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-card--animated:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgb(var(--color-shadow) / 0.1);
}

.preview-card.preview-triggered {
  animation: cardBounce 1s ease;
}

.preview-icon {
  font-size: 2rem;
  color: rgb(var(--color-primary));
}

.preview-text {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-secondary));
}

.preview-progress {
  width: 120px;
  height: 8px;
  background: rgb(var(--color-border));
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  width: 60%;
  height: 100%;
  background: rgb(var(--color-primary));
  transition: width 0.3s ease;
}

.preview-progress--animated .progress-bar {
  animation: progressSlide 2s ease-in-out infinite;
}

.preview-progress.preview-triggered .progress-bar {
  animation: progressFull 1s ease;
}

.preview-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgb(var(--color-primary));
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-button--animated:hover {
  background: rgb(var(--color-primary-dark));
  transform: scale(1.05);
}

.preview-button.preview-triggered {
  animation: buttonPress 0.5s ease;
}

.button-icon {
  font-size: 1rem;
}

.preview-controls {
  display: flex;
  justify-content: center;
}

.preview-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgb(var(--color-background));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.5rem;
  color: rgb(var(--color-foreground));
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-toggle:hover {
  border-color: rgb(var(--color-primary));
}

.preview-toggle--active {
  background: rgb(var(--color-primary) / 0.1);
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
}

.toggle-icon {
  font-size: 1rem;
}

/* 套用狀態 */
.applying-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgb(var(--color-primary) / 0.1);
  border-radius: 0.5rem;
  color: rgb(var(--color-primary));
  font-weight: 500;
}

/* 動畫關鍵幀 */
@keyframes cardBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes progressSlide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}

@keyframes progressFull {
  0% { width: 60%; }
  50% { width: 100%; }
  100% { width: 60%; }
}

@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .preset-grid {
    grid-template-columns: 1fr;
  }
  
  .control-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .preview-items {
    flex-direction: column;
    gap: 1rem;
  }
  
  .preference-info {
    flex-direction: column;
    gap: 1rem;
  }
}

/* 無動畫模式樣式調整 */
.animations-disabled .preview-card--animated:hover,
.animations-disabled .preview-button--animated:hover {
  transform: none;
}

.animations-disabled .preview-progress--animated .progress-bar {
  animation: none;
}
</style>