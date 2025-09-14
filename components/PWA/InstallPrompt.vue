<template>
  <Teleport to="body">
    <Transition name="install-prompt">
      <div 
        v-if="showPrompt" 
        class="install-prompt-overlay"
        @click.self="handleDismiss"
      >
        <div class="install-prompt-card" role="dialog" aria-labelledby="install-title">
          <!-- 圖示和標題 -->
          <div class="install-prompt-header">
            <div class="install-prompt-icon">
              <Icon name="mdi:cellphone-arrow-down" />
            </div>
            <div class="install-prompt-info">
              <h3 id="install-title" class="install-prompt-title">
                安裝 FlowSip
              </h3>
              <p class="install-prompt-description">
                在您的裝置上安裝 FlowSip，享受更好的使用體驗
              </p>
            </div>
          </div>

          <!-- 功能亮點 -->
          <div class="install-prompt-features">
            <div class="install-feature">
              <Icon name="mdi:wifi-off" class="install-feature-icon" />
              <span>離線使用</span>
            </div>
            <div class="install-feature">
              <Icon name="mdi:rocket-launch" class="install-feature-icon" />
              <span>快速啟動</span>
            </div>
            <div class="install-feature">
              <Icon name="mdi:bell" class="install-feature-icon" />
              <span>桌面通知</span>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="install-prompt-actions">
            <button 
              class="install-btn install-btn--primary" 
              @click="handleInstall"
              :disabled="isInstalling"
            >
              <Icon v-if="isInstalling" name="mdi:loading" class="animate-spin" />
              {{ isInstalling ? '安裝中...' : '立即安裝' }}
            </button>
            <button 
              class="install-btn install-btn--secondary" 
              @click="handleDismiss"
            >
              稍後提醒
            </button>
          </div>

          <!-- 關閉按鈕 -->
          <button 
            class="install-prompt-close"
            @click="handleNeverShow"
            :title="'不再提示'"
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
 * PWA 安裝提示元件
 * 提供智能安裝提示和更好的使用者體驗
 */

// Props 定義
export interface Props {
  /** 是否顯示安裝提示 */
  show?: boolean
  /** 延遲顯示時間（毫秒） */
  delay?: number
  /** 自動隱藏時間（毫秒，0 表示不自動隱藏） */
  autoHide?: number
  /** 安裝成功回調 */
  onInstall?: (success: boolean) => void
  /** 提示關閉回調 */
  onDismiss?: (reason: 'user' | 'auto' | 'never') => void
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  delay: 0,
  autoHide: 0
})

// 發出事件
const emit = defineEmits<{
  install: [success: boolean]
  dismiss: [reason: 'user' | 'auto' | 'never']
  'update:show': [show: boolean]
}>()

// 響應式狀態
const showPrompt = ref(false)
const isInstalling = ref(false)
const deferredPrompt = ref<any>(null)

// PWA 安裝相關
const { isSupported: isPWASupported } = usePWA()

/**
 * 檢查是否支援安裝提示
 */
const canShowInstallPrompt = computed(() => {
  return isPWASupported.value && !isAlreadyInstalled.value && !isNeverShow.value
})

/**
 * 檢查是否已經安裝
 */
const isAlreadyInstalled = computed(() => {
  if (!process.client) return false
  
  // 檢查是否在 PWA 模式下運行
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as any).standalone === true
})

/**
 * 檢查是否設定為不再顯示
 */
const isNeverShow = computed(() => {
  if (!process.client) return false
  return localStorage.getItem('flowsip-install-never-show') === 'true'
})

/**
 * 智能顯示邏輯
 */
const shouldShowPrompt = computed(() => {
  return props.show && canShowInstallPrompt.value && showPrompt.value
})

/**
 * 處理 beforeinstallprompt 事件
 */
function handleBeforeInstallPrompt(event: Event) {
  // 阻止預設的安裝提示
  event.preventDefault()
  
  // 儲存事件以供後續使用
  deferredPrompt.value = event
  
  // 延遲顯示提示
  if (props.delay > 0) {
    setTimeout(() => {
      showPrompt.value = true
    }, props.delay)
  } else {
    showPrompt.value = true
  }
}

/**
 * 處理安裝操作
 */
async function handleInstall() {
  if (!deferredPrompt.value) return
  
  try {
    isInstalling.value = true
    
    // 顯示安裝提示
    deferredPrompt.value.prompt()
    
    // 等待使用者選擇
    const { outcome } = await deferredPrompt.value.userChoice
    
    const success = outcome === 'accepted'
    
    // 發出事件
    emit('install', success)
    props.onInstall?.(success)
    
    // 清理
    deferredPrompt.value = null
    showPrompt.value = false
    emit('update:show', false)
    
    if (success) {
      // 安裝成功後記錄
      localStorage.setItem('flowsip-install-date', new Date().toISOString())
    }
    
  } catch (error) {
    console.error('安裝過程發生錯誤:', error)
    emit('install', false)
    props.onInstall?.(false)
  } finally {
    isInstalling.value = false
  }
}

/**
 * 處理提示關閉
 */
function handleDismiss() {
  showPrompt.value = false
  emit('update:show', false)
  emit('dismiss', 'user')
  props.onDismiss?.('user')
  
  // 記錄關閉時間，用於智能提示邏輯
  localStorage.setItem('flowsip-install-dismissed', new Date().toISOString())
}

/**
 * 處理不再顯示
 */
function handleNeverShow() {
  localStorage.setItem('flowsip-install-never-show', 'true')
  showPrompt.value = false
  emit('update:show', false)
  emit('dismiss', 'never')
  props.onDismiss?.('never')
}

/**
 * 自動隱藏邏輯
 */
let autoHideTimer: NodeJS.Timeout | null = null

watch(shouldShowPrompt, (show) => {
  if (show && props.autoHide > 0) {
    autoHideTimer = setTimeout(() => {
      showPrompt.value = false
      emit('update:show', false)
      emit('dismiss', 'auto')
      props.onDismiss?.('auto')
    }, props.autoHide)
  } else if (autoHideTimer) {
    clearTimeout(autoHideTimer)
    autoHideTimer = null
  }
})

/**
 * 智能提示邏輯
 */
function shouldShowSmartPrompt(): boolean {
  if (!process.client || isNeverShow.value || isAlreadyInstalled.value) {
    return false
  }
  
  const lastDismissed = localStorage.getItem('flowsip-install-dismissed')
  
  if (lastDismissed) {
    const daysSinceLastDismiss = (Date.now() - new Date(lastDismissed).getTime()) / (1000 * 60 * 60 * 24)
    
    // 如果上次關閉距離現在少於 3 天，不顯示
    if (daysSinceLastDismiss < 3) {
      return false
    }
  }
  
  // 檢查使用頻率和參與度
  const visitCount = parseInt(localStorage.getItem('flowsip-visit-count') || '0')
  const totalUsageTime = parseInt(localStorage.getItem('flowsip-total-usage-time') || '0')
  
  // 只有在使用頻率較高時才顯示提示
  return visitCount >= 3 || totalUsageTime >= 300000 // 5分鐘總使用時間
}

// 生命週期
onMounted(() => {
  // 監聽 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  // 智能顯示邏輯
  if (props.show && shouldShowSmartPrompt()) {
    nextTick(() => {
      showPrompt.value = true
    })
  }
  
  // 更新訪問次數
  const visitCount = parseInt(localStorage.getItem('flowsip-visit-count') || '0')
  localStorage.setItem('flowsip-visit-count', (visitCount + 1).toString())
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
  }
})

// 監聽 props 變化
watch(() => props.show, (show) => {
  if (show && canShowInstallPrompt.value) {
    if (props.delay > 0) {
      setTimeout(() => {
        showPrompt.value = true
      }, props.delay)
    } else {
      showPrompt.value = true
    }
  } else {
    showPrompt.value = false
  }
})
</script>

<style scoped>
/* ==========================================================================
   安裝提示遮罩層
   ========================================================================== */

.install-prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* ==========================================================================
   安裝提示卡片
   ========================================================================== */

.install-prompt-card {
  position: relative;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  box-shadow: 
    0 20px 25px -5px rgba(var(--color-shadow), 0.1),
    0 10px 10px -5px rgba(var(--color-shadow), 0.04);
  padding: 2rem;
  max-width: 28rem;
  width: 100%;
  transform: translateY(0);
  transition: all 0.3s ease;
}

/* ==========================================================================
   安裝提示標題區域
   ========================================================================== */

.install-prompt-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.install-prompt-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.install-prompt-info {
  flex: 1;
  min-width: 0;
}

.install-prompt-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 0.5rem 0;
}

.install-prompt-description {
  font-size: 0.875rem;
  color: var(--color-foreground-secondary);
  line-height: 1.5;
  margin: 0;
}

/* ==========================================================================
   功能亮點
   ========================================================================== */

.install-prompt-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--color-background-secondary);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.install-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-foreground-secondary);
}

.install-feature-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
}

/* ==========================================================================
   操作按鈕
   ========================================================================== */

.install-prompt-actions {
  display: flex;
  gap: 0.75rem;
  flex-direction: column;
}

.install-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.install-btn--primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: white;
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
}

.install-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
}

.install-btn--secondary {
  background: var(--color-background-secondary);
  color: var(--color-foreground);
  border-color: var(--color-border);
}

.install-btn--secondary:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

/* ==========================================================================
   關閉按鈕
   ========================================================================== */

.install-prompt-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-foreground-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.install-prompt-close:hover {
  background: var(--color-background-tertiary);
  color: var(--color-foreground-secondary);
  transform: scale(1.05);
}

/* ==========================================================================
   動畫效果
   ========================================================================== */

.install-prompt-enter-active,
.install-prompt-leave-active {
  transition: all 0.3s ease;
}

.install-prompt-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(1rem);
}

.install-prompt-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-0.5rem);
}

.install-prompt-enter-from .install-prompt-overlay,
.install-prompt-leave-to .install-prompt-overlay {
  backdrop-filter: blur(0px);
}

/* ==========================================================================
   響應式設計
   ========================================================================== */

@media (max-width: 640px) {
  .install-prompt-overlay {
    padding: 1rem;
    align-items: flex-end;
  }
  
  .install-prompt-card {
    padding: 1.5rem;
    border-radius: 1rem 1rem 0 0;
    max-width: none;
    width: 100%;
  }
  
  .install-prompt-header {
    margin-bottom: 1rem;
  }
  
  .install-prompt-features {
    margin-bottom: 1.5rem;
  }
  
  .install-prompt-actions {
    flex-direction: column-reverse;
  }
}

/* ==========================================================================
   無障礙和動畫偏好
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
  .install-prompt-card,
  .install-btn,
  .install-prompt-close {
    transition: none;
  }
  
  .install-prompt-enter-active,
  .install-prompt-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .install-prompt-enter-from,
  .install-prompt-leave-to {
    transform: none;
  }
}

@media (prefers-contrast: high) {
  .install-prompt-card {
    border-width: 2px;
  }
  
  .install-btn--primary {
    background: var(--color-primary);
  }
  
  .install-btn--secondary {
    border-width: 2px;
  }
}
</style>