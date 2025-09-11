<template>
  <div class="home-page">
    <!-- 頁面標頭 -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <Icon name="mdi:water" class="title-icon" />
          FlowSip
        </h1>
        <p class="page-subtitle">喝水提醒與番茄鐘</p>
      </div>
    </header>

    <!-- 主要內容區 -->
    <main class="main-content">
      <!-- 模式選擇區 -->
      <section v-if="timerState.status === 'stopped'" class="mode-section">
        <TimerModeSwitch
          :current-mode="selectedMode"
          :disabled="timerState.status === 'running'"
          :show-title="true"
          :show-subtitle="true"
          :show-custom-duration="true"
          @mode-change="handleModeSelect"
          @duration-change="handleDurationChange"
        />
      </section>

      <!-- 計時器顯示區 -->
      <section class="timer-section">
        <TimerDisplay
          :mode="timerState.mode"
          :phase="timerState.phase"
          :status="timerState.status"
          :duration="timerState.duration"
          :remaining="timerState.remaining"
          :elapsed="timerState.duration - timerState.remaining"
          :progress="timerProgress"
          :pause-count="timerState.pauseCount"
          :show-details="showTimerDetails"
          :size="timerDisplaySize"
          :variant="timerVariant"
        />
      </section>

      <!-- 控制按鈕區 -->
      <section class="controls-section">
        <TimerControls
          :status="timerState.status"
          :mode="timerState.mode"
          :duration="timerState.duration"
          :remaining="timerState.remaining"
          :disabled="isTimerDisabled"
          :show-quick-settings="showQuickSettings"
          :show-time-adjustments="showTimeAdjustments"
          @start="handleStart"
          @pause="handlePause"
          @stop="handleStop"
          @reset="handleReset"
          @adjust="handleTimeAdjust"
        />
      </section>

      <!-- 狀態資訊區 -->
      <section v-if="showStatusInfo" class="status-section">
        <div class="status-info">
          <!-- 連線狀態 -->
          <div v-if="!isOnline" class="status-item">
            <Icon name="mdi:wifi-off" class="status-icon status-icon--warning" />
            <span class="status-text">離線模式</span>
          </div>
          
          <!-- 通知狀態 -->
          <div v-if="notificationStatus !== 'granted'" class="status-item">
            <Icon name="mdi:bell-off" class="status-icon status-icon--info" />
            <span class="status-text">
              {{ notificationStatus === 'denied' ? '通知已關閉' : '點擊允許通知' }}
            </span>
            <button 
              v-if="notificationStatus === 'default'"
              class="status-action"
              @click="requestNotificationPermission"
            >
              允許
            </button>
          </div>

          <!-- 計時準確性提示 */
          <div class="status-item" v-if="showAccuracyInfo && timerState.isRunning">
            <Icon name="mdi:timer-check" class="status-icon status-icon--success" />
            <span class="status-text">Web Worker 精準計時中</span>
          </div>
        </div>
      </section>
    </main>

    <!-- 頁面底部 -->
    <footer class="page-footer">
      <div class="footer-content">
        <!-- 快速動作 -->
        <div class="quick-actions">
          <button 
            class="quick-action"
            :class="{ 'quick-action--active': showTimerDetails }"
            @click="toggleTimerDetails"
          >
            <Icon name="mdi:information-outline" />
            <span>詳細資訊</span>
          </button>
          
          <button 
            class="quick-action"
            @click="toggleSettings"
          >
            <Icon name="mdi:cog-outline" />
            <span>設定</span>
          </button>
          
          <button 
            class="quick-action"
            @click="openStats"
          >
            <Icon name="mdi:chart-line" />
            <span>統計</span>
          </button>
        </div>
      </div>
    </footer>

    <!-- 設定面板 (簡化版) -->
    <div v-if="showSettingsPanel" class="settings-overlay" @click="closeSettings">
      <div class="settings-panel" @click.stop>
        <header class="settings-header">
          <h3>快速設定</h3>
          <button class="close-btn" @click="closeSettings">
            <Icon name="mdi:close" />
          </button>
        </header>
        
        <div class="settings-content">
          <!-- 音效設定 -->
          <div class="setting-item">
            <label class="setting-label">
              <Icon name="mdi:volume-high" />
              <span>提醒音效</span>
            </label>
            <div class="setting-control">
              <input 
                v-model="soundEnabled" 
                type="checkbox" 
                class="setting-toggle"
                @change="updateSoundSetting"
              >
            </div>
          </div>
          
          <!-- 視覺提醒設定 */
          <div class="setting-item">
            <label class="setting-label">
              <Icon name="mdi:eye-outline" />
              <span>視覺提醒</span>
            </label>
            <div class="setting-control">
              <input 
                type="checkbox" 
                v-model="visualAlertsEnabled" 
                @change="updateVisualSetting"
                class="setting-toggle"
              >
            </div>
          </div>
          
          <!-- 暗色主題 -->
          <div class="setting-item">
            <label class="setting-label">
              <Icon name="mdi:theme-light-dark" />
              <span>暗色主題</span>
            </label>
            <div class="setting-control">
              <input 
                v-model="darkMode" 
                type="checkbox" 
                class="setting-toggle"
                @change="updateThemeSetting"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section></main></div></template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { TimerMode } from '~/types'

// SEO 設定
useSeoMeta({
  title: 'FlowSip - 喝水提醒與番茄鐘',
  description: '簡單易用的喝水提醒和番茄鐘工具，幫助你保持健康作息和專注工作',
  ogTitle: 'FlowSip PWA',
  ogDescription: '喝水提醒與番茄鐘 - 健康生活好幫手',
  ogType: 'website'
})

// Composables
const timer = useTimer()
const storage = useStorage()
const notifications = useNotifications()

// 響應式狀態
const selectedMode = ref<TimerMode | null>(null)
const customDuration = ref<number>(0)
const showTimerDetails = ref(false)
const showSettingsPanel = ref(false)
const isOnline = ref(true)

// 設定狀態
const soundEnabled = ref(true)
const visualAlertsEnabled = ref(true)
const darkMode = ref(false)

// 計算屬性
const timerState = computed(() => timer.state.value)

const timerProgress = computed(() => {
  if (timerState.value.duration === 0) return 0
  return (timerState.value.duration - timerState.value.remaining) / timerState.value.duration
})

const timerDisplaySize = computed(() => {
  // 根據螢幕大小自動調整
  return 'md' // 可以根據 viewport 動態調整
})

const timerVariant = computed(() => {
  if (!timerState.value.mode) return 'default'
  return timerState.value.mode === 'water' ? 'water' : 'pomodoro'
})

const isTimerDisabled = computed(() => {
  return false // MVP 版本暫不禁用
})

const showQuickSettings = computed(() => {
  return !timerState.value.isRunning && !timerState.value.isPaused
})

const showTimeAdjustments = computed(() => {
  return timerState.value.isRunning || timerState.value.isPaused
})

const showStatusInfo = computed(() => {
  return !isOnline.value || notificationStatus.value !== 'granted' || 
         (showAccuracyInfo.value && timerState.value.isRunning)
})

const showAccuracyInfo = ref(true)

const notificationStatus = computed(() => {
  return notifications.state.permission
})

// 計時器事件處理
async function handleModeSelect(mode: TimerMode, duration: number) {
  selectedMode.value = mode
  customDuration.value = duration
}

function handleDurationChange(duration: number) {
  customDuration.value = duration
}

async function handleStart() {
  console.log('開始計時 - 模式:', selectedMode.value, '時間:', customDuration.value, '狀態:', timerState.value.status)
  
  // 如果計時器已暫停，則恢復計時
  if (timerState.value.status === 'paused') {
    try {
      await timer.resume()
      return
    } catch (error) {
      showError('恢復計時器失敗：' + (error as Error).message)
      return
    }
  }
  
  // 否則開始新的計時
  if (!selectedMode.value || customDuration.value === 0) {
    // 顯示錯誤提示
    showError(`請先選擇計時模式和時間。當前模式: ${selectedMode.value}, 時間: ${customDuration.value}`)
    return
  }

  try {
    await timer.start(selectedMode.value, customDuration.value)
  } catch (error) {
    showError('啟動計時器失敗：' + (error as Error).message)
  }
}

async function handlePause() {
  try {
    await timer.pause()
  } catch (error) {
    showError('暫停計時器失敗：' + (error as Error).message)
  }
}

async function handleStop() {
  try {
    await timer.stop()
  } catch (error) {
    showError('停止計時器失敗：' + (error as Error).message)
  }
}

async function handleReset() {
  try {
    await timer.reset()
  } catch (error) {
    showError('重置計時器失敗：' + (error as Error).message)
  }
}

function handleTimeAdjust(adjustment: { minutes?: number; seconds?: number }) {
  // MVP 版本暫時不實作時間調整
  console.log('時間調整：', adjustment)
}

// 設定相關處理
function toggleTimerDetails() {
  showTimerDetails.value = !showTimerDetails.value
}

function toggleSettings() {
  showSettingsPanel.value = !showSettingsPanel.value
}

function closeSettings() {
  showSettingsPanel.value = false
}

function openStats() {
  // MVP 版本暫時不實作統計頁面
  showInfo('統計功能將在後續版本推出')
}

async function requestNotificationPermission() {
  try {
    await notifications.requestPermission()
  } catch (error) {
    showError('無法開啟通知權限')
  }
}

// 設定更新
function updateSoundSetting() {
  // TODO: 更新音效設定
  console.log('音效設定：', soundEnabled.value)
}

function updateVisualSetting() {
  // TODO: 更新視覺提醒設定
  console.log('視覺提醒設定：', visualAlertsEnabled.value)
}

function updateThemeSetting() {
  // TODO: 更新主題設定
  console.log('主題設定：', darkMode.value)
}

// 錯誤和資訊提示
function showError(message: string) {
  // MVP 版本使用簡單的 alert
  alert('錯誤：' + message)
}

function showSuccess(message: string) {
  // MVP 版本使用簡單的 alert
  alert('✅ ' + message)
}

function showInfo(message: string) {
  // MVP 版本使用簡單的 alert
  alert('資訊：' + message)
}

// 監聽網路狀態
function updateOnlineStatus() {
  isOnline.value = navigator.onLine
}

// 生命週期
onMounted(async () => {
  // 監聽網路狀態
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateOnlineStatus()
  
  // 初始化通知系統
  try {
    await notifications.initialize()
  } catch (error) {
    console.warn('通知系統初始化失敗：', error)
  }
  
  // 載入使用者設定
  try {
    const settings = await storage.loadSettings()
    soundEnabled.value = settings.soundEnabled || true
    visualAlertsEnabled.value = settings.fallbackAlerts?.visualAlertsEnabled || true
    // darkMode.value = settings.theme === 'dark'
  } catch (error) {
    console.warn('載入設定失敗：', error)
    // 使用預設值
    soundEnabled.value = true
    visualAlertsEnabled.value = true
  }
  
  // 設定計時器完成回調
  timer.setCallbacks({
    onComplete: (record) => {
      console.log('計時完成！', record)
      
      // 發送通知
      const mode = record.mode === 'water' ? '喝水提醒' : '番茄鐘'
      notifications.sendTimerCompleteNotification(mode, `${mode}時間到了！`, record.mode)
      
      // 顯示完成提醒
      showSuccess(`${mode}完成！時間到了。`)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

// 監聽計時器完成事件
watch(() => timerState.value.status, (newStatus) => {
  if (newStatus === 'completed') {
    // 顯示完成通知
    const mode = timerState.value.mode
    const message = mode === 'water' ? '該喝水了！💧' : '番茄鐘時間到！🍅'
    
    // 觸發通知
    notifications.showNotification({
      title: 'FlowSip 提醒',
      body: message,
      tag: 'timer-completed'
    })
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

/* 頁面標頭 */
.page-header {
  padding: 2rem 1rem 1rem;
  text-align: center;
}

.header-content {
  max-width: 480px;
  margin: 0 auto;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 3rem;
  color: rgb(59 130 246);
}

.page-subtitle {
  font-size: 1.125rem;
  opacity: 0.8;
  margin: 0;
}

/* 主要內容 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

.mode-section,
.timer-section,
.controls-section,
.status-section {
  width: 100%;
}

.timer-section {
  display: flex;
  justify-content: center;
}

.controls-section {
  display: flex;
  justify-content: center;
}

/* 狀態資訊 */
.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgb(0 0 0 / 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid rgb(255 255 255 / 0.1);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon--warning {
  color: rgb(234 179 8);
}

.status-icon--info {
  color: rgb(59 130 246);
}

.status-icon--success {
  color: rgb(34 197 94);
}

.status-text {
  flex: 1;
}

.status-action {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid rgb(255 255 255 / 0.3);
  background: rgb(255 255 255 / 0.1);
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-action:hover {
  background: rgb(255 255 255 / 0.2);
  border-color: rgb(255 255 255 / 0.5);
}

/* 頁面底部 */
.page-footer {
  padding: 1rem;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}

.footer-content {
  max-width: 640px;
  margin: 0 auto;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.2);
  background: rgb(255 255 255 / 0.1);
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 4rem;
}

.quick-action:hover {
  background: rgb(255 255 255 / 0.2);
  border-color: rgb(255 255 255 / 0.4);
  transform: translateY(-1px);
}

.quick-action--active {
  background: rgb(59 130 246 / 0.3);
  border-color: rgb(59 130 246 / 0.5);
}

/* 設定面板 */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(0 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.settings-panel {
  background: white;
  color: #1f2937;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: auto;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.settings-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgb(0 0 0 / 0.1);
}

.settings-content {
  padding: 0 1.5rem 1.5rem;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.setting-toggle {
  width: 44px;
  height: 24px;
  appearance: none;
  background: #d1d5db;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.setting-toggle:checked {
  background: rgb(59 130 246);
}

.setting-toggle::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.setting-toggle:checked::before {
  transform: translateX(20px);
}

/* 響應式設計 */
@media (max-width: 640px) {
  .page-header {
    padding: 1.5rem 1rem 0.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .title-icon {
    font-size: 2.5rem;
  }
  
  .main-content {
    gap: 1.5rem;
    padding: 0.5rem 1rem;
  }
  
  .quick-actions {
    gap: 0.75rem;
  }
  
  .quick-action {
    min-width: 3.5rem;
    padding: 0.5rem 0.75rem;
  }
}

/* 暗色主題支援 */
@media (prefers-color-scheme: dark) {
  /* 暗色主題樣式可以在這裡定義 */
}
</style>