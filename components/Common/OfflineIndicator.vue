<template>
  <Transition name="offline-indicator">
    <div 
      v-if="showIndicator" 
      class="offline-indicator"
      :class="[
        `offline-indicator--${position}`,
        `offline-indicator--${variant}`,
        { 'offline-indicator--persistent': isPersistent }
      ]"
      role="status"
      aria-live="polite"
      :aria-label="statusMessage"
    >
      <div class="offline-indicator-content">
        <!-- 狀態圖示 -->
        <div class="offline-indicator-icon">
          <Icon :name="statusIcon" :class="iconClasses" />
        </div>

        <!-- 狀態文字 -->
        <div class="offline-indicator-text">
          <span class="offline-indicator-message">
            {{ statusMessage }}
          </span>
          <span v-if="showDetails" class="offline-indicator-details">
            {{ statusDetails }}
          </span>
        </div>

        <!-- 操作按鈕 */
        <div v-if="showActions" class="offline-indicator-actions">
          <button 
            v-if="canRetry"
            class="offline-btn offline-btn--retry"
            @click="handleRetry"
            :disabled="isRetrying"
          >
            <Icon v-if="isRetrying" name="mdi:loading" class="animate-spin" />
            {{ isRetrying ? '重試中...' : '重試' }}
          </button>
          <button 
            v-if="canDismiss"
            class="offline-btn offline-btn--dismiss"
            @click="handleDismiss"
          >
            知道了
          </button>
        </div>
      </div>

      <!-- 網路品質指示器 -->
      <div v-if="showQualityIndicator" class="offline-indicator-quality">
        <div class="quality-bars">
          <div 
            v-for="i in 4" 
            :key="i"
            class="quality-bar"
            :class="{ 'quality-bar--active': i <= connectionQuality }"
          />
        </div>
        <span class="quality-text">{{ qualityText }}</span>
      </div>
    </div>
  </div></Transition>
</template>

<script setup lang="ts">
/**
 * 離線狀態指示元件
 * 顯示網路連接狀態和相關操作
 */

// 連接狀態類型
type ConnectionStatus = 'online' | 'offline' | 'slow' | 'unstable'
type IndicatorVariant = 'minimal' | 'detailed' | 'banner'
type IndicatorPosition = 'top' | 'bottom' | 'floating'

// Props 定義
export interface Props {
  /** 是否顯示指示器 */
  show?: boolean
  /** 連接狀態 */
  status?: ConnectionStatus
  /** 指示器樣式變體 */
  variant?: IndicatorVariant
  /** 顯示位置 */
  position?: IndicatorPosition
  /** 是否持續顯示 */
  persistent?: boolean
  /** 是否顯示詳細資訊 */
  showDetails?: boolean
  /** 是否顯示操作按鈕 */
  showActions?: boolean
  /** 是否顯示網路品質指示器 */
  showQuality?: boolean
  /** 自訂訊息 */
  customMessage?: string
  /** 自動重試間隔（毫秒） */
  autoRetryInterval?: number
  /** 重試回調 */
  onRetry?: () => Promise<boolean>
  /** 關閉回調 */
  onDismiss?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  status: 'offline',
  variant: 'detailed',
  position: 'top',
  persistent: false,
  showDetails: true,
  showActions: true,
  showQuality: false,
  autoRetryInterval: 30000 // 30 秒
})

// 發出事件
const emit = defineEmits<{
  retry: []
  dismiss: []
  statusChange: [status: ConnectionStatus]
  'update:show': [show: boolean]
}>()

// 響應式狀態
const isOnline = ref(navigator.onLine)
const isRetrying = ref(false)
const connectionQuality = ref(0)
const lastOnlineTime = ref<Date | null>(null)
const retryCount = ref(0)
const showIndicator = ref(false)

// Network API 支援檢測
const networkConnection = computed(() => {
  return (navigator as any).connection || 
         (navigator as any).mozConnection || 
         (navigator as any).webkitConnection
})

/**
 * 當前連接狀態
 */
const currentStatus = computed((): ConnectionStatus => {
  if (props.status !== 'online' && props.status !== 'offline') {
    return props.status
  }
  
  if (!isOnline.value) return 'offline'
  
  // 根據網路品質判斷狀態
  if (networkConnection.value) {
    const connection = networkConnection.value
    const effectiveType = connection.effectiveType
    
    if (effectiveType === 'slow-2g' || connection.downlink < 0.5) {
      return 'slow'
    }
    
    if (connection.rtt > 1000 || connection.downlink < 1.5) {
      return 'unstable'
    }
  }
  
  return 'online'
})

/**
 * 狀態圖示
 */
const statusIcon = computed(() => {
  switch (currentStatus.value) {
    case 'online':
      return 'mdi:wifi'
    case 'offline':
      return 'mdi:wifi-off'
    case 'slow':
      return 'mdi:wifi-strength-1'
    case 'unstable':
      return 'mdi:wifi-strength-2-alert'
    default:
      return 'mdi:wifi-off'
  }
})

/**
 * 圖示樣式類別
 */
const iconClasses = computed(() => ({
  'text-red-500': currentStatus.value === 'offline',
  'text-yellow-500': currentStatus.value === 'slow' || currentStatus.value === 'unstable',
  'text-green-500': currentStatus.value === 'online',
  'animate-pulse': currentStatus.value === 'unstable'
}))

/**
 * 狀態訊息
 */
const statusMessage = computed(() => {
  if (props.customMessage) return props.customMessage
  
  switch (currentStatus.value) {
    case 'online':
      return '網路連接正常'
    case 'offline':
      return '目前處於離線狀態'
    case 'slow':
      return '網路連接緩慢'
    case 'unstable':
      return '網路連接不穩定'
    default:
      return '檢查網路連接'
  }
})

/**
 * 詳細狀態資訊
 */
const statusDetails = computed(() => {
  if (!props.showDetails) return ''
  
  switch (currentStatus.value) {
    case 'online':
      return '所有功能正常運作'
    case 'offline':
      if (lastOnlineTime.value) {
        const timeDiff = Date.now() - lastOnlineTime.value.getTime()
        const minutes = Math.floor(timeDiff / 60000)
        return `上次連線：${minutes > 0 ? `${minutes} 分鐘前` : '剛剛'}`
      }
      return '部分功能可能無法使用'
    case 'slow':
      return '建議避免大量資料傳輸'
    case 'unstable':
      return '可能出現載入延遲或失敗'
    default:
      return ''
  }
})

/**
 * 網路品質文字
 */
const qualityText = computed(() => {
  const quality = connectionQuality.value
  if (quality <= 1) return '極差'
  if (quality <= 2) return '較差'
  if (quality <= 3) return '普通'
  return '良好'
})

/**
 * 是否為持久顯示
 */
const isPersistent = computed(() => {
  return props.persistent || currentStatus.value === 'offline'
})

/**
 * 是否可以重試
 */
const canRetry = computed(() => {
  return currentStatus.value !== 'online' && props.showActions
})

/**
 * 是否可以關閉
 */
const canDismiss = computed(() => {
  return !isPersistent.value && props.showActions
})

/**
 * 是否顯示網路品質指示器
 */
const showQualityIndicator = computed(() => {
  return props.showQuality && currentStatus.value === 'online' && networkConnection.value
})

/**
 * 處理重試操作
 */
async function handleRetry() {
  if (isRetrying.value) return
  
  try {
    isRetrying.value = true
    retryCount.value++
    
    // 執行自訂重試邏輯
    let success = false
    if (props.onRetry) {
      success = await props.onRetry()
    } else {
      // 預設重試邏輯：檢查網路連接
      success = await checkConnection()
    }
    
    emit('retry')
    
    if (success) {
      retryCount.value = 0
      if (!isPersistent.value) {
        showIndicator.value = false
        emit('update:show', false)
      }
    }
    
  } catch (error) {
    console.error('重試失敗:', error)
  } finally {
    isRetrying.value = false
  }
}

/**
 * 處理關閉操作
 */
function handleDismiss() {
  showIndicator.value = false
  emit('update:show', false)
  emit('dismiss')
  props.onDismiss?.()
}

/**
 * 檢查網路連接
 */
async function checkConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/ping', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch {
    return navigator.onLine
  }
}

/**
 * 更新網路品質指示器
 */
function updateConnectionQuality() {
  if (!networkConnection.value) {
    connectionQuality.value = isOnline.value ? 4 : 0
    return
  }
  
  const connection = networkConnection.value
  const downlink = connection.downlink || 0
  const rtt = connection.rtt || 0
  
  // 根據下載速度和 RTT 計算品質
  let quality = 0
  
  if (downlink >= 5 && rtt <= 100) quality = 4       // 優秀
  else if (downlink >= 2 && rtt <= 300) quality = 3  // 良好
  else if (downlink >= 0.5 && rtt <= 1000) quality = 2  // 普通
  else if (downlink > 0) quality = 1                 // 較差
  
  connectionQuality.value = quality
}

/**
 * 處理網路狀態變更
 */
function handleOnlineStatusChange() {
  const wasOnline = isOnline.value
  isOnline.value = navigator.onLine
  
  if (isOnline.value && !wasOnline) {
    // 從離線恢復到線上
    lastOnlineTime.value = new Date()
    retryCount.value = 0
  } else if (!isOnline.value && wasOnline) {
    // 從線上變為離線
    lastOnlineTime.value = new Date()
  }
  
  updateConnectionQuality()
  
  // 更新顯示狀態
  const newStatus = currentStatus.value
  emit('statusChange', newStatus)
  
  // 根據狀態決定是否顯示指示器
  if (props.show) {
    showIndicator.value = newStatus !== 'online' || isPersistent.value
    emit('update:show', showIndicator.value)
  }
}

/**
 * 自動重試邏輯
 */
let autoRetryTimer: NodeJS.Timeout | null = null

function startAutoRetry() {
  if (autoRetryTimer) return
  
  if (props.autoRetryInterval > 0 && currentStatus.value !== 'online') {
    autoRetryTimer = setInterval(async () => {
      if (!isRetrying.value && retryCount.value < 10) { // 最多重試 10 次
        await handleRetry()
      }
    }, props.autoRetryInterval)
  }
}

function stopAutoRetry() {
  if (autoRetryTimer) {
    clearInterval(autoRetryTimer)
    autoRetryTimer = null
  }
}

// 監聽狀態變化
watch(currentStatus, (newStatus, oldStatus) => {
  if (newStatus === 'online' && oldStatus !== 'online') {
    stopAutoRetry()
  } else if (newStatus !== 'online' && oldStatus === 'online') {
    startAutoRetry()
  }
})

// 生命週期
onMounted(() => {
  // 監聽網路狀態變化
  window.addEventListener('online', handleOnlineStatusChange)
  window.addEventListener('offline', handleOnlineStatusChange)
  
  // 監聽網路資訊變化
  if (networkConnection.value) {
    networkConnection.value.addEventListener('change', updateConnectionQuality)
  }
  
  // 初始化狀態
  handleOnlineStatusChange()
  
  // 根據初始狀態決定是否顯示
  if (props.show) {
    showIndicator.value = currentStatus.value !== 'online' || isPersistent.value
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineStatusChange)
  window.removeEventListener('offline', handleOnlineStatusChange)
  
  if (networkConnection.value) {
    networkConnection.value.removeEventListener('change', updateConnectionQuality)
  }
  
  stopAutoRetry()
})

// 監聽 props 變化
watch(() => props.show, (show) => {
  if (show) {
    showIndicator.value = currentStatus.value !== 'online' || isPersistent.value
  } else {
    showIndicator.value = false
  }
})
</script>

<style scoped>
/* ==========================================================================
   離線指示器基礎樣式
   ========================================================================== */

.offline-indicator {
  position: fixed;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: 
    0 10px 15px -3px rgba(var(--color-shadow), 0.1),
    0 4px 6px -2px rgba(var(--color-shadow), 0.05);
  z-index: 1002;
  transition: all 0.3s ease;
}

/* ==========================================================================
   位置變體
   ========================================================================== */

.offline-indicator--top {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  min-width: 18rem;
}

.offline-indicator--bottom {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  min-width: 18rem;
}

.offline-indicator--floating {
  top: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ==========================================================================
   樣式變體
   ========================================================================== */

.offline-indicator--minimal {
  padding: 0.5rem 1rem;
}

.offline-indicator--minimal .offline-indicator-content {
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
}

.offline-indicator--minimal .offline-indicator-text {
  font-size: 0.875rem;
}

.offline-indicator--detailed {
  padding: 1rem 1.25rem;
  max-width: 24rem;
}

.offline-indicator--banner {
  left: 0;
  right: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  padding: 0.75rem 1rem;
}

.offline-indicator--banner.offline-indicator--top {
  top: 0;
  transform: none;
}

.offline-indicator--banner.offline-indicator--bottom {
  bottom: 0;
  transform: none;
}

/* ==========================================================================
   內容區域
   ========================================================================== */

.offline-indicator-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.offline-indicator--floating .offline-indicator-content {
  align-items: center;
  justify-content: center;
}

.offline-indicator-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.offline-indicator--floating .offline-indicator-icon {
  font-size: 1.5rem;
  margin: 0;
}

.offline-indicator-text {
  flex: 1;
  min-width: 0;
}

.offline-indicator-message {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: 0.25rem;
}

.offline-indicator--minimal .offline-indicator-message {
  margin-bottom: 0;
}

.offline-indicator-details {
  display: block;
  font-size: 0.75rem;
  color: var(--color-foreground-secondary);
  line-height: 1.4;
}

/* ==========================================================================
   操作按鈕
   ========================================================================== */

.offline-indicator-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.offline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.offline-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.offline-btn--retry {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.offline-btn--retry:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.offline-btn--dismiss {
  background: var(--color-background-secondary);
  color: var(--color-foreground);
  border-color: var(--color-border);
}

.offline-btn--dismiss:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

/* ==========================================================================
   網路品質指示器
   ========================================================================== */

.offline-indicator-quality {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.quality-bars {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 1rem;
}

.quality-bar {
  width: 3px;
  background: var(--color-border);
  border-radius: 1px;
  transition: all 0.2s ease;
}

.quality-bar:nth-child(1) { height: 25%; }
.quality-bar:nth-child(2) { height: 50%; }
.quality-bar:nth-child(3) { height: 75%; }
.quality-bar:nth-child(4) { height: 100%; }

.quality-bar--active {
  background: var(--color-primary);
}

.quality-text {
  font-size: 0.75rem;
  color: var(--color-foreground-secondary);
}

/* ==========================================================================
   持久狀態樣式
   ========================================================================== */

.offline-indicator--persistent {
  border-color: var(--color-error-500);
  background: linear-gradient(135deg, 
    var(--color-background), 
    rgba(var(--color-error-500), 0.05)
  );
}

.offline-indicator--persistent .offline-indicator-icon {
  color: rgb(var(--color-error-500));
}

/* ==========================================================================
   動畫效果
   ========================================================================== */

.offline-indicator-enter-active,
.offline-indicator-leave-active {
  transition: all 0.3s ease;
}

.offline-indicator-enter-from.offline-indicator--top {
  opacity: 0;
  transform: translateX(-50%) translateY(-1rem);
}

.offline-indicator-enter-from.offline-indicator--bottom {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}

.offline-indicator-enter-from.offline-indicator--floating {
  opacity: 0;
  transform: scale(0.8);
}

.offline-indicator-enter-from.offline-indicator--banner.offline-indicator--top {
  transform: translateY(-100%);
}

.offline-indicator-enter-from.offline-indicator--banner.offline-indicator--bottom {
  transform: translateY(100%);
}

.offline-indicator-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ==========================================================================
   響應式設計
   ========================================================================== */

@media (max-width: 640px) {
  .offline-indicator--top,
  .offline-indicator--bottom {
    left: 0.5rem;
    right: 0.5rem;
    transform: none;
    min-width: auto;
  }
  
  .offline-indicator--floating {
    top: auto;
    bottom: 1rem;
    right: 1rem;
  }
  
  .offline-indicator-content {
    gap: 0.5rem;
  }
  
  .offline-indicator-actions {
    flex-direction: column;
    width: 100%;
    margin-top: 0.5rem;
  }
}

/* ==========================================================================
   無障礙和動畫偏好
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
  .offline-indicator,
  .offline-btn,
  .quality-bar {
    transition: none;
  }
  
  .offline-indicator-enter-active,
  .offline-indicator-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .offline-indicator-enter-from,
  .offline-indicator-leave-to {
    transform: none;
  }
  
  .animate-pulse {
    animation: none;
  }
}

@media (prefers-contrast: high) {
  .offline-indicator {
    border-width: 2px;
  }
  
  .offline-btn--retry {
    background: var(--color-primary);
  }
  
  .offline-btn--dismiss {
    border-width: 2px;
  }
  
  .quality-bar--active {
    background: var(--color-primary);
  }
}

/* ==========================================================================
   隱藏浮動元件的文字（僅顯示圖示）
   ========================================================================== */

.offline-indicator--floating .offline-indicator-text,
.offline-indicator--floating .offline-indicator-actions,
.offline-indicator--floating .offline-indicator-quality {
  display: none;
}
</style>