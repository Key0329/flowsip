/**
 * 通知 API 契約定義
 * 負責系統通知、音效和視覺提醒的管理
 */

export interface NotificationAPI {
  /**
   * 請求通知權限
   * @returns Promise<NotificationPermission> 權限狀態
   */
  requestPermission(): Promise<NotificationPermission>;

  /**
   * 檢查通知權限狀態
   * @returns NotificationPermission 目前權限狀態
   */
  getPermissionStatus(): NotificationPermission;

  /**
   * 顯示系統通知
   * @param options - 通知選項
   * @returns Promise<void>
   * @throws NotificationError 當無權限或通知失敗時
   */
  showNotification(options: NotificationOptions): Promise<void>;

  /**
   * 排程延遲通知（用於背景提醒）
   * @param delay - 延遲時間（毫秒）
   * @param options - 通知選項
   * @returns Promise<string> 通知 ID（用於取消）
   */
  scheduleNotification(delay: number, options: NotificationOptions): Promise<string>;

  /**
   * 取消排程通知
   * @param notificationId - 通知 ID
   * @returns Promise<boolean> 是否成功取消
   */
  cancelNotification(notificationId: string): Promise<boolean>;

  /**
   * 播放音效提醒
   * @param soundType - 音效類型
   * @param volume - 音量 (0-100)
   * @returns Promise<void>
   * @throws NotificationError 當音效播放失敗時
   */
  playSound(soundType: SoundType, volume: number): Promise<void>;

  /**
   * 觸發振動提醒（行動裝置）
   * @param pattern - 振動模式
   * @returns Promise<boolean> 是否成功觸發振動
   */
  vibrate(pattern: number | number[]): Promise<boolean>;

  /**
   * 顯示視覺提醒（頁面高亮、閃爍等）
   * @param options - 視覺提醒選項
   * @returns Promise<void>
   */
  showVisualAlert(options: VisualAlertOptions): Promise<void>;

  /**
   * 組合提醒（系統通知 + 音效 + 振動 + 視覺）
   * @param reminderOptions - 提醒選項
   * @returns Promise<ReminderResult> 各種提醒的執行結果
   */
  triggerReminder(reminderOptions: ReminderOptions): Promise<ReminderResult>;

  /**
   * 停止所有進行中的提醒
   * @returns Promise<void>
   */
  stopAllReminders(): Promise<void>;

  /**
   * 測試通知功能（用於設定頁面）
   * @param testOptions - 測試選項
   * @returns Promise<TestResult> 測試結果
   */
  testNotification(testOptions: TestOptions): Promise<TestResult>;

  /**
   * 訂閱通知事件
   * @param event - 事件類型
   * @param callback - 事件回調函式
   * @returns 取消訂閱函式
   */
  on(event: NotificationEvent, callback: (data: any) => void): () => void;

  /**
   * 檢查裝置通知支援度
   * @returns NotificationSupport 支援情況
   */
  getSupport(): NotificationSupport;
}

/**
 * 通知錯誤類型
 */
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'NOT_SUPPORTED' | 'AUDIO_BLOCKED' | 'VIBRATION_FAILED'
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * 通知選項
 */
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;          // 用於替換相同類型的通知
  requireInteraction?: boolean;  // 是否需要用戶互動才關閉
  silent?: boolean;      // 是否靜音
  actions?: NotificationAction[];  // 通知動作按鈕
  data?: any;           // 自訂資料
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * 音效類型
 */
export type SoundType = 
  | 'water_reminder'      // 喝水提醒音效
  | 'pomodoro_focus'      // 番茄鐘專注結束音效
  | 'pomodoro_break'      // 番茄鐘休息結束音效
  | 'notification'       // 一般通知音效
  | 'success'            // 成功音效
  | 'error';             // 錯誤音效

/**
 * 視覺提醒選項
 */
export interface VisualAlertOptions {
  type: 'flash' | 'pulse' | 'shake' | 'highlight';
  duration: number;      // 持續時間（毫秒）
  intensity: 'low' | 'medium' | 'high';
  color?: string;        // 高亮顏色
  element?: string;      // 目標元素選擇器
}

/**
 * 綜合提醒選項
 */
export interface ReminderOptions {
  // 通知選項
  notification?: {
    enabled: boolean;
    options: NotificationOptions;
  };
  
  // 音效選項
  sound?: {
    enabled: boolean;
    type: SoundType;
    volume: number;
  };
  
  // 振動選項
  vibration?: {
    enabled: boolean;
    pattern: number | number[];
  };
  
  // 視覺提醒選項
  visual?: {
    enabled: boolean;
    options: VisualAlertOptions;
  };
  
  // 提醒內容
  context: {
    type: 'water' | 'pomodoro';
    phase?: 'focus' | 'break';
    message: string;
  };
}

/**
 * 提醒執行結果
 */
export interface ReminderResult {
  notification: {
    attempted: boolean;
    success: boolean;
    error?: string;
  };
  sound: {
    attempted: boolean;
    success: boolean;
    error?: string;
  };
  vibration: {
    attempted: boolean;
    success: boolean;
    error?: string;
  };
  visual: {
    attempted: boolean;
    success: boolean;
    error?: string;
  };
  
  overallSuccess: boolean;
  fallbackUsed: boolean;  // 是否使用了降級提醒
}

/**
 * 測試選項
 */
export interface TestOptions {
  testNotification: boolean;
  testSound: boolean;
  testVibration: boolean;
  testVisual: boolean;
  soundType?: SoundType;
  volume?: number;
}

/**
 * 測試結果
 */
export interface TestResult {
  notification: TestItemResult;
  sound: TestItemResult;
  vibration: TestItemResult;
  visual: TestItemResult;
  overallScore: number;  // 0-100 分
  recommendations: string[];
}

export interface TestItemResult {
  supported: boolean;
  working: boolean;
  latency?: number;      // 響應延遲（毫秒）
  error?: string;
}

/**
 * 通知事件類型
 */
export type NotificationEvent = 
  | 'permission_changed'   // 權限狀態變更
  | 'notification_clicked' // 通知被點擊
  | 'notification_closed'  // 通知被關閉
  | 'sound_ended'         // 音效播放結束
  | 'visual_completed';   // 視覺提醒完成

/**
 * 裝置支援情況
 */
export interface NotificationSupport {
  systemNotification: boolean;     // 系統通知
  serviceWorkerNotification: boolean; // Service Worker 通知
  webAudio: boolean;              // Web Audio API
  vibration: boolean;             // 振動 API
  pageVisibility: boolean;        // Page Visibility API
  backgroundSync: boolean;        // Background Sync
  
  // 瀏覽器特定限制
  requiresUserInteraction: boolean; // 是否需要用戶互動才能播放音效
  notificationPersistence: boolean; // 通知是否持久
  maxNotifications?: number;        // 最大通知數量限制
}

/**
 * 通知權限狀態（標準 Notification API）
 */
export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * 預設音效配置
 */
export interface SoundConfig {
  water_reminder: {
    file: string;
    duration: number;
    defaultVolume: number;
  };
  pomodoro_focus: {
    file: string;
    duration: number;
    defaultVolume: number;
  };
  pomodoro_break: {
    file: string;
    duration: number;
    defaultVolume: number;
  };
  notification: {
    file: string;
    duration: number;
    defaultVolume: number;
  };
  success: {
    file: string;
    duration: number;
    defaultVolume: number;
  };
  error: {
    file: string;
    duration: number;
    defaultVolume: number;
  };
}