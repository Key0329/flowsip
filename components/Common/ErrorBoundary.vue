<template>
  <div v-if="hasError" class="error-boundary" role="alert">
    <div class="error-container">
      <!-- 錯誤圖示 -->
      <div class="error-icon">
        <Icon name="mdi:alert-circle" class="error-icon-svg" />
      </div>
      
      <!-- 錯誤標題 -->
      <h1 class="error-title">應用程式發生錯誤</h1>
      
      <!-- 錯誤描述 -->
      <p class="error-message">
        很抱歉，FlowSip 遇到了一個意外的錯誤。
        <br>
        我們已記錄了這個問題，請稍後再試。
      </p>
      
      <!-- 錯誤詳情 (開發模式) -->
      <details v-if="isDev && errorDetails" class="error-details">
        <summary>技術詳情</summary>
        <pre class="error-stack">{{ errorDetails }}</pre>
      </details>
      
      <!-- 操作按鈕 -->
      <div class="error-actions">
        <button 
          class="btn btn--primary"
          aria-label="重新載入應用程式"
          @click="handleReload"
        >
          <Icon name="mdi:refresh" class="btn-icon" />
          重新載入
        </button>
        
        <button 
          class="btn btn--secondary"
          aria-label="重設應用程式狀態"
          @click="handleReset"
        >
          <Icon name="mdi:restore" class="btn-icon" />
          重設狀態
        </button>
        
        <button 
          class="btn btn--outline"
          aria-label="回報問題"
          @click="handleReport"
        >
          <Icon name="mdi:bug-report" class="btn-icon" />
          回報問題
        </button>
      </div>
      
      <!-- 建議行動 -->
      <div class="error-suggestions">
        <h3>您可以嘗試：</h3>
        <ul>
          <li>重新載入頁面</li>
          <li>清除瀏覽器快取</li>
          <li>檢查網路連線</li>
          <li>更新瀏覽器版本</li>
        </ul>
      </div>
    </div>
  </div>
  
  <!-- 正常內容 -->
  <slot v-else />
</template>

<script setup lang="ts">
interface Props {
  fallback?: boolean
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fallback: true,
  showDetails: false
})

// 響應式狀態
const hasError = ref(false)
const errorDetails = ref<string>('')
const errorCount = ref(0)

// 環境檢查
const isDev = computed(() => {
  return import.meta.dev || import.meta.env.DEV
})

// 錯誤處理
const handleError = (error: Error, instance?: any) => {
  console.error('ErrorBoundary 捕獲錯誤:', error)
  
  hasError.value = true
  errorCount.value++
  
  if (isDev.value || props.showDetails) {
    errorDetails.value = `${error.name}: ${error.message}\n\n${error.stack}`
  }
  
  // 錯誤追蹤和上報
  trackError(error, {
    component: 'ErrorBoundary',
    count: errorCount.value,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  })
}

// 重新載入
const handleReload = () => {
  window.location.reload()
}

// 重設狀態
const handleReset = () => {
  // 清除本地儲存
  localStorage.clear()
  
  // 重設錯誤狀態
  hasError.value = false
  errorDetails.value = ''
  errorCount.value = 0
  
  // 通知用戶
  alert('應用程式狀態已重設，請重新載入頁面')
  
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

// 回報問題
const handleReport = () => {
  const subject = encodeURIComponent('FlowSip 錯誤回報')
  const body = encodeURIComponent(`
錯誤詳情：
${errorDetails.value}

瀏覽器：${navigator.userAgent}
時間：${new Date().toISOString()}
頁面：${window.location.href}
  `.trim())
  
  const mailtoUrl = `mailto:support@flowsip.app?subject=${subject}&body=${body}`
  window.open(mailtoUrl, '_blank')
}

// 錯誤追蹤函式
const trackError = (error: Error, context: Record<string, any>) => {
  // 在實際專案中，這裡會發送到錯誤追蹤服務
  // 例如：Sentry, LogRocket, Bugsnag 等
  
  if (isDev.value) {
    console.group('🐛 錯誤追蹤')
    console.error('錯誤:', error)
    console.log('上下文:', context)
    console.groupEnd()
  }
  
  // 本地錯誤記錄
  const errorLog = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    id: Math.random().toString(36).substr(2, 9)
  }
  
  try {
    const existingLogs = JSON.parse(localStorage.getItem('flowsip-error-logs') || '[]')
    existingLogs.push(errorLog)
    
    // 只保留最近 10 個錯誤記錄
    const recentLogs = existingLogs.slice(-10)
    localStorage.setItem('flowsip-error-logs', JSON.stringify(recentLogs))
  } catch (storageError) {
    console.warn('無法儲存錯誤記錄:', storageError)
  }
}

// Vue 錯誤處理器
const errorHandler = (error: unknown, instance: any, info: string) => {
  if (error instanceof Error) {
    handleError(error, instance)
  } else {
    handleError(new Error(String(error)), instance)
  }
}

// 未捕獲的 Promise 錯誤
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
  console.error('未捕獲的 Promise 錯誤:', event.reason)
  
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason))
    
  handleError(error)
  event.preventDefault()
}

// 全域錯誤處理
const globalErrorHandler = (event: ErrorEvent) => {
  console.error('全域錯誤:', event.error)
  handleError(event.error || new Error(event.message))
  event.preventDefault()
}

// 生命週期
onMounted(() => {
  // 註冊全域錯誤處理器
  window.addEventListener('error', globalErrorHandler)
  window.addEventListener('unhandledrejection', unhandledRejectionHandler)
})

onUnmounted(() => {
  // 清理事件監聽器
  window.removeEventListener('error', globalErrorHandler)
  window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
})

// 暴露錯誤處理方法
defineExpose({
  handleError,
  reset: () => {
    hasError.value = false
    errorDetails.value = ''
    errorCount.value = 0
  }
})
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-page);
  background: var(--color-background);
  color: var(--color-text-primary);
}

.error-container {
  max-width: 600px;
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.error-icon {
  margin-bottom: 1.5rem;
}

.error-icon-svg {
  font-size: 4rem;
  color: var(--color-danger);
  opacity: 0.8;
}

.error-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--color-danger);
}

.error-message {
  font-size: var(--text-lg);
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.error-details {
  text-align: left;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.error-details summary {
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 0.5rem;
  user-select: none;
}

.error-stack {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--color-background);
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin: 0;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn--secondary {
  background: var(--color-secondary);
  color: white;
}

.btn--secondary:hover {
  background: var(--color-secondary-dark);
  transform: translateY(-1px);
}

.btn--outline {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.btn--outline:hover {
  background: var(--color-surface);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-icon {
  font-size: 1.125rem;
}

.error-suggestions {
  text-align: left;
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-warning);
}

.error-suggestions h3 {
  margin: 0 0 1rem 0;
  font-size: var(--text-lg);
  color: var(--color-warning);
}

.error-suggestions ul {
  margin: 0;
  padding-left: 1.5rem;
}

.error-suggestions li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 響應式設計 */
@media (max-width: 640px) {
  .error-container {
    padding: 1rem;
  }
  
  .error-title {
    font-size: var(--text-2xl);
  }
  
  .error-message {
    font-size: var(--text-base);
  }
  
  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    justify-content: center;
  }
}

/* 暗色主題 */
@media (prefers-color-scheme: dark) {
  .error-stack {
    background: var(--color-surface-dark);
  }
}

/* 高對比度 */
@media (prefers-contrast: high) {
  .error-boundary {
    border: 2px solid var(--color-border);
  }
  
  .btn {
    border-width: 3px;
  }
}

/* 減少動畫 */
@media (prefers-reduced-motion: reduce) {
  .error-container {
    animation: none;
  }
  
  .btn {
    transition: none;
  }
  
  .btn:hover {
    transform: none;
  }
}
</style>