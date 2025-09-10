/**
 * 計時器 API 契約定義
 * 負責計時器的核心邏輯和狀態管理
 */

export interface TimerAPI {
  /**
   * 啟動計時器
   * @param mode - 計時器模式 ('water' | 'pomodoro')
   * @param duration - 計時時長（毫秒），可選，使用設定中的預設值
   * @returns Promise<TimerState> 更新後的計時器狀態
   * @throws TimerError 當計時器已在運行時
   */
  start(mode: 'water' | 'pomodoro', duration?: number): Promise<TimerState>;

  /**
   * 暫停計時器
   * @returns Promise<TimerState> 更新後的計時器狀態
   * @throws TimerError 當計時器未運行時
   */
  pause(): Promise<TimerState>;

  /**
   * 繼續計時器
   * @returns Promise<TimerState> 更新後的計時器狀態
   * @throws TimerError 當計時器未暫停時
   */
  resume(): Promise<TimerState>;

  /**
   * 停止計時器
   * @param completed - 是否正常完成（true）或手動停止（false）
   * @returns Promise<ActivityRecord> 產生的活動記錄
   */
  stop(completed: boolean): Promise<ActivityRecord>;

  /**
   * 重置計時器到初始狀態
   * @returns Promise<TimerState> 重置後的計時器狀態
   */
  reset(): Promise<TimerState>;

  /**
   * 獲取目前計時器狀態
   * @returns TimerState 目前狀態（同步操作）
   */
  getState(): TimerState;

  /**
   * 校正計時器時間（用於背景恢復後）
   * @returns Promise<TimerState> 校正後的狀態
   */
  recalibrate(): Promise<TimerState>;

  /**
   * 訂閱計時器狀態變化
   * @param callback - 狀態變化回調函式
   * @returns 取消訂閱函式
   */
  subscribe(callback: (state: TimerState) => void): () => void;

  /**
   * 訂閱計時器完成事件
   * @param callback - 完成事件回調函式
   * @returns 取消訂閱函式
   */
  onComplete(callback: (record: ActivityRecord) => void): () => void;
}

/**
 * 計時器錯誤類型
 */
export class TimerError extends Error {
  constructor(
    message: string,
    public code: 'ALREADY_RUNNING' | 'NOT_RUNNING' | 'NOT_PAUSED' | 'INVALID_DURATION'
  ) {
    super(message);
    this.name = 'TimerError';
  }
}

/**
 * 計時器狀態介面（來自 data-model.md）
 */
export interface TimerState {
  mode: 'water' | 'pomodoro';
  duration: number;
  remaining: number;
  startTimestamp: number | null;
  pauseTimestamp: number | null;
  isRunning: boolean;
  isPaused: boolean;
  phase: 'focus' | 'break' | null;
  cycleCount: number;
}

/**
 * 活動記錄介面（來自 data-model.md）
 */
export interface ActivityRecord {
  id: string;
  timestamp: number;
  date: string;
  type: 'water' | 'pomodoro';
  duration: number;
  actualDuration: number;
  completed: boolean;
  interrupted: boolean;
  waterAmount?: number;
  phase?: 'focus' | 'break';
  cycleNumber?: number;
  startTime: string;
  endTime?: string;
  weekday: number;
  manualStop: boolean;
  skipBreak?: boolean;
}

/**
 * 計時器配置選項
 */
export interface TimerConfig {
  waterInterval: number;    // 分鐘
  pomodoroFocus: number;    // 分鐘
  pomodoroBreak: number;    // 分鐘
  autoStartBreak: boolean;  // 是否自動開始休息
}