<template>
  <div class="font-size-settings">
    <!-- 標題區域 -->
    <div class="settings-header">
      <h3 class="settings-title">
        <Icon name="mdi:format-size" class="title-icon" />
        字型大小設定
      </h3>
      <p class="settings-description">
        調整介面文字大小以改善閱讀體驗，特別適合視力需要額外協助的使用者
      </p>
    </div>

    <!-- 當前字型大小顯示 -->
    <div class="current-size-display">
      <div class="size-preview" :style="previewStyles">
        <div class="preview-text">
          <h4 class="preview-title">FlowSip 計時器</h4>
          <p class="preview-content">25:00</p>
          <span class="preview-small">番茄鐘專注時間</span>
        </div>
      </div>
      
      <div class="size-info">
        <span class="size-label">目前大小</span>
        <span class="size-value">{{ currentSizeInfo.name }}</span>
        <span class="size-percentage">({{ Math.round(currentFontScale * 100) }}%)</span>
      </div>
    </div>

    <!-- 字型大小選擇器 -->
    <div class="size-selector">
      <label class="selector-label">
        <Icon name="mdi:format-font-size-increase" class="label-icon" />
        選擇字型大小
      </label>
      
      <div class="size-options">
        <button
          v-for="size in availableSizes"
          :key="size.key"
          class="size-option"
          :class="{ 
            'size-option--active': currentFontSize === size.key,
            'size-option--recommended': size.recommended 
          }"
          @click="setFontSize(size.key)"
        >
          <Icon :name="size.icon" class="option-icon" />
          <div class="option-info">
            <span class="option-name">{{ size.name }}</span>
            <span class="option-description">{{ size.description }}</span>
            <span v-if="size.recommended" class="option-badge">推薦</span>
          </div>
          <span class="option-scale">{{ Math.round(size.scale * 100) }}%</span>
        </button>
      </div>
    </div>

    <!-- 細節調整滑桿 */
    <div class="fine-adjustment">
      <label class="adjustment-label">
        <Icon name="mdi:tune" class="label-icon" />
        精細調整
      </label>
      
      <div class="slider-container">
        <div class="slider-info">
          <span class="slider-min">{{ Math.round(FONT_SCALE_RANGE.min * 100) }}%</span>
          <span class="slider-current">{{ Math.round(currentFontScale * 100) }}%</span>
          <span class="slider-max">{{ Math.round(FONT_SCALE_RANGE.max * 100) }}%</span>
        </div>
        
        <input
          v-model.number="customFontScale"
          type="range"
          :min="FONT_SCALE_RANGE.min"
          :max="FONT_SCALE_RANGE.max"
          :step="FONT_SCALE_RANGE.step"
          class="font-slider"
          @input="handleSliderChange"
        >
        
        <div class="slider-marks">
          <div 
            v-for="mark in sliderMarks"
            :key="mark.value"
            class="slider-mark"
            :style="{ left: `${((mark.value - FONT_SCALE_RANGE.min) / (FONT_SCALE_RANGE.max - FONT_SCALE_RANGE.min)) * 100}%` }"
          >
            <div class="mark-tick"></div>
            <span class="mark-label">{{ mark.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速重置選項 -->
    <div class="reset-options">
      <button
        class="reset-btn reset-btn--system"
        @click="resetToSystem"
      >
        <Icon name="mdi:monitor" class="btn-icon" />
        使用系統設定
      </button>
      
      <button
        class="reset-btn reset-btn--default"
        @click="resetToDefault"
      >
        <Icon name="mdi:refresh" class="btn-icon" />
        重置為預設
      </button>
    </div>

    <!-- 無障礙提示 -->
    <div class="accessibility-info">
      <div class="info-header">
        <Icon name="mdi:human" class="info-icon" />
        <span class="info-title">無障礙建議</span>
      </div>
      <ul class="info-list">
        <li>建議字型大小至少為標準大小的 120% 以改善可讀性</li>
        <li>過大的字型可能會影響版面配置，請適度調整</li>
        <li>系統設定會自動跟隨您的作業系統偏好</li>
        <li>變更會立即套用到整個應用程式</li>
      </ul>
    </div>

    <!-- 套用狀態指示 -->
    <div v-if="isApplying" class="applying-status">
      <Icon name="mdi:loading" class="status-icon animate-spin" />
      <span class="status-text">正在套用字型設定...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 字型大小調整元件
 * 提供無障礙的字型大小調整功能
 */

/**
 * 字型大小配置介面
 */
interface FontSizeConfig {
  key: string
  name: string
  description: string
  scale: number
  icon: string
  recommended?: boolean
}

/**
 * 字型大小範圍常數
 */
const FONT_SCALE_RANGE = {
  min: 0.75,
  max: 2.0,
  step: 0.05,
  default: 1.0
}

/**
 * 可用字型大小選項
 */
const AVAILABLE_FONT_SIZES: FontSizeConfig[] = [
  {
    key: 'small',
    name: '小',
    description: '適合螢幕空間有限時使用',
    scale: 0.875,
    icon: 'mdi:format-font-size-decrease'
  },
  {
    key: 'normal',
    name: '標準',
    description: '預設的舒適字型大小',
    scale: 1.0,
    icon: 'mdi:format-size',
    recommended: true
  },
  {
    key: 'large',
    name: '大',
    description: '改善可讀性的較大字型',
    scale: 1.25,
    icon: 'mdi:format-font-size-increase'
  },
  {
    key: 'xlarge',
    name: '特大',
    description: '視力輔助的大字型',
    scale: 1.5,
    icon: 'mdi:format-font-size-increase'
  },
  {
    key: 'accessibility',
    name: '無障礙',
    description: '符合無障礙標準的最大字型',
    scale: 1.75,
    icon: 'mdi:human'
  }
]

/**
 * 滑桿標記
 */
const SLIDER_MARKS = [
  { value: 0.75, label: '75%' },
  { value: 1.0, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2.0, label: '200%' }
]

// 響應式狀態
const currentFontSize = ref<string>('normal')
const currentFontScale = ref<number>(1.0)
const customFontScale = ref<number>(1.0)
const isApplying = ref(false)
const followSystemSetting = ref(false)

// 計算屬性
const availableSizes = computed(() => AVAILABLE_FONT_SIZES)
const sliderMarks = computed(() => SLIDER_MARKS)

const currentSizeInfo = computed(() => {
  return availableSizes.value.find(size => size.key === currentFontSize.value) || availableSizes.value[1]
})

const previewStyles = computed(() => ({
  fontSize: `${currentFontScale.value}rem`,
  '--font-scale': currentFontScale.value.toString()
}))

/**
 * 從本地存儲載入設定
 */
function loadFontSettings(): void {
  if (!import.meta.client) return
  
  try {
    const stored = localStorage.getItem('flowsip-font-settings')
    if (stored) {
      const settings = JSON.parse(stored)
      currentFontSize.value = settings.size || 'normal'
      currentFontScale.value = settings.scale || 1.0
      customFontScale.value = currentFontScale.value
      followSystemSetting.value = settings.followSystem || false
    }
  } catch (error) {
    console.warn('載入字型設定失敗:', error)
    resetToDefault()
  }
}

/**
 * 保存設定到本地存儲
 */
function saveFontSettings(): void {
  if (!import.meta.client) return
  
  try {
    const settings = {
      size: currentFontSize.value,
      scale: currentFontScale.value,
      followSystem: followSystemSetting.value,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('flowsip-font-settings', JSON.stringify(settings))
  } catch (error) {
    console.error('保存字型設定失敗:', error)
  }
}

/**
 * 檢測系統字型設定
 */
function detectSystemFontSize(): number {
  if (!import.meta.client) return 1.0
  
  try {
    // 檢測系統字型縮放偏好
    const testElement = document.createElement('div')
    testElement.style.font = '16px system-ui'
    testElement.style.position = 'absolute'
    testElement.style.visibility = 'hidden'
    testElement.textContent = 'Test'
    
    document.body.appendChild(testElement)
    const computedSize = window.getComputedStyle(testElement).fontSize
    document.body.removeChild(testElement)
    
    const pixelSize = parseFloat(computedSize)
    return Math.round((pixelSize / 16) * 100) / 100 // 相對於 16px 基準
  } catch (error) {
    console.warn('檢測系統字型大小失敗:', error)
    return 1.0
  }
}

/**
 * 套用字型大小到 DOM
 */
async function applyFontSize(): Promise<void> {
  if (!import.meta.client) return
  
  isApplying.value = true
  
  try {
    const html = document.documentElement
    
    // 設定 CSS 自定義屬性
    html.style.setProperty('--font-scale', currentFontScale.value.toString())
    html.style.setProperty('--font-size-base', `${currentFontScale.value}rem`)
    
    // 添加字型大小類別
    html.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge', 'font-accessibility')
    html.classList.add(`font-${currentFontSize.value}`)
    
    // 更新 meta viewport（行動裝置優化）
    updateViewportMeta()
    
    // 保存設定
    saveFontSettings()
    
    // 模擬套用時間（UX）
    await new Promise(resolve => setTimeout(resolve, 300))
    
  } catch (error) {
    console.error('套用字型大小失敗:', error)
  } finally {
    isApplying.value = false
  }
}

/**
 * 更新 viewport meta（行動裝置字型優化）
 */
function updateViewportMeta(): void {
  try {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.name = 'viewport'
      document.head.appendChild(viewportMeta)
    }
    
    // 根據字型大小調整初始縮放
    const scale = Math.min(1.0, 1.0 / Math.max(1.0, currentFontScale.value * 0.8))
    viewportMeta.content = `width=device-width, initial-scale=${scale}, user-scalable=yes`
    
  } catch (error) {
    console.warn('更新 viewport meta 失敗:', error)
  }
}

/**
 * 設定字型大小
 */
async function setFontSize(sizeKey: string): Promise<void> {
  const sizeConfig = availableSizes.value.find(size => size.key === sizeKey)
  if (!sizeConfig) return
  
  currentFontSize.value = sizeKey
  currentFontScale.value = sizeConfig.scale
  customFontScale.value = sizeConfig.scale
  followSystemSetting.value = false
  
  await applyFontSize()
}

/**
 * 處理滑桿變更
 */
function handleSliderChange(): void {
  currentFontScale.value = customFontScale.value
  
  // 找到最接近的預設大小
  const closest = availableSizes.value.reduce((prev, curr) => {
    return Math.abs(curr.scale - currentFontScale.value) < Math.abs(prev.scale - currentFontScale.value) 
      ? curr : prev
  })
  
  currentFontSize.value = Math.abs(closest.scale - currentFontScale.value) < 0.1 ? closest.key : 'custom'
  followSystemSetting.value = false
  
  // 防抖套用
  clearTimeout(applyTimeout)
  applyTimeout = setTimeout(applyFontSize, 150)
}

let applyTimeout: number | null = null

/**
 * 重置為系統設定
 */
async function resetToSystem(): Promise<void> {
  const systemScale = detectSystemFontSize()
  
  currentFontScale.value = systemScale
  customFontScale.value = systemScale
  followSystemSetting.value = true
  
  // 找到最接近的預設大小
  const closest = availableSizes.value.reduce((prev, curr) => {
    return Math.abs(curr.scale - systemScale) < Math.abs(prev.scale - systemScale) ? curr : prev
  })
  currentFontSize.value = closest.key
  
  await applyFontSize()
}

/**
 * 重置為預設設定
 */
async function resetToDefault(): Promise<void> {
  currentFontSize.value = 'normal'
  currentFontScale.value = 1.0
  customFontScale.value = 1.0
  followSystemSetting.value = false
  
  await applyFontSize()
}

// 生命週期
onMounted(() => {
  loadFontSettings()
  
  // 如果設定跟隨系統，檢測系統設定
  if (followSystemSetting.value) {
    resetToSystem()
  } else {
    applyFontSize()
  }
})

onUnmounted(() => {
  if (applyTimeout) {
    clearTimeout(applyTimeout)
  }
})
</script>

<style scoped>
.font-size-settings {
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

/* 當前大小顯示 */
.current-size-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  padding: 2rem;
  background: rgb(var(--color-background-secondary));
  border-radius: 1rem;
  border: 1px solid rgb(var(--color-border));
}

.size-preview {
  padding: 1.5rem;
  background: rgb(var(--color-background));
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--color-border));
  min-width: 200px;
  text-align: center;
}

.preview-title {
  font-size: calc(1.25rem * var(--font-scale, 1));
  font-weight: 600;
  color: rgb(var(--color-foreground));
  margin-bottom: 0.5rem;
}

.preview-content {
  font-size: calc(2rem * var(--font-scale, 1));
  font-weight: 700;
  color: rgb(var(--color-primary));
  font-family: 'SF Mono', monospace;
  margin-bottom: 0.5rem;
}

.preview-small {
  font-size: calc(0.875rem * var(--font-scale, 1));
  color: rgb(var(--color-foreground-secondary));
}

.size-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.size-label {
  font-size: 0.75rem;
  color: rgb(var(--color-foreground-tertiary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.size-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
}

.size-percentage {
  font-size: 0.875rem;
  color: rgb(var(--color-primary));
  font-weight: 500;
}

/* 大小選擇器 */
.size-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
}

.label-icon {
  font-size: 1.25rem;
  color: rgb(var(--color-primary));
}

.size-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.75rem;
}

.size-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgb(var(--color-background));
  border: 2px solid rgb(var(--color-border));
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.size-option:hover {
  border-color: rgb(var(--color-primary));
  box-shadow: 0 4px 12px rgb(var(--color-primary) / 0.1);
}

.size-option--active {
  border-color: rgb(var(--color-primary));
  background: rgb(var(--color-primary) / 0.05);
  box-shadow: 0 4px 12px rgb(var(--color-primary) / 0.2);
}

.size-option--recommended::after {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  background: rgb(var(--color-success-500));
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgb(var(--color-background));
}

.option-icon {
  font-size: 1.5rem;
  color: rgb(var(--color-primary));
}

.option-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-name {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
}

.option-description {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-secondary));
}

.option-badge {
  font-size: 0.75rem;
  color: rgb(var(--color-success-500));
  font-weight: 500;
}

.option-scale {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-tertiary));
  font-weight: 500;
}

/* 細節調整 */
.fine-adjustment {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.adjustment-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
}

.slider-container {
  position: relative;
  padding: 1rem 0;
}

.slider-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: rgb(var(--color-foreground-tertiary));
}

.slider-current {
  color: rgb(var(--color-primary));
  font-weight: 600;
}

.font-slider {
  width: 100%;
  height: 6px;
  background: rgb(var(--color-border));
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.font-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgb(var(--color-shadow) / 0.2);
}

.font-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgb(var(--color-shadow) / 0.2);
}

.slider-marks {
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  height: 20px;
}

.slider-mark {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
}

.mark-tick {
  width: 2px;
  height: 8px;
  background: rgb(var(--color-border-secondary));
  border-radius: 1px;
}

.mark-label {
  font-size: 0.625rem;
  color: rgb(var(--color-foreground-tertiary));
  margin-top: 0.25rem;
}

/* 重置選項 */
.reset-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgb(var(--color-background-secondary));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.5rem;
  color: rgb(var(--color-foreground));
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: rgb(var(--color-background-tertiary));
  border-color: rgb(var(--color-border-secondary));
}

.reset-btn--system {
  border-color: rgb(var(--color-water-500));
  color: rgb(var(--color-water-500));
}

.reset-btn--system:hover {
  background: rgb(var(--color-water-500) / 0.1);
  border-color: rgb(var(--color-water-600));
}

.btn-icon {
  font-size: 1rem;
}

/* 無障礙資訊 */
.accessibility-info {
  padding: 1.5rem;
  background: rgb(var(--color-info-50) / 0.5);
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--color-info-200));
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.info-icon {
  font-size: 1.25rem;
  color: rgb(var(--color-info-600));
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--color-foreground));
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-list li {
  font-size: 0.875rem;
  color: rgb(var(--color-foreground-secondary));
  line-height: 1.5;
  position: relative;
  padding-left: 1.5rem;
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: rgb(var(--color-info-500));
  font-weight: bold;
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

.status-icon {
  font-size: 1.25rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .size-options {
    grid-template-columns: 1fr;
  }
  
  .reset-options {
    flex-direction: column;
  }
  
  .current-size-display {
    padding: 1.5rem;
  }
}
</style>