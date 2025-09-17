<template>
  <Teleport to="body">
    <Transition name="onboarding-overlay">
      <div 
        v-if="showOnboarding" 
        class="onboarding-overlay"
        @click.self="handleSkip"
      >
        <!-- 引導內容 -->
        <div class="onboarding-container">
          <!-- 背景裝飾 -->
          <div class="onboarding-bg-decoration" />
          
          <!-- 步驟指示器 -->
          <div class="onboarding-progress">
            <div class="progress-indicator">
              <div 
                v-for="(step, index) in steps" 
                :key="index"
                class="progress-dot"
                :class="{ 
                  'progress-dot--active': index === currentStep,
                  'progress-dot--completed': index < currentStep
                }"
              />
            </div>
            <div class="progress-bar">
              <div 
                class="progress-bar-fill"
                :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"
              />
            </div>
          </div>

          <!-- 步驟內容 -->
          <div class="onboarding-content">
            <Transition name="step-transition" mode="out-in">
              <div :key="currentStep" class="step-content">
                <!-- 步驟圖示或插圖 -->
                <div class="step-illustration">
                  <div class="step-icon-wrapper">
                    <Icon 
                      :name="currentStepData.icon" 
                      class="step-icon"
                      :class="currentStepData.iconClass"
                    />
                  </div>
                  
                  <!-- 裝飾元素 -->
                  <div class="illustration-decorations">
                    <div 
                      v-for="i in 3" 
                      :key="i"
                      class="decoration-particle"
                      :style="{ 
                        animationDelay: `${i * 0.5}s`,
                        left: `${20 + i * 20}%`,
                        top: `${10 + i * 15}%`
                      }"
                    />
                  </div>
                </div>

                <!-- 步驟標題 -->
                <h2 class="step-title">
                  {{ currentStepData.title }}
                </h2>

                <!-- 步驟描述 -->
                <p class="step-description">
                  {{ currentStepData.description }}
                </p>

                <!-- 特色功能列表 -->
                <div v-if="currentStepData.features" class="step-features">
                  <div 
                    v-for="(feature, index) in currentStepData.features" 
                    :key="index"
                    class="step-feature"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    <Icon :name="feature.icon" class="feature-icon" />
                    <span class="feature-text">{{ feature.text }}</span>
                  </div>
                </div>

                <!-- 互動演示 -->
                <div v-if="currentStepData.demo" class="step-demo">
                  <component :is="currentStepData.demo" />
                </div>
              </div>
            </Transition>
          </div>

          <!-- 操作按鈕 -->
          <div class="onboarding-actions">
            <button 
              v-if="currentStep > 0"
              class="onboarding-btn onboarding-btn--secondary"
              @click="handlePrevious"
            >
              上一步
            </button>
            
            <button 
              class="onboarding-btn onboarding-btn--skip"
              @click="handleSkip"
            >
              跳過
            </button>
            
            <button 
              class="onboarding-btn onboarding-btn--primary"
              @click="handleNext"
            >
              {{ isLastStep ? '開始使用' : '下一步' }}
            </button>
          </div>

          <!-- 關閉按鈕 -->
          <button 
            class="onboarding-close"
            :title="'跳過引導'"
            @click="handleSkip"
          >
            <Icon name="mdi:close" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 首次使用引導元件
 * 為新用戶提供功能介紹和使用指導
 */

// 步驟資料介面
interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
  iconClass?: string
  features?: Array<{
    icon: string
    text: string
  }>
  demo?: Component
}

// Props 定義
export interface Props {
  /** 是否顯示引導 */
  show?: boolean
  /** 自動開始 */
  autoStart?: boolean
  /** 完成回調 */
  onComplete?: () => void
  /** 跳過回調 */
  onSkip?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  autoStart: false
})

// 發出事件
const emit = defineEmits<{
  complete: []
  skip: []
  stepChange: [step: number]
  'update:show': [show: boolean]
}>()

// 響應式狀態
const showOnboarding = ref(false)
const currentStep = ref(0)
const isAnimating = ref(false)

/**
 * 引導步驟資料
 */
const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '歡迎使用 FlowSip',
    description: 'FlowSip 是您的智能喝水提醒和專注計時助手，幫助您養成健康的生活習慣，提升工作效率。',
    icon: 'mdi:hand-wave',
    iconClass: 'text-yellow-500',
    features: [
      { icon: 'mdi:water', text: '智能喝水提醒' },
      { icon: 'mdi:timer', text: '番茄鐘專注計時' },
      { icon: 'mdi:chart-line', text: '使用統計分析' }
    ]
  },
  {
    id: 'timer-intro',
    title: '計時功能介紹',
    description: '使用我們的智能計時器開始您的健康之旅。支援自定義時間設定，讓您靈活安排工作和休息。',
    icon: 'mdi:timer-outline',
    iconClass: 'text-blue-500',
    features: [
      { icon: 'mdi:play', text: '一鍵開始計時' },
      { icon: 'mdi:pause', text: '隨時暫停繼續' },
      { icon: 'mdi:cog', text: '彈性時間設定' }
    ]
  },
  {
    id: 'notifications',
    title: '提醒與通知',
    description: '多種提醒方式確保您不會錯過任何重要時刻。支援系統通知、音效提醒和視覺提示。',
    icon: 'mdi:bell-ring',
    iconClass: 'text-green-500',
    features: [
      { icon: 'mdi:notification-clear-all', text: '系統桌面通知' },
      { icon: 'mdi:volume-high', text: '多種音效選擇' },
      { icon: 'mdi:eye', text: '視覺提醒效果' }
    ]
  },
  {
    id: 'settings',
    title: '個人化設定',
    description: '豐富的個人化選項讓 FlowSip 完全適合您的使用習慣。主題、音效、字體大小都可以自由調整。',
    icon: 'mdi:palette',
    iconClass: 'text-purple-500',
    features: [
      { icon: 'mdi:theme-light-dark', text: '淺色/深色主題' },
      { icon: 'mdi:music-note', text: '自定義音效' },
      { icon: 'mdi:format-size', text: '無障礙字體設定' }
    ]
  },
  {
    id: 'offline',
    title: 'PWA 離線體驗',
    description: '作為漸進式網頁應用程式，FlowSip 支援離線使用和桌面安裝，讓您隨時隨地保持健康習慣。',
    icon: 'mdi:cloud-off-outline',
    iconClass: 'text-indigo-500',
    features: [
      { icon: 'mdi:download', text: '可安裝到桌面' },
      { icon: 'mdi:wifi-off', text: '支援離線使用' },
      { icon: 'mdi:sync', text: '資料自動同步' }
    ]
  }
]

/**
 * 當前步驟資料
 */
const currentStepData = computed(() => steps[currentStep.value])

/**
 * 是否為最後一步
 */
const isLastStep = computed(() => currentStep.value === steps.length - 1)

/**
 * 處理下一步
 */
async function handleNext() {
  if (isAnimating.value) return
  
  if (isLastStep.value) {
    // 完成引導
    await handleComplete()
  } else {
    // 下一步
    isAnimating.value = true
    currentStep.value++
    emit('stepChange', currentStep.value)
    
    // 動畫完成後重置標記
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
}

/**
 * 處理上一步
 */
function handlePrevious() {
  if (isAnimating.value || currentStep.value <= 0) return
  
  isAnimating.value = true
  currentStep.value--
  emit('stepChange', currentStep.value)
  
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

/**
 * 處理跳過
 */
async function handleSkip() {
  await closeOnboarding()
  emit('skip')
  props.onSkip?.()
  
  // 記錄用戶跳過了引導
  if (import.meta.client) {
    localStorage.setItem('flowsip-onboarding-skipped', 'true')
    localStorage.setItem('flowsip-onboarding-skip-date', new Date().toISOString())
  }
}

/**
 * 處理完成
 */
async function handleComplete() {
  await closeOnboarding()
  emit('complete')
  props.onComplete?.()
  
  // 記錄用戶完成了引導
  if (import.meta.client) {
    localStorage.setItem('flowsip-onboarding-completed', 'true')
    localStorage.setItem('flowsip-onboarding-complete-date', new Date().toISOString())
  }
}

/**
 * 關閉引導
 */
async function closeOnboarding() {
  showOnboarding.value = false
  emit('update:show', false)
  
  // 等待動畫完成
  await new Promise(resolve => setTimeout(resolve, 300))
}

/**
 * 檢查是否應該顯示引導
 */
function shouldShowOnboarding(): boolean {
  if (!import.meta.client) return false
  
  // 檢查是否已經完成或跳過引導
  const completed = localStorage.getItem('flowsip-onboarding-completed')
  const skipped = localStorage.getItem('flowsip-onboarding-skipped')
  
  if (completed || skipped) {
    return false
  }
  
  // 檢查是否為首次訪問
  const visitCount = parseInt(localStorage.getItem('flowsip-visit-count') || '0')
  
  // 只在首次訪問或第二次訪問時顯示
  return visitCount <= 2
}

/**
 * 重置引導狀態（開發用）
 */
function resetOnboarding() {
  if (!import.meta.client) return
  
  localStorage.removeItem('flowsip-onboarding-completed')
  localStorage.removeItem('flowsip-onboarding-skipped')
  localStorage.removeItem('flowsip-onboarding-complete-date')
  localStorage.removeItem('flowsip-onboarding-skip-date')
  
  currentStep.value = 0
  showOnboarding.value = true
  emit('update:show', true)
}

// 鍵盤事件處理
function handleKeyPress(event: KeyboardEvent) {
  if (!showOnboarding.value || isAnimating.value) return
  
  switch (event.key) {
    case 'ArrowRight':
    case 'Space':
      event.preventDefault()
      handleNext()
      break
    case 'ArrowLeft':
      event.preventDefault()
      handlePrevious()
      break
    case 'Escape':
      event.preventDefault()
      handleSkip()
      break
  }
}

// 生命週期
onMounted(() => {
  // 監聽鍵盤事件
  window.addEventListener('keydown', handleKeyPress)
  
  // 自動開始檢查
  if (props.autoStart && shouldShowOnboarding()) {
    nextTick(() => {
      showOnboarding.value = true
      emit('update:show', true)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

// 監聽 props 變化
watch(() => props.show, (show) => {
  if (show && shouldShowOnboarding()) {
    showOnboarding.value = true
    currentStep.value = 0
  } else {
    showOnboarding.value = false
  }
})

// 暴露方法供外部使用
defineExpose({
  resetOnboarding,
  shouldShowOnboarding
})
</script>

<style scoped>
/* ==========================================================================
   引導遮罩層
   ========================================================================== */

.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(14, 165, 233, 0.95), 
    rgba(6, 182, 212, 0.95), 
    rgba(8, 145, 178, 0.95)
  );
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  overflow-y: auto;
}

/* ==========================================================================
   引導容器
   ========================================================================== */

.onboarding-container {
  position: relative;
  background: var(--color-background);
  border-radius: 1.5rem;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  max-width: 32rem;
  width: 100%;
  overflow: hidden;
  transform: translateZ(0);
}

.onboarding-bg-decoration {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    transparent 0%, 
    rgba(var(--color-primary-rgb), 0.03) 50%, 
    transparent 100%
  );
  pointer-events: none;
}

/* ==========================================================================
   進度指示器
   ========================================================================== */

.onboarding-progress {
  padding: 2rem 2rem 1rem;
  text-align: center;
}

.progress-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.progress-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: var(--color-border);
  transition: all 0.3s ease;
  position: relative;
}

.progress-dot--active {
  background: var(--color-primary);
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.2);
}

.progress-dot--completed {
  background: var(--color-success-500);
}

.progress-bar {
  height: 2px;
  background: var(--color-border);
  border-radius: 1px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 1px;
  transition: width 0.4s ease;
}

/* ==========================================================================
   步驟內容
   ========================================================================== */

.onboarding-content {
  padding: 1rem 2rem 2rem;
  text-align: center;
}

.step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* ==========================================================================
   步驟插圖
   ========================================================================== */

.step-illustration {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8rem;
  height: 8rem;
}

.step-icon-wrapper {
  position: relative;
  width: 5rem;
  height: 5rem;
  background: linear-gradient(135deg, 
    rgba(var(--color-primary-rgb), 0.1), 
    rgba(var(--color-primary-rgb), 0.05)
  );
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.step-icon {
  font-size: 2.5rem;
  color: var(--color-primary);
  filter: drop-shadow(0 2px 4px rgba(var(--color-primary-rgb), 0.3));
}

.illustration-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.decoration-particle {
  position: absolute;
  width: 0.375rem;
  height: 0.375rem;
  background: var(--color-primary);
  border-radius: 50%;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0) scale(1); 
    opacity: 0.6; 
  }
  50% { 
    transform: translateY(-0.5rem) scale(1.1); 
    opacity: 0.8; 
  }
}

/* ==========================================================================
   步驟標題和描述
   ========================================================================== */

.step-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0;
  line-height: 1.2;
}

.step-description {
  font-size: 1rem;
  color: var(--color-foreground-secondary);
  line-height: 1.6;
  margin: 0;
  max-width: 24rem;
}

/* ==========================================================================
   特色功能列表
   ========================================================================== */

.step-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 20rem;
}

.step-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  text-align: left;
  animation: slideInUp 0.4s ease-out forwards;
  opacity: 0;
  transform: translateY(1rem);
}

.feature-icon {
  font-size: 1.25rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.feature-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-foreground);
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==========================================================================
   操作按鈕
   ========================================================================== */

.onboarding-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 2rem 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.onboarding-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.onboarding-btn--primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.onboarding-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.4);
}

.onboarding-btn--secondary {
  background: var(--color-background-secondary);
  color: var(--color-foreground);
  border-color: var(--color-border);
}

.onboarding-btn--secondary:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
  transform: translateY(-1px);
}

.onboarding-btn--skip {
  background: transparent;
  color: var(--color-foreground-tertiary);
  border: none;
  padding: 0.75rem 1rem;
}

.onboarding-btn--skip:hover {
  color: var(--color-foreground-secondary);
  background: var(--color-background-secondary);
}

/* ==========================================================================
   關閉按鈕
   ========================================================================== */

.onboarding-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-foreground-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.125rem;
}

.onboarding-close:hover {
  background: var(--color-background-tertiary);
  color: var(--color-foreground-secondary);
  transform: scale(1.05);
}

/* ==========================================================================
   動畫效果
   ========================================================================== */

.onboarding-overlay-enter-active,
.onboarding-overlay-leave-active {
  transition: all 0.4s ease;
}

.onboarding-overlay-enter-from,
.onboarding-overlay-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.onboarding-overlay-enter-from .onboarding-container,
.onboarding-overlay-leave-to .onboarding-container {
  transform: scale(0.9) translateY(2rem);
  opacity: 0;
}

.step-transition-enter-active,
.step-transition-leave-active {
  transition: all 0.3s ease;
}

.step-transition-enter-from {
  opacity: 0;
  transform: translateX(2rem);
}

.step-transition-leave-to {
  opacity: 0;
  transform: translateX(-2rem);
}

/* ==========================================================================
   響應式設計
   ========================================================================== */

@media (max-width: 640px) {
  .onboarding-overlay {
    padding: 1rem;
  }
  
  .onboarding-container {
    border-radius: 1rem;
  }
  
  .onboarding-progress,
  .onboarding-content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  .onboarding-actions {
    padding: 0 1.5rem 1.5rem;
    flex-direction: column;
  }
  
  .step-title {
    font-size: 1.5rem;
  }
  
  .step-description {
    font-size: 0.875rem;
  }
  
  .step-illustration {
    width: 6rem;
    height: 6rem;
  }
  
  .step-icon-wrapper {
    width: 4rem;
    height: 4rem;
  }
  
  .step-icon {
    font-size: 2rem;
  }
}

/* ==========================================================================
   無障礙和動畫偏好
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
  .onboarding-container,
  .onboarding-btn,
  .onboarding-close,
  .progress-dot,
  .progress-bar-fill,
  .step-feature {
    transition: none;
  }
  
  .onboarding-overlay-enter-active,
  .onboarding-overlay-leave-active,
  .step-transition-enter-active,
  .step-transition-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .step-transition-enter-from,
  .step-transition-leave-to {
    transform: none;
  }
  
  .decoration-particle {
    animation: none;
  }
  
  .step-feature {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

@media (prefers-contrast: high) {
  .onboarding-container {
    border: 2px solid var(--color-border);
  }
  
  .onboarding-btn--primary {
    background: var(--color-primary);
  }
  
  .onboarding-btn--secondary {
    border-width: 2px;
  }
  
  .step-feature {
    border-width: 2px;
  }
}
</style>