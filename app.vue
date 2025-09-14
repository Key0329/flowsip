<template>
  <div id="app" :class="appClasses">
    <!-- 無障礙路由通告 -->
    <NuxtRouteAnnouncer />
    
    <!-- PWA 更新提示 -->
    <div v-if="showUpdatePrompt" class="update-prompt">
      <div class="update-content">
        <Icon name="mdi:download" class="update-icon" />
        <div class="update-text">
          <p class="update-title">新版本可用</p>
          <p class="update-description">點擊更新以獲得最新功能</p>
        </div>
        <div class="update-actions">
          <button class="update-btn update-btn--primary" @click="updateApp">
            更新
          </button>
          <button class="update-btn update-btn--secondary" @click="dismissUpdate">
            稍後
          </button>
        </div>
      </div>
    </div>

    <!-- 安裝提示 -->
    <div v-if="showInstallPrompt" class="install-prompt">
      <div class="install-content">
        <Icon name="mdi:cellphone-arrow-down" class="install-icon" />
        <div class="install-text">
          <p class="install-title">安裝 FlowSip</p>
          <p class="install-description">在裝置上安裝以獲得更好的體驗</p>
        </div>
        <div class="install-actions">
          <button class="install-btn install-btn--primary" @click="installApp">
            安裝
          </button>
          <button class="install-btn install-btn--secondary" @click="dismissInstall">
            不了，謝謝
          </button>
        </div>
      </div>
    </div>

    <!-- 全域載入狀態 -->
    <div v-if="isLoading" class="global-loading">
      <div class="loading-spinner">
        <Icon name="mdi:loading" class="loading-icon" />
        <p class="loading-text">載入中...</p>
      </div>
    </div>

    <!-- 主要內容區域 -->
    <main class="main-content">
      <NuxtPage />
    </main>

    <!-- 全域通知容器 -->
    <div id="notifications" class="notifications-container"/>

    <!-- 離線指示器 -->
    <div v-if="!isOnline" class="offline-indicator">
      <Icon name="mdi:wifi-off" />
      <span>離線模式</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 定義 PWA 安裝提示事件類型
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// 主題管理
const themeManager = useTheme()

// 響應式狀態
const isOnline = ref(true)
const isLoading = ref(false)
const showUpdatePrompt = ref(false)
const showInstallPrompt = ref(false)

// PWA 相關
let deferredPrompt: Event | null = null

// 計算屬性
const appClasses = computed(() => {
  return {
    [themeManager.effectiveTheme.value]: true,
    'high-contrast': themeManager.isHighContrast.value,
    'app-offline': !isOnline.value,
    'app-loading': isLoading.value
  }
})

// 網路狀態管理
function updateOnlineStatus() {
  isOnline.value = navigator.onLine
}

// PWA 安裝相關
function handleBeforeInstallPrompt(event: Event) {
  // 阻止 Chrome 67 及之前版本自動顯示安裝提示
  event.preventDefault()
  // 儲存事件以便稍後觸發
  deferredPrompt = event
  // 顯示我們自己的安裝提示
  showInstallPrompt.value = true
}

async function installApp() {
  if (deferredPrompt && 'prompt' in deferredPrompt) {
    // 顯示安裝提示
    const promptEvent = deferredPrompt as BeforeInstallPromptEvent
    promptEvent.prompt()
    // 等待使用者回應
    await promptEvent.userChoice
    // 清理
    deferredPrompt = null
  }
  showInstallPrompt.value = false
}

function dismissInstall() {
  showInstallPrompt.value = false
  deferredPrompt = null
}

// PWA 更新相關
function handleAppUpdateAvailable() {
  showUpdatePrompt.value = true
}

function updateApp() {
  // 觸發 service worker 更新
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update()
      window.location.reload()
    })
  }
  showUpdatePrompt.value = false
}

function dismissUpdate() {
  showUpdatePrompt.value = false
}

// 主題初始化
function initializeTheme() {
  // 使用 themeManager 中的方法
  themeManager.initializeTheme()
}


// 載入狀態管理
function showLoading() {
  isLoading.value = true
}

function hideLoading() {
  isLoading.value = false
}

// 生命週期
onMounted(() => {
  // 初始化主題
  initializeTheme()
  
  // 網路狀態監聽
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateOnlineStatus()
  
  // PWA 事件監聽
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  // Service Worker 更新監聽
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', handleAppUpdateAvailable)
  }
  
  // 系統主題變化監聽已在 themeManager 中處理
  
  // 初始載入完成
  nextTick(() => {
    hideLoading()
  })
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('controllerchange', handleAppUpdateAvailable)
  }
  
  // 清理主題管理器
  themeManager.cleanup()
})

// 全域錯誤處理
onErrorCaptured((error, instance, info) => {
  // 開發環境下顯示錯誤，生產環境下可添加錯誤上報邏輯
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.error('應用程式錯誤：', error, info)
  }
  return false
})

// 提供全域方法
provide('showLoading', showLoading)
provide('hideLoading', hideLoading)
</script>

<style>
/* 全域樣式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  scroll-behavior: smooth;
}

body {
  background-color: #f9fafb;
  color: #1f2937;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 暗色主題 */
.dark body {
  background-color: #111827;
  color: #f9fafb;
}

#app {
  min-height: 100vh;
  position: relative;
}

/* 主要內容 */
.main-content {
  position: relative;
  z-index: 1;
}

/* PWA 更新提示 */
.update-prompt {
  position: fixed;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 1000;
  background: rgb(59 130 246);
  color: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgb(0 0 0 / 0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.update-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.update-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.update-text {
  flex: 1;
}

.update-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.update-description {
  font-size: 0.875rem;
  opacity: 0.9;
}

.update-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.update-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgb(255 255 255 / 0.3);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.update-btn--primary {
  background: white;
  color: rgb(59 130 246);
}

.update-btn--primary:hover {
  background: rgb(243 244 246);
}

.update-btn--secondary {
  background: rgb(59 130 246 / 0.1);
  color: white;
}

.update-btn--secondary:hover {
  background: rgb(59 130 246 / 0.2);
}

/* PWA 安裝提示 */
.install-prompt {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 1000;
  background: rgb(34 197 94);
  color: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgb(0 0 0 / 0.1);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.install-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.install-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.install-text {
  flex: 1;
}

.install-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.install-description {
  font-size: 0.875rem;
  opacity: 0.9;
}

.install-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.install-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgb(255 255 255 / 0.3);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.install-btn--primary {
  background: white;
  color: rgb(34 197 94);
}

.install-btn--primary:hover {
  background: rgb(243 244 246);
}

.install-btn--secondary {
  background: rgb(34 197 94 / 0.1);
  color: white;
}

.install-btn--secondary:hover {
  background: rgb(34 197 94 / 0.2);
}

/* 全域載入狀態 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(255 255 255 / 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dark .global-loading {
  background: rgb(17 24 39 / 0.9);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-icon {
  font-size: 3rem;
  animation: spin 1s linear infinite;
  color: rgb(59 130 246);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: rgb(107 114 128);
}

.dark .loading-text {
  color: rgb(156 163 175);
}

/* 通知容器 */
.notifications-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1001;
  pointer-events: none;
}

/* 離線指示器 */
.offline-indicator {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgb(239 68 68);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 999;
  animation: pulse 2s ease-in-out infinite;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .update-prompt,
  .install-prompt {
    left: 0.5rem;
    right: 0.5rem;
  }
  
  .update-content,
  .install-content {
    padding: 0.75rem 1rem;
  }
  
  .update-actions,
  .install-actions {
    flex-direction: column;
  }
  
  .update-btn,
  .install-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}

/* 工具類別 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 無障礙對焦樣式 */
:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

/* 滾動條樣式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgb(243 244 246);
}

.dark ::-webkit-scrollbar-track {
  background: rgb(55 65 81);
}

::-webkit-scrollbar-thumb {
  background: rgb(156 163 175);
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb {
  background: rgb(75 85 99);
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(107 114 128);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgb(107 114 128);
}
</style>
