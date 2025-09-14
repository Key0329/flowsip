/**
 * FlowSip MVP 基礎型別定義
 * 
 * 包含 TimerState, UserSettings, ActivityRecord, SoundConfig 等核心資料結構
 * 遵循正體中文註解規範和 MVP 精簡原則
 */

// =============================================================================
// 計時器相關型別
// =============================================================================

/**
 * 計時器模式
 */
export type TimerMode = 'water' | 'pomodoro'

/**
 * 計時器狀態
 */
export type TimerStatus = 'stopped' | 'running' | 'paused'

/**
 * 計時器狀態介面
 * 包含計時器的完整狀態資訊
 */
export interface TimerState {
  /** 計時器狀態 */
  status: TimerStatus
  
  /** 計時器模式，null 表示未選擇 */
  mode: TimerMode | null
  
  /** 總計時長度（毫秒） */
  duration: number
  
  /** 剩餘時間（毫秒） */
  remaining: number
  
  /** 開始時間，null 表示未開始 */
  startTime: Date | null
  
  /** 暫停時間，null 表示未暫停 */
  pauseTime: Date | null
  
  /** 進度百分比 (0-1) */
  progress: number
  
  /** 計時器 ID，用於識別不同的計時器實例 */
  id?: string
}

/**
 * 計時器錯誤類別
 */
export class TimerError extends Error {
  constructor(
    message: string,
    public code: TimerErrorCode,
    public details?: unknown
  ) {
    super(message)
    this.name = 'TimerError'
  }
}

/**
 * 計時器錯誤代碼
 */
export type TimerErrorCode = 
  | 'TIMER_ALREADY_RUNNING'
  | 'TIMER_NOT_RUNNING'
  | 'TIMER_NOT_PAUSED'
  | 'INVALID_TIMER_MODE'
  | 'INVALID_DURATION'
  | 'DURATION_EXCEEDS_LIMIT'
  | 'TIMER_INITIALIZATION_FAILED'

// =============================================================================
// 使用者設定相關型別
// =============================================================================

/**
 * 主題模式
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 計時器預設值介面
 */
export interface TimerPreset {
  /** 預設值 ID */
  id: string
  
  /** 預設值名稱 */
  name: string
  
  /** 計時長度（秒） */
  duration: number
  
  /** 描述 */
  description: string
  
  /** 顏色 */
  color: string
  
  /** 圖示 */
  icon: string
  
  /** 是否為預設 */
  isDefault: boolean
  
  /** 分類 */
  category: 'health' | 'productivity' | 'break' | 'custom'
}

/**
 * 安靜時段設定
 */
export interface QuietHours {
  /** 是否啟用安靜時段 */
  enabled: boolean
  
  /** 開始時間 (HH:mm) */
  start: string
  
  /** 結束時間 (HH:mm) */
  end: string
}

/**
 * 通知設定介面
 */
export interface NotificationSettings {
  /** 是否啟用通知 */
  enabled: boolean
  
  /** 是否啟用音效 */
  sound: boolean
  
  /** 是否啟用震動 */
  vibration: boolean
  
  /** 是否啟用桌面通知 */
  desktop: boolean
  
  /** 是否啟用徽章通知 */
  badge: boolean
  
  /** 是否啟用持續通知 */
  persistentNotification: boolean
  
  /** 安靜時段設定 */
  quietHours: QuietHours
}

/**
 * 音效設定介面
 */
export interface SoundSettings {
  /** 是否啟用音效 */
  enabled: boolean
  
  /** 音量 (0-1) */
  volume: number
  
  /** 音效檔案路徑 */
  sounds: {
    complete: string
    warning: string
    tick: string
    start: string
    pause: string
  }
}

/**
 * 進階設定介面
 */
export interface AdvancedSettings {
  /** 是否啟用分析 */
  enableAnalytics: boolean
  
  /** 自動儲存 */
  autoSave: boolean
  
  /** 背景同步 */
  backgroundSync: boolean
  
  /** 除錯模式 */
  debugMode: boolean
  
  /** 實驗性功能 */
  experimentalFeatures: boolean
}

/**
 * 無障礙設定介面
 */
export interface AccessibilitySettings {
  /** 高對比模式 */
  highContrast: boolean
  
  /** 減少動畫 */
  reducedMotion: boolean
  
  /** 大文字模式 */
  largeText: boolean
  
  /** 螢幕閱讀器支援 */
  screenReader: boolean
}

/**
 * 使用者設定介面
 */
export interface UserSettings {
  /** 主題模式 */
  theme: ThemeMode
  
  /** 計時器預設值 */
  timerPresets: TimerPreset[]
  
  /** 預設計時器預設值 ID */
  defaultPresetId: string
  
  /** 通知設定 */
  notifications: NotificationSettings
  
  /** 音效設定 */
  sounds: SoundSettings
  
  /** 進階設定 */
  advanced: AdvancedSettings
  
  /** 無障礙設定 */
  accessibility: AccessibilitySettings
}

/**
 * 替代提醒設定（當系統通知不可用時）
 */
export interface FallbackAlertSettings {
  /** 是否啟用視覺提醒 */
  visualAlertsEnabled: boolean
  
  /** 是否啟用音效提醒 */
  soundAlertsEnabled: boolean
  
  /** 是否啟用分頁標題提醒 */
  tabTitleAlertsEnabled: boolean
  
  /** 閃爍持續時間（秒） */
  flashDuration: number
  
  /** 提醒音效類型 */
  alertSoundType: 'chime' | 'bell' | 'notification' | 'beep'
  
  /** 是否重複播放音效 */
  repeatSound: boolean
}

/**
 * 設定驗證錯誤
 */
export class SettingsError extends Error {
  constructor(
    message: string,
    public field: keyof UserSettings,
    public value: unknown
  ) {
    super(message)
    this.name = 'SettingsError'
  }
}

// =============================================================================
// 活動記錄相關型別
// =============================================================================

/**
 * 活動記錄介面
 * 記錄每次計時活動的詳細資訊
 */
export interface ActivityRecord {
  /** 記錄 ID */
  id: string
  
  /** 活動類型 */
  type: TimerMode
  
  /** 開始時間 */
  startTime: Date
  
  /** 結束時間 */
  endTime: Date
  
  /** 實際持續時間（毫秒） */
  duration: number
  
  /** 是否正常完成 */
  completed: boolean
  
  /** 日期字串 (YYYY-MM-DD) */
  date: string
  
  /** 額外元資料 */
  metadata?: ActivityMetadata
}

/**
 * 活動元資料
 */
export interface ActivityMetadata {
  /** 計畫持續時間（毫秒） */
  plannedDuration?: number
  
  /** 暫停次數 */
  pauseCount?: number
  
  /** 總暫停時間（毫秒） */
  totalPauseTime?: number
  
  /** 用戶標籤 */
  tags?: string[]
  
  /** 用戶備註 */
  note?: string
}

// =============================================================================
// 統計相關型別
// =============================================================================

/**
 * 每日統計資料
 */
export interface DailyStats {
  /** 日期字串 (YYYY-MM-DD) */
  date: string
  
  /** 完成的喝水次數 */
  waterCompletedCount: number
  
  /** 完成的番茄鐘次數 */
  pomodoroCompletedCount: number
  
  /** 總喝水時間（毫秒） */
  totalWaterTime: number
  
  /** 總番茄鐘時間（毫秒） */
  totalPomodoroTime: number
  
  /** 總計時時間（毫秒） */
  totalActiveTime: number
  
  /** 最後更新時間 */
  lastUpdated: Date
}

/**
 * 週統計資料
 */
export interface WeeklyStats {
  /** 週開始日期 (YYYY-MM-DD) */
  weekStart: string
  
  /** 每日統計 */
  dailyStats: DailyStats[]
  
  /** 週總計 */
  weeklyTotals: Omit<DailyStats, 'date' | 'lastUpdated'>
  
  /** 最後更新時間 */
  lastUpdated: Date
}

// =============================================================================
// 儲存相關型別
// =============================================================================

/**
 * 儲存錯誤類別
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public operation: StorageOperation,
    public key?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * 儲存操作類型
 */
export type StorageOperation = 'save' | 'load' | 'delete' | 'clear' | 'import' | 'export'

/**
 * 資料驗證結果
 */
export interface ValidationResult {
  /** 是否通過驗證 */
  isValid: boolean
  
  /** 錯誤訊息陣列 */
  errors: string[]
  
  /** 警告訊息陣列 */
  warnings?: string[]
}

// =============================================================================
// API 介面定義（契約）
// =============================================================================

/**
 * 計時器 API 介面
 * 定義計時器核心功能的契約
 */
export interface TimerAPI {
  /** 啟動計時器 */
  start(mode: TimerMode, duration?: number): Promise<TimerState>
  
  /** 暫停計時器 */
  pause(): Promise<TimerState>
  
  /** 繼續計時器 */
  resume(): Promise<TimerState>
  
  /** 停止計時器 */
  stop(completed: boolean): Promise<ActivityRecord>
  
  /** 重置計時器 */
  reset(): Promise<TimerState>
  
  /** 獲取計時器狀態 */
  getState(): TimerState
  
  /** 校正計時器時間 */
  syncTime(): Promise<TimerState>
  
  /** 設定計時器回調 */
  setCallbacks(callbacks: TimerCallbacks): void
}

/**
 * 計時器回調函數
 */
export interface TimerCallbacks {
  /** 計時器狀態變更回調 */
  onStateChange?: (state: TimerState) => void
  
  /** 計時器完成回調 */
  onComplete?: (record: ActivityRecord) => void
  
  /** 計時器錯誤回調 */
  onError?: (error: TimerError) => void
  
  /** 計時器更新回調 */
  onTick?: (remaining: number, progress: number) => void
}

/**
 * 儲存 API 介面
 * 定義本機資料儲存功能的契約
 */
export interface StorageAPI {
  /** 儲存活動記錄 */
  saveActivity(record: ActivityRecord): Promise<void>
  
  /** 批次儲存活動記錄 */
  saveActivities(records: ActivityRecord[]): Promise<number>
  
  /** 獲取指定日期的活動記錄 */
  getActivitiesByDate(date: string): Promise<ActivityRecord[]>
  
  /** 獲取日期範圍內的活動記錄 */
  getActivitiesByDateRange(startDate: string, endDate: string): Promise<ActivityRecord[]>
  
  /** 刪除指定活動記錄 */
  deleteActivity(id: string): Promise<boolean>
  
  /** 儲存用戶設定 */
  saveSettings(settings: UserSettings): Promise<void>
  
  /** 載入用戶設定 */
  loadSettings(): Promise<UserSettings>
  
  /** 儲存每日統計 */
  saveDailyStats(stats: DailyStats): Promise<void>
  
  /** 載入每日統計 */
  loadDailyStats(date: string): Promise<DailyStats | null>
  
  /** 儲存週統計 */
  saveWeeklyStats(stats: WeeklyStats): Promise<void>
  
  /** 載入週統計 */
  loadWeeklyStats(weekStart: string): Promise<WeeklyStats | null>
  
  /** 清空所有資料 */
  clearAllData(): Promise<void>
  
  /** 匯出資料 */
  exportData(): Promise<string>
  
  /** 匯入資料 */
  importData(data: string): Promise<void>
}

// =============================================================================
// Web Worker 相關型別
// =============================================================================

/**
 * Web Worker 訊息類型
 */
export type WorkerMessageType = 
  | 'TIMER_START'
  | 'TIMER_PAUSE' 
  | 'TIMER_RESUME'
  | 'TIMER_STOP'
  | 'TIMER_RESET'
  | 'TIMER_SYNC'
  | 'TIMER_TICK'
  | 'TIMER_COMPLETE'
  | 'TIMER_ERROR'

/**
 * Worker 訊息介面
 */
export interface WorkerMessage {
  /** 訊息類型 */
  type: WorkerMessageType
  
  /** 訊息 ID */
  id: string
  
  /** 時間戳 */
  timestamp: number
  
  /** 訊息資料 */
  data?: unknown
}

/**
 * 計時器開始訊息資料
 */
export interface TimerStartData {
  mode: TimerMode
  duration: number
  startTime: number
}

/**
 * 計時器更新訊息資料  
 */
export interface TimerTickData {
  remaining: number
  progress: number
  elapsed: number
}

// =============================================================================
// 工具型別
// =============================================================================

/**
 * 使型別的所有屬性變為可選
 */
export type Partial<T> = {
  [P in keyof T]?: T[P]
}

/**
 * 從型別中挑選指定的屬性
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

/**
 * 從型別中排除指定的屬性
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * 日期字串類型 (YYYY-MM-DD)
 */
export type DateString = string

/**
 * 時間戳類型（毫秒）
 */
export type Timestamp = number

/**
 * UUID 字串類型
 */
export type UUID = string

// =============================================================================
// 常數定義
// =============================================================================

/**
 * 預設設定值
 */
export const DEFAULT_SETTINGS: UserSettings = {
  waterInterval: 30 * 60 * 1000, // 30 分鐘
  pomodoroInterval: 25 * 60 * 1000, // 25 分鐘  
  breakInterval: 5 * 60 * 1000, // 5 分鐘
  soundEnabled: true,
  volume: 0.5,
  theme: 'light',
  notificationsEnabled: true,
  fallbackAlerts: {
    visualAlertsEnabled: true,
    soundAlertsEnabled: true,
    tabTitleAlertsEnabled: true,
    flashDuration: 3,
    alertSoundType: 'chime',
    repeatSound: false
  }
}

/**
 * 預設計時器狀態
 */
export const DEFAULT_TIMER_STATE: TimerState = {
  status: 'stopped',
  mode: null,
  duration: 0,
  remaining: 0,
  startTime: null,
  pauseTime: null,
  progress: 0
}

/**
 * 時間常數
 */
export const TIME_CONSTANTS = {
  /** 一秒鐘的毫秒數 */
  SECOND: 1000,
  
  /** 一分鐘的毫秒數 */
  MINUTE: 60 * 1000,
  
  /** 一小時的毫秒數 */
  HOUR: 60 * 60 * 1000,
  
  /** 一天的毫秒數 */
  DAY: 24 * 60 * 60 * 1000,
  
  /** 最大允許計時時間（24 小時） */
  MAX_DURATION: 24 * 60 * 60 * 1000
} as const

/**
 * 儲存鍵名常數
 */
export const STORAGE_KEYS = {
  SETTINGS: 'flowsip-settings',
  ACTIVITIES: 'flowsip-activities',
  DAILY_STATS: 'flowsip-daily-stats',
  WEEKLY_STATS: 'flowsip-weekly-stats',
  TIMER_STATE: 'flowsip-timer-state'
} as const

// =============================================================================
// 音效相關型別
// =============================================================================

/**
 * 音效類型
 */
export type SoundType = 
  | 'water-reminder'
  | 'pomodoro-complete'
  | 'break-start'
  | 'button-click'
  | 'notification-pop'
  | 'timer-tick'
  | 'success-chime'
  | 'error-beep'

/**
 * 音效配置介面
 */
export interface SoundConfig {
  /** 音效檔案路徑 */
  file: string
  
  /** 備用格式檔案路徑 */
  fallback?: string
  
  /** 音效持續時間（毫秒） */
  duration: number
  
  /** 音效描述 */
  description: string
  
  /** 音效標籤 */
  tags?: string[]
}

/**
 * 音效載入結果
 */
export interface SoundPreloadResult {
  /** 音效類型 */
  type: SoundType
  
  /** 載入成功 */
  success: boolean
  
  /** 錯誤訊息 */
  error?: string
}

/**
 * 音效載入狀態
 */
export type SoundLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'