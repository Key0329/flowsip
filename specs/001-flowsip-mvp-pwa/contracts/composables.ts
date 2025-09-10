/**
 * Nuxt 4 Composables 契約定義
 * 基於 Vue 3 Composition API 和 Nuxt 4 約定的 Composables 介面
 */

// ============================================================================
// useTimer Composable
// ============================================================================

export interface TimerComposable {
  // 響應式狀態
  state: Ref<TimerState>;
  isRunning: ComputedRef<boolean>;
  isPaused: ComputedRef<boolean>;
  remaining: ComputedRef<number>;
  formattedTime: ComputedRef<string>;
  progress: ComputedRef<number>; // 0-100%
  
  // 計時器控制
  start: (mode: TimerMode, duration?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: (completed?: boolean) => Promise<ActivityRecord | null>;
  reset: () => Promise<void>;
  
  // 背景同步
  sync: () => Promise<void>;
  
  // 事件監聽
  onTick: (callback: (remaining: number) => void) => () => void;
  onComplete: (callback: (record: ActivityRecord) => void) => () => void;
  onModeChange: (callback: (mode: TimerMode) => void) => () => void;
}

/**
 * useTimer - 計時器 Composable
 * 提供完整的計時器狀態管理和 Web Worker 整合
 */
export declare function useTimer(): TimerComposable;

// ============================================================================
// useStorage Composable
// ============================================================================

export interface StorageComposable {
  // 活動記錄管理
  activities: {
    save: (record: ActivityRecord) => Promise<void>;
    saveBatch: (records: ActivityRecord[]) => Promise<number>;
    getByDate: (date: string) => Promise<ActivityRecord[]>;
    getByDateRange: (startDate: string, endDate: string) => Promise<ActivityRecord[]>;
    delete: (id: string) => Promise<boolean>;
    count: () => Promise<number>;
  };
  
  // 設定管理
  settings: {
    get: <T = UserSettings>() => Promise<T>;
    set: (settings: Partial<UserSettings>) => Promise<void>;
    reset: () => Promise<void>;
    export: () => Promise<string>;
    import: (data: string) => Promise<boolean>;
  };
  
  // 統計資料管理
  stats: {
    getDaily: (date: string) => Promise<DailyStats | null>;
    saveDaily: (stats: DailyStats) => Promise<void>;
    getWeekly: (weekStart: string) => Promise<WeeklyStats | null>;
    saveWeekly: (stats: WeeklyStats) => Promise<void>;
    recalculate: (date?: string) => Promise<void>;
  };
  
  // 資料匯出與清理
  export: {
    toCSV: (startDate?: string, endDate?: string) => Promise<string>;
    toJSON: () => Promise<ExportData>;
  };
  
  clear: {
    activities: (olderThan?: string) => Promise<number>;
    stats: () => Promise<void>;
    all: (confirmToken: string) => Promise<void>;
  };
  
  // 儲存狀態
  usage: ComputedRef<StorageUsage>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
}

/**
 * useStorage - 儲存 Composable
 * 整合 localStorage 和 IndexedDB 的統一儲存介面
 */
export declare function useStorage(): StorageComposable;

// ============================================================================
// useNotifications Composable
// ============================================================================

export interface NotificationComposable {
  // 權限管理
  permission: ComputedRef<NotificationPermission>;
  isSupported: ComputedRef<boolean>;
  canShowNotification: ComputedRef<boolean>;
  
  // 權限請求
  requestPermission: () => Promise<NotificationPermission>;
  
  // 通知顯示
  show: (options: NotificationOptions) => Promise<void>;
  schedule: (delay: number, options: NotificationOptions) => Promise<string>;
  cancel: (id: string) => Promise<boolean>;
  
  // 多媒體提醒
  playSound: (type: SoundType, volume?: number) => Promise<void>;
  vibrate: (pattern?: number | number[]) => Promise<boolean>;
  showVisual: (options: VisualAlertOptions) => Promise<void>;
  
  // 組合提醒
  trigger: (options: ReminderOptions) => Promise<ReminderResult>;
  stopAll: () => Promise<void>;
  
  // 測試功能
  test: (options: TestOptions) => Promise<TestResult>;
  
  // 支援度檢測
  support: ComputedRef<NotificationSupport>;
  
  // 狀態管理
  isActive: Ref<boolean>;
  lastResult: Ref<ReminderResult | null>;
}

/**
 * useNotifications - 通知 Composable
 * 整合系統通知、音效、振動和視覺提醒
 */
export declare function useNotifications(): NotificationComposable;

// ============================================================================
// useStats Composable
// ============================================================================

export interface StatsComposable {
  // 統計資料
  today: ComputedRef<DailyStats | null>;
  thisWeek: ComputedRef<WeeklyStats | null>;
  summary: ComputedRef<StatsSummary>;
  
  // 資料載入
  loadDaily: (date: string) => Promise<DailyStats | null>;
  loadWeekly: (weekStart: string) => Promise<WeeklyStats | null>;
  loadMonthly: (year: number, month: number) => Promise<MonthlyStats | null>;
  
  // 資料計算
  recalculate: (date?: string) => Promise<void>;
  recalculateRange: (startDate: string, endDate: string) => Promise<number>;
  
  // 分析功能
  getTrends: (period: 7 | 14 | 30) => Promise<TrendAnalysis>;
  getPatterns: (period: 7 | 14 | 30) => Promise<UsagePattern>;
  getAchievements: () => Promise<Achievement[]>;
  
  // 目標管理
  goals: Ref<PersonalGoals>;
  progress: ComputedRef<GoalProgress>;
  setGoals: (goals: PersonalGoals) => Promise<void>;
  
  // 報告生成
  generateReport: (options: ReportOptions) => Promise<StatisticsReport>;
  
  // 狀態管理
  isLoading: Ref<boolean>;
  lastUpdated: ComputedRef<Date | null>;
}

/**
 * useStats - 統計 Composable
 * 提供資料統計、分析和報告功能
 */
export declare function useStats(): StatsComposable;

// ============================================================================
// useSettings Composable
// ============================================================================

export interface SettingsComposable {
  // 響應式設定
  settings: Ref<UserSettings>;
  
  // 設定分類
  timer: ComputedRef<TimerSettings>;
  notifications: ComputedRef<NotificationSettings>;
  appearance: ComputedRef<AppearanceSettings>;
  privacy: ComputedRef<PrivacySettings>;
  
  // 設定更新
  updateTimer: (settings: Partial<TimerSettings>) => Promise<void>;
  updateNotifications: (settings: Partial<NotificationSettings>) => Promise<void>;
  updateAppearance: (settings: Partial<AppearanceSettings>) => Promise<void>;
  updatePrivacy: (settings: Partial<PrivacySettings>) => Promise<void>;
  
  // 批次操作
  update: (settings: Partial<UserSettings>) => Promise<void>;
  reset: () => Promise<void>;
  
  // 匯入匯出
  export: () => Promise<string>;
  import: (data: string) => Promise<boolean>;
  
  // 驗證
  validate: (settings: Partial<UserSettings>) => ValidationResult;
  
  // 狀態管理
  isDirty: ComputedRef<boolean>;
  isValid: ComputedRef<boolean>;
  errors: ComputedRef<string[]>;
}

/**
 * useSettings - 設定 Composable
 * 管理應用程式設定和偏好
 */
export declare function useSettings(): SettingsComposable;

// ============================================================================
// useTheme Composable
// ============================================================================

export interface ThemeComposable {
  // 主題狀態
  currentTheme: Ref<'light' | 'dark' | 'auto'>;
  resolvedTheme: ComputedRef<'light' | 'dark'>;
  isDark: ComputedRef<boolean>;
  
  // 主題控制
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
  
  // 系統主題偵測
  systemTheme: ComputedRef<'light' | 'dark'>;
  prefersColorScheme: ComputedRef<'light' | 'dark'>;
  
  // CSS 變數
  cssVars: ComputedRef<Record<string, string>>;
  
  // 主題應用
  applyTheme: (theme: 'light' | 'dark') => void;
}

/**
 * useTheme - 主題 Composable
 * 管理應用程式主題和外觀
 */
export declare function useTheme(): ThemeComposable;

// ============================================================================
// usePWA Composable
// ============================================================================

export interface PWAComposable {
  // PWA 狀態
  isInstallable: Ref<boolean>;
  isInstalled: ComputedRef<boolean>;
  isUpdateAvailable: Ref<boolean>;
  isOffline: Ref<boolean>;
  
  // 安裝管理
  install: () => Promise<boolean>;
  showInstallPrompt: Ref<boolean>;
  dismissInstallPrompt: () => void;
  
  // 更新管理
  updateApp: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  
  // 離線狀態
  goOffline: () => void;
  goOnline: () => void;
  
  // PWA 事件
  onInstalled: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: () => void) => () => void;
  onOfflineStatusChange: (callback: (isOffline: boolean) => void) => () => void;
  
  // PWA 資訊
  manifest: ComputedRef<any>;
  serviceWorker: ComputedRef<ServiceWorkerRegistration | null>;
}

/**
 * usePWA - PWA 功能 Composable
 * 管理 PWA 安裝、更新和離線功能
 */
export declare function usePWA(): PWAComposable;

// ============================================================================
// 共用型別定義
// ============================================================================

export type TimerMode = 'water' | 'pomodoro';

export interface TimerSettings {
  waterInterval: number;      // 分鐘
  pomodoroFocus: number;     // 分鐘
  pomodoroBreak: number;     // 分鐘
  autoStartBreak: boolean;
  defaultMode: TimerMode;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;            // 0-100
  soundType: SoundType;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-TW' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
}

export interface PrivacySettings {
  dataRetentionDays: number;
  allowAnalytics: boolean;
  allowCrashReporting: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 重新匯出核心型別（來自其他契約檔案）
export type {
  TimerState,
  ActivityRecord,
  DailyStats,
  WeeklyStats,
  MonthlyStats,
  UserSettings,
  NotificationOptions,
  SoundType,
  VisualAlertOptions,
  ReminderOptions,
  ReminderResult,
  TestOptions,
  TestResult,
  NotificationSupport,
  StatsSummary,
  TrendAnalysis,
  UsagePattern,
  Achievement,
  PersonalGoals,
  GoalProgress,
  ReportOptions,
  StatisticsReport,
  ExportData,
  StorageUsage
} from './timer-api'

// Nuxt 3/4 型別擴展
declare module '#app' {
  interface NuxtApp {
    $timer: TimerComposable;
    $storage: StorageComposable;
    $notifications: NotificationComposable;
    $stats: StatsComposable;
  }
}

// Vue 型別匯入
import type { Ref, ComputedRef } from 'vue'