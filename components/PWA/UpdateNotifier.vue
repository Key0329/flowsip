<template>
  <Teleport to="body">
    <Transition name="update-notifier">
      <div 
        v-if="showNotification" 
        class="update-notifier"
        :class="[
          `update-notifier--${position}`,
          { 'update-notifier--persistent': isPersistent }
        ]"
        role="alert"
        aria-live="polite"
      >
        <div class="update-notifier-content">
          <!-- 圖示 -->
          <div class="update-notifier-icon">
            <Icon 
              :name="updateIcon" 
              :class="{ 'animate-spin': isUpdating }"
            />
          </div>

          <!-- 內容文字 -->
          <div class="update-notifier-text">
            <div class="update-notifier-title">
              {{ updateTitle }}
            </div>
            <div v-if="updateDescription" class="update-notifier-description">
              {{ updateDescription }}
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="update-notifier-actions">
            <button 
              v-if="!isUpdating"
              class="update-btn update-btn--primary"
              :disabled="isUpdating"
              @click="handleUpdate"
            >
              {{ updateButtonText }}
            </button>
            <button 
              v-if="!isUpdating && !isPersistent"
              class="update-btn update-btn--secondary"
              @click="handleDismiss"
            >
              稍後
            </button>
          </div>

          <!-- 關閉按鈕 -->
          <button 
            v-if="!isPersistent && !isUpdating"
            class="update-notifier-close"
            :title="'關閉通知'"
            @click="handleClose"
          >
            <Icon name="mdi:close" />
          </button>
        </div>

        <!-- 進度條 -->
        <div 
          v-if="showProgress" 
          class="update-notifier-progress"
        >
          <div 
            class="update-notifier-progress-bar"
            :style="{ width: `${updateProgress}%` }"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * PWA 應用更新通知元件
 * 提供新版本通知和更新功能
 */

// 更新類型定義
type UpdateType = 'available' | 'downloading' | 'ready' | 'error'
type Position = 'top' | 'bottom' | 'center'

// Props 定義
export interface Props {
  /** 是否顯示通知 */
  show?: boolean
  /** 更新類型 */
  type?: UpdateType
  /** 顯示位置 */
  position?: Position
  /** 是否為持久通知 */
  persistent?: boolean
  /** 自動隱藏時間（毫秒，0 表示不自動隱藏） */
  autoHide?: number
  /** 更新進度（0-100） */
  progress?: number
  /** 自訂標題 */
  customTitle?: string
  /** 自訂描述 */
  customDescription?: string
  /** 更新成功回調 */
  onUpdate?: () => void
  /** 通知關閉回調 */
  onDismiss?: (reason: 'user' | 'auto') => void
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  type: 'available',
  position: 'top',
  persistent: false,
  autoHide: 10000, // 預設 10 秒自動隱藏
  progress: 0
})

// 發出事件
const emit = defineEmits<{
  update: []
  dismiss: [reason: 'user' | 'auto']
  close: []
  'update:show': [show: boolean]
}>()

// 響應式狀態
const showNotification = ref(false)
const isUpdating = ref(false)
const updateProgress = ref(0)
const lastUpdateCheck = ref<Date | null>(null)

// Service Worker 和更新相關
const registration = ref<ServiceWorkerRegistration | null>(null)
const newServiceWorker = ref<ServiceWorker | null>(null)

/**
 * 根據更新類型獲取圖示
 */
const updateIcon = computed(() => {
  switch (props.type) {
    case 'available':
      return 'mdi:download'
    case 'downloading':
      return 'mdi:loading'
    case 'ready':
      return 'mdi:check-circle'
    case 'error':
      return 'mdi:alert-circle'
    default:
      return 'mdi:information'
  }
})

/**
 * 根據更新類型獲取標題
 */
const updateTitle = computed(() => {
  if (props.customTitle) return props.customTitle
  
  switch (props.type) {
    case 'available':
      return '發現新版本'
    case 'downloading':
      return '正在下載更新'
    case 'ready':
      return '更新已就緒'
    case 'error':
      return '更新失敗'
    default:
      return '應用程式更新'
  }
})

/**
 * 根據更新類型獲取描述
 */
const updateDescription = computed(() => {
  if (props.customDescription) return props.customDescription
  
  switch (props.type) {
    case 'available':
      return '有新版本可用，建議立即更新以獲得最新功能和修復'
    case 'downloading':
      return '正在下載新版本，請稍候...'
    case 'ready':
      return '新版本已下載完成，點擊更新以應用變更'
    case 'error':
      return '更新過程中發生錯誤，請稍後重試'
    default:
      return ''
  }
})

/**
 * 根據更新類型獲取按鈕文字
 */
const updateButtonText = computed(() => {
  switch (props.type) {
    case 'available':
      return '立即更新'
    case 'ready':
      return '應用更新'
    case 'error':
      return '重試'
    default:
      return '更新'
  }
})

/**
 * 是否為持久通知
 */
const isPersistent = computed(() => {
  return props.persistent || props.type === 'ready'
})

/**
 * 是否顯示進度條
 */
const showProgress = computed(() => {
  return props.type === 'downloading' || (isUpdating.value && props.progress > 0)
})

/**
 * 處理更新操作
 */
async function handleUpdate() {
  try {
    isUpdating.value = true
    
    if (props.type === 'available') {
      // 開始下載更新
      await checkForUpdates(true)
    } else if (props.type === 'ready' && newServiceWorker.value) {
      // 應用已下載的更新
      await applyUpdate()
    } else if (props.type === 'error') {
      // 重試更新
      await checkForUpdates(true)
    }
    
    emit('update')
    props.onUpdate?.()
    
  } catch (error) {
    console.error('更新操作失敗:', error)
  } finally {
    isUpdating.value = false
  }
}

/**
 * 處理通知關閉
 */
function handleDismiss() {
  showNotification.value = false
  emit('update:show', false)
  emit('dismiss', 'user')
  props.onDismiss?.('user')
}

/**
 * 處理通知完全關閉
 */
function handleClose() {
  showNotification.value = false
  emit('update:show', false)
  emit('close')
}

/**
 * 檢查更新
 */
async function checkForUpdates(force = false): Promise<boolean> {
  if (!registration.value) return false
  
  try {
    // 檢查是否需要強制更新檢查
    if (force || shouldCheckForUpdates()) {
      await registration.value.update()
      lastUpdateCheck.value = new Date()
      return true
    }
    return false
  } catch (error) {
    console.error('檢查更新失敗:', error)
    return false
  }
}

/**
 * 應用更新
 */
async function applyUpdate(): Promise<void> {
  if (!newServiceWorker.value) return
  
  try {
    // 發送跳過等待訊息
    newServiceWorker.value.postMessage({ type: 'SKIP_WAITING' })
    
    // 等待新的 Service Worker 接管
    newServiceWorker.value.addEventListener('statechange', () => {
      if (newServiceWorker.value?.state === 'activated') {
        // 重載頁面以應用更新
        window.location.reload()
      }
    })
    
  } catch (error) {
    console.error('應用更新失敗:', error)
    throw error
  }
}

/**
 * 判斷是否應該檢查更新
 */
function shouldCheckForUpdates(): boolean {
  if (!lastUpdateCheck.value) return true
  
  const timeSinceLastCheck = Date.now() - lastUpdateCheck.value.getTime()
  const checkInterval = 30 * 60 * 1000 // 30 分鐘
  
  return timeSinceLastCheck > checkInterval
}

/**
 * 處理 Service Worker 更新事件
 */
function handleServiceWorkerUpdate(event: Event) {
  const sw = (event.target as ServiceWorker)
  
  if (sw.state === 'installed' && navigator.serviceWorker.controller) {
    // 新的 Service Worker 已安裝，但尚未激活
    newServiceWorker.value = sw
    showNotification.value = true
    emit('update:show', true)
  }
}

/**
 * 處理控制器變更事件
 */
function handleControllerChange() {
  // Service Worker 控制器已變更，頁面需要重載
  window.location.reload()
}

/**
 * 自動隱藏邏輯
 */
let autoHideTimer: NodeJS.Timeout | null = null

watch(showNotification, (show) => {
  if (show && props.autoHide > 0 && !isPersistent.value) {
    autoHideTimer = setTimeout(() => {
      showNotification.value = false
      emit('update:show', false)
      emit('dismiss', 'auto')
      props.onDismiss?.('auto')
    }, props.autoHide)
  } else if (autoHideTimer) {
    clearTimeout(autoHideTimer)
    autoHideTimer = null
  }
})

// 監聽進度變化
watch(() => props.progress, (progress) => {
  updateProgress.value = progress
})

// 生命週期
onMounted(async () => {
  // 註冊 Service Worker 事件
  if ('serviceWorker' in navigator) {
    try {
      registration.value = await navigator.serviceWorker.ready
      
      // 監聽 Service Worker 更新
      registration.value.addEventListener('updatefound', () => {
        const installingWorker = registration.value?.installing
        if (installingWorker) {
          installingWorker.addEventListener('statechange', handleServiceWorkerUpdate)
        }
      })
      
      // 監聽控制器變更
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      
      // 初始檢查更新
      await checkForUpdates()
      
    } catch (error) {
      console.error('Service Worker 初始化失敗:', error)
    }
  }
})

onUnmounted(() => {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
  }
  
  // 清理事件監聽器
  if (registration.value) {
    // 注意：實際的 removeEventListener 需要引用相同的函數
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
  }
})

// 監聽 props 變化
watch(() => props.show, (show) => {
  showNotification.value = show
})
</script>

<style scoped>
/* ==========================================================================
   更新通知基礎樣式
   ========================================================================== */

.update-notifier {
  position: fixed;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  box-shadow: 
    0 20px 25px -5px rgba(var(--color-shadow), 0.1),
    0 10px 10px -5px rgba(var(--color-shadow), 0.04);
  z-index: 1001;
  max-width: 28rem;
  min-width: 20rem;
  overflow: hidden;
  transform: translateZ(0);
}

/* ==========================================================================
   位置變體
   ========================================================================== */

.update-notifier--top {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.update-notifier--bottom {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.update-notifier--center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 32rem;
}

/* ==========================================================================
   通知內容
   ========================================================================== */

.update-notifier-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  position: relative;
}

.update-notifier-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.update-notifier-text {
  flex: 1;
  min-width: 0;
}

.update-notifier-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 0.25rem;
}

.update-notifier-description {
  font-size: 0.8125rem;
  color: var(--color-foreground-secondary);
  line-height: 1.4;
}

/* ==========================================================================
   操作按鈕區域
   ========================================================================== */

.update-notifier-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.update-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.update-btn--primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.update-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.update-btn--secondary {
  background: var(--color-background-secondary);
  color: var(--color-foreground);
  border-color: var(--color-border);
}

.update-btn--secondary:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

/* ==========================================================================
   關閉按鈕
   ========================================================================== */

.update-notifier-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 1.5rem;
  height: 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-foreground-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.update-notifier-close:hover {
  background: var(--color-background-secondary);
  color: var(--color-foreground-secondary);
}

/* ==========================================================================
   進度條
   ========================================================================== */

.update-notifier-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-background-tertiary);
  overflow: hidden;
}

.update-notifier-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 1px;
  transition: width 0.3s ease;
  position: relative;
}

.update-notifier-progress-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* ==========================================================================
   持久通知樣式
   ========================================================================== */

.update-notifier--persistent {
  border-color: var(--color-warning-500);
  box-shadow: 
    0 0 0 1px rgb(var(--color-warning-500), 0.1),
    0 20px 25px -5px rgba(var(--color-shadow), 0.1),
    0 10px 10px -5px rgba(var(--color-shadow), 0.04);
}

.update-notifier--persistent .update-notifier-icon {
  background: linear-gradient(135deg, rgb(var(--color-warning-500)), rgb(var(--color-warning-400)));
}

/* ==========================================================================
   動畫效果
   ========================================================================== */

.update-notifier-enter-active,
.update-notifier-leave-active {
  transition: all 0.3s ease;
}

.update-notifier-enter-from.update-notifier--top {
  opacity: 0;
  transform: translateX(-50%) translateY(-1rem);
}

.update-notifier-enter-from.update-notifier--bottom {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}

.update-notifier-enter-from.update-notifier--center {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

.update-notifier-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ==========================================================================
   響應式設計
   ========================================================================== */

@media (max-width: 640px) {
  .update-notifier {
    left: 0.5rem !important;
    right: 0.5rem;
    max-width: none;
    transform: none;
  }
  
  .update-notifier--top {
    top: 0.5rem;
  }
  
  .update-notifier--bottom {
    bottom: 0.5rem;
  }
  
  .update-notifier--center {
    top: 50%;
    transform: translateY(-50%);
  }
  
  .update-notifier-content {
    padding: 1rem;
  }
  
  .update-notifier-actions {
    flex-direction: row;
    min-width: 8rem;
  }
}

/* ==========================================================================
   無障礙和動畫偏好
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
  .update-notifier,
  .update-btn,
  .update-notifier-close,
  .update-notifier-progress-bar {
    transition: none;
  }
  
  .update-notifier-enter-active,
  .update-notifier-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .update-notifier-enter-from,
  .update-notifier-leave-to {
    transform: none;
  }
  
  .update-notifier-progress-bar::after {
    animation: none;
  }
}

@media (prefers-contrast: high) {
  .update-notifier {
    border-width: 2px;
  }
  
  .update-btn--primary {
    background: var(--color-primary);
  }
  
  .update-btn--secondary {
    border-width: 2px;
  }
}
</style>