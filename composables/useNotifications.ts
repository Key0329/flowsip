/**
 * useNotifications composable 基礎版
 * 
 * 提供音效和視覺提醒功能，包含：
 * - 系統通知權限管理
 * - 替代提醒機制（音效、視覺、分頁標題）
 * - 權限檢測和降級處理
 * - 設定保存和載入
 */

import { computed, reactive, watch, type Ref } from 'vue'
import type { 
  UserSettings, 
  FallbackAlertSettings, 
  TimerMode,
  ActivityRecord
} from '~/types/index'
import { useStorage } from '~/composables/useStorage'

/**
 * 通知 API 介面
 */
export interface NotificationAPI {
  /** 檢查通知權限狀態 */
  checkPermission(): Promise<NotificationPermission>
  
  /** 請求通知權限 */
  requestPermission(): Promise<NotificationPermission>
  
  /** 發送系統通知 */
  sendNotification(title: string, options?: NotificationOptions): Promise<Notification | null>
  
  /** 發送計時完成通知 */
  sendTimerCompleteNotification(mode: TimerMode, record: ActivityRecord): Promise<void>
  
  /** 播放提醒音效 */
  playAlertSound(soundType?: string, volume?: number): Promise<void>
  
  /** 停止播放音效 */
  stopAlertSound(): Promise<void>
  
  /** 顯示視覺提醒 */
  showVisualAlert(message: string, mode: TimerMode): Promise<void>
  
  /** 隱藏視覺提醒 */
  hideVisualAlert(): void
  
  /** 啟動分頁標題提醒 */
  startTabTitleAlert(message: string): void
  
  /** 停止分頁標題提醒 */
  stopTabTitleAlert(): void
  
  /** 關閉所有提醒 */
  dismissAllAlerts(): void
  
  /** 更新替代提醒設定 */
  updateFallbackSettings(settings: FallbackAlertSettings): Promise<void>
}

/**
 * 通知狀態
 */
export interface NotificationState {
  /** 系統通知權限狀態 */
  permission: NotificationPermission
  
  /** 是否支援系統通知 */
  isSupported: boolean
  
  /** 是否正在播放音效 */
  isPlayingSound: boolean
  
  /** 是否顯示視覺提醒 */
  isShowingVisualAlert: boolean
  
  /** 是否正在分頁標題提醒 */
  isTabTitleAlerting: boolean
  
  /** 目前顯示的提醒訊息 */
  currentAlertMessage: string
  
  /** 替代提醒設定 */
  fallbackSettings: FallbackAlertSettings
}

/**
 * useNotifications 返回值類型
 */
export interface UseNotificationsReturn extends NotificationAPI {
  /** 通知狀態 */
  state: NotificationState
  
  /** 是否需要使用替代提醒 */
  needsFallback: Ref<boolean>
  
  /** 是否可用（支援且有權限） */
  isAvailable: Ref<boolean>
  
  /** 清理函數 */
  cleanup(): void
}

// 音效快取
const audioCache = new Map<string, HTMLAudioElement>()

// 分頁標題提醒狀態
let titleAlertInterval: number | null = null
let originalTitle: string | null = null

/**
 * 預設替代提醒設定
 */
const DEFAULT_FALLBACK_SETTINGS: FallbackAlertSettings = {
  visualAlertsEnabled: true,
  soundAlertsEnabled: true,
  tabTitleAlertsEnabled: true,
  flashDuration: 3,
  alertSoundType: 'chime',
  repeatSound: false
}

/**
 * useNotifications composable
 */
export function useNotifications(): UseNotificationsReturn {
  const storage = useStorage()
  
  // 通知狀態
  const state = reactive<NotificationState>({
    permission: 'default',
    isSupported: false,
    isPlayingSound: false,
    isShowingVisualAlert: false,
    isTabTitleAlerting: false,
    currentAlertMessage: '',
    fallbackSettings: { ...DEFAULT_FALLBACK_SETTINGS }
  })
  
  // 計算屬性
  const needsFallback = computed(() => {
    return !state.isSupported || state.permission === 'denied'
  })
  
  const isAvailable = computed(() => {
    return state.isSupported && state.permission === 'granted'
  })
  
  /**
   * 初始化通知系統
   */
  async function initialize() {
    // 檢查瀏覽器支援
    state.isSupported = 'Notification' in window
    
    if (state.isSupported) {
      state.permission = Notification.permission
      
      // 監聽權限變更
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'notifications' as PermissionName })
          permissionStatus.addEventListener('change', () => {
            state.permission = Notification.permission
          })
        } catch {
          // 忽略權限查詢錯誤，某些瀏覽器不支援
        }
      }
    } else {
      // 不支援時自動啟用替代提醒
      await enableFallbackAlerts()
    }
    
    // 載入設定
    await loadFallbackSettings()
    
    // 如果已經需要替代提醒，確保相關設定已啟用
    if (needsFallback.value) {
      await enableFallbackAlerts()
    }
  }
  
  /**
   * 載入替代提醒設定
   */
  async function loadFallbackSettings() {
    try {
      const userSettings = await storage.loadSettings()
      if (userSettings.fallbackAlerts) {
        state.fallbackSettings = { ...userSettings.fallbackAlerts }
      }
    } catch {
      // 載入設定失敗時使用預設值
    }
  }
  
  /**
   * 自動啟用替代提醒
   */
  async function enableFallbackAlerts() {
    try {
      const userSettings = await storage.loadSettings()
      const updatedSettings: UserSettings = {
        ...userSettings,
        fallbackAlerts: {
          ...DEFAULT_FALLBACK_SETTINGS,
          ...userSettings.fallbackAlerts
        }
      }
      
      await storage.saveSettings(updatedSettings)
      state.fallbackSettings = updatedSettings.fallbackAlerts!
    } catch {
      // 啟用替代提醒失敗時使用預設值
    }
  }
  
  /**
   * 檢查通知權限狀態
   */
  async function checkPermission(): Promise<NotificationPermission> {
    if (!state.isSupported) {
      return 'denied'
    }
    
    state.permission = Notification.permission
    return state.permission
  }
  
  /**
   * 請求通知權限
   */
  async function requestPermission(): Promise<NotificationPermission> {
    if (!state.isSupported) {
      return 'denied'
    }
    
    try {
      state.permission = await Notification.requestPermission()
      return state.permission
    } catch {
      state.permission = 'denied'
      return 'denied'
    }
  }
  
  /**
   * 發送系統通知
   */
  async function sendNotification(title: string, options?: NotificationOptions): Promise<Notification | null> {
    if (!isAvailable.value) {
      return null
    }
    
    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-badge.png',
        tag: 'flowsip-timer',
        renotify: true,
        ...options
      })
      
      // 自動關閉通知
      setTimeout(() => {
        notification.close()
      }, 5000)
      
      return notification
    } catch {
      return null
    }
  }
  
  /**
   * 發送計時完成通知
   */
  async function sendTimerCompleteNotification(mode: TimerMode, record: ActivityRecord): Promise<void> {
    const titles = {
      water: '💧 喝水時間！',
      pomodoro: '🍅 番茄鐘完成！'
    }
    
    const messages = {
      water: `完成了 ${Math.round(record.duration / 60000)} 分鐘的計時，該喝水啦！`,
      pomodoro: `完成了 ${Math.round(record.duration / 60000)} 分鐘的專注工作，休息一下吧！`
    }
    
    // 嘗試發送系統通知
    if (isAvailable.value) {
      await sendNotification(titles[mode], {
        body: messages[mode],
        icon: mode === 'water' ? '/icons/water-icon.png' : '/icons/pomodoro-icon.png'
      })
    }
    
    // 如果需要替代提醒或系統通知失敗，使用替代方案
    if (needsFallback.value || !isAvailable.value) {
      await useFallbackAlerts(titles[mode], mode)
    }
  }
  
  /**
   * 使用替代提醒方案
   */
  async function useFallbackAlerts(message: string, mode: TimerMode) {
    const promises: Promise<void>[] = []
    
    // 視覺提醒
    if (state.fallbackSettings.visualAlertsEnabled) {
      promises.push(showVisualAlert(message, mode))
    }
    
    // 音效提醒
    if (state.fallbackSettings.soundAlertsEnabled) {
      promises.push(playAlertSound(state.fallbackSettings.alertSoundType, 0.8))
    }
    
    // 分頁標題提醒
    if (state.fallbackSettings.tabTitleAlertsEnabled) {
      startTabTitleAlert(message)
    }
    
    await Promise.all(promises)
  }
  
  /**
   * 播放提醒音效
   */
  async function playAlertSound(soundType: string = 'chime', volume: number = 0.5): Promise<void> {
    try {
      const soundPath = `/sounds/${soundType}.mp3`
      
      // 使用快取的音效檔案
      let audio = audioCache.get(soundPath)
      if (!audio) {
        audio = new Audio(soundPath)
        audio.preload = 'auto'
        audioCache.set(soundPath, audio)
      }
      
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.currentTime = 0
      
      state.isPlayingSound = true
      
      await audio.play()
      
      // 如果設定重複播放
      if (state.fallbackSettings.repeatSound) {
        audio.loop = true
      } else {
        audio.addEventListener('ended', () => {
          state.isPlayingSound = false
        }, { once: true })
      }
      
    } catch {
      state.isPlayingSound = false
    }
  }
  
  /**
   * 停止播放音效
   */
  async function stopAlertSound(): Promise<void> {
    audioCache.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
      audio.loop = false
    })
    state.isPlayingSound = false
  }
  
  /**
   * 顯示視覺提醒
   */
  async function showVisualAlert(message: string, _mode: TimerMode): Promise<void> {
    state.isShowingVisualAlert = true
    state.currentAlertMessage = message
    
    // 觸發螢幕閃爍效果
    if (typeof document !== 'undefined') {
      document.body.classList.add('flash-alert')
      
      setTimeout(() => {
        document.body.classList.remove('flash-alert')
      }, state.fallbackSettings.flashDuration * 1000)
    }
  }
  
  /**
   * 隱藏視覺提醒
   */
  function hideVisualAlert(): void {
    state.isShowingVisualAlert = false
    state.currentAlertMessage = ''
    
    if (typeof document !== 'undefined') {
      document.body.classList.remove('flash-alert')
    }
  }
  
  /**
   * 啟動分頁標題提醒
   */
  function startTabTitleAlert(message: string): void {
    if (typeof document === 'undefined') return
    
    // 儲存原始標題
    if (!originalTitle) {
      originalTitle = document.title
    }
    
    // 停止現有的提醒
    stopTabTitleAlert()
    
    state.isTabTitleAlerting = true
    
    // 交替顯示提醒訊息和時間提示
    let isAlertMessage = true
    const alertMessage = message
    const timeMessage = '⏰ 時間到了！'
    
    document.title = alertMessage
    
    titleAlertInterval = window.setInterval(() => {
      document.title = isAlertMessage ? timeMessage : alertMessage
      isAlertMessage = !isAlertMessage
    }, 1000)
  }
  
  /**
   * 停止分頁標題提醒
   */
  function stopTabTitleAlert(): void {
    if (titleAlertInterval) {
      clearInterval(titleAlertInterval)
      titleAlertInterval = null
    }
    
    if (originalTitle && typeof document !== 'undefined') {
      document.title = originalTitle
    }
    
    state.isTabTitleAlerting = false
  }
  
  /**
   * 關閉所有提醒
   */
  function dismissAllAlerts(): void {
    stopAlertSound()
    hideVisualAlert()
    stopTabTitleAlert()
  }
  
  /**
   * 更新替代提醒設定
   */
  async function updateFallbackSettings(settings: FallbackAlertSettings): Promise<void> {
    try {
      const userSettings = await storage.loadSettings()
      const updatedSettings: UserSettings = {
        ...userSettings,
        fallbackAlerts: { ...settings }
      }
      
      await storage.saveSettings(updatedSettings)
      state.fallbackSettings = { ...settings }
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 清理函數
   */
  function cleanup(): void {
    dismissAllAlerts()
    audioCache.clear()
    
    if (originalTitle) {
      originalTitle = null
    }
  }
  
  // 初始化
  initialize().catch(() => {
    // 初始化失敗時忽略錯誤，使用預設狀態
  })
  
  // 監聽設定變更
  watch(() => state.fallbackSettings, async (newSettings) => {
    try {
      await updateFallbackSettings(newSettings)
    } catch {
      // 自動保存失敗時忽略錯誤
    }
  }, { deep: true })
  
  return {
    state,
    needsFallback,
    isAvailable,
    initialize,
    checkPermission,
    requestPermission,
    sendNotification,
    sendTimerCompleteNotification,
    playAlertSound,
    stopAlertSound,
    showVisualAlert,
    hideVisualAlert,
    startTabTitleAlert,
    stopTabTitleAlert,
    dismissAllAlerts,
    updateFallbackSettings,
    cleanup
  }
}