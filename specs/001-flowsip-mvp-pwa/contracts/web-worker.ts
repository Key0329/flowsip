/**
 * Web Worker 契約定義
 * 定義主執行緒與 Timer Web Worker 之間的通信協議
 */

// ============================================================================
// Web Worker 訊息協議
// ============================================================================

/**
 * 從主執行緒發送給 Worker 的訊息類型
 */
export type WorkerInboundMessage =
  | StartTimerMessage
  | PauseTimerMessage
  | ResumeTimerMessage
  | StopTimerMessage
  | SyncTimerMessage
  | GetStateMessage
  | ConfigMessage;

/**
 * Worker 發送給主執行緒的訊息類型
 */
export type WorkerOutboundMessage =
  | TimerTickMessage
  | TimerCompleteMessage
  | TimerStateMessage
  | TimerErrorMessage
  | WorkerReadyMessage
  | SyncResponseMessage;

// ============================================================================
// 主執行緒 → Worker 訊息
// ============================================================================

export interface StartTimerMessage {
  type: 'START_TIMER';
  id: string;
  payload: {
    mode: 'water' | 'pomodoro';
    duration: number;        // 毫秒
    startTime: number;       // 時間戳
    phase?: 'focus' | 'break'; // 番茄鐘階段
  };
}

export interface PauseTimerMessage {
  type: 'PAUSE_TIMER';
  id: string;
  payload: {
    pauseTime: number;       // 暫停時間戳
  };
}

export interface ResumeTimerMessage {
  type: 'RESUME_TIMER';
  id: string;
  payload: {
    resumeTime: number;      // 恢復時間戳
  };
}

export interface StopTimerMessage {
  type: 'STOP_TIMER';
  id: string;
  payload: {
    stopTime: number;        // 停止時間戳
    manual: boolean;         // 是否手動停止
  };
}

export interface SyncTimerMessage {
  type: 'SYNC_TIMER';
  id: string;
  payload: {
    currentTime: number;     // 目前時間戳
    requestSync: boolean;    // 是否需要狀態同步
  };
}

export interface GetStateMessage {
  type: 'GET_STATE';
  id: string;
}

export interface ConfigMessage {
  type: 'CONFIG';
  id: string;
  payload: {
    tickInterval: number;    // tick 間隔（毫秒，預設 1000）
    syncThreshold: number;   // 同步閾值（毫秒，預設 2000）
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// ============================================================================
// Worker → 主執行緒 訊息
// ============================================================================

export interface TimerTickMessage {
  type: 'TIMER_TICK';
  id: string;
  payload: {
    remaining: number;       // 剩餘時間（毫秒）
    elapsed: number;         // 已過時間（毫秒）
    progress: number;        // 進度百分比 (0-1)
    timestamp: number;       // 訊息時間戳
  };
}

export interface TimerCompleteMessage {
  type: 'TIMER_COMPLETE';
  id: string;
  payload: {
    mode: 'water' | 'pomodoro';
    phase?: 'focus' | 'break';
    duration: number;        // 總時長
    actualDuration: number;  // 實際運行時長
    completedAt: number;     // 完成時間戳
    nextPhase?: 'break' | 'focus' | null; // 下一階段（番茄鐘）
  };
}

export interface TimerStateMessage {
  type: 'TIMER_STATE';
  id: string;
  payload: WorkerTimerState;
}

export interface TimerErrorMessage {
  type: 'TIMER_ERROR';
  id: string;
  error: {
    code: TimerErrorCode;
    message: string;
    details?: any;
    timestamp: number;
  };
}

export interface WorkerReadyMessage {
  type: 'WORKER_READY';
  payload: {
    workerId: string;
    capabilities: WorkerCapabilities;
    timestamp: number;
  };
}

export interface SyncResponseMessage {
  type: 'SYNC_RESPONSE';
  id: string;
  payload: {
    correctedState: WorkerTimerState;
    timeDrift: number;       // 時間漂移（毫秒）
    syncedAt: number;        // 同步時間戳
  };
}

// ============================================================================
// Worker 內部狀態
// ============================================================================

export interface WorkerTimerState {
  // 基本狀態
  isRunning: boolean;
  isPaused: boolean;
  mode: 'water' | 'pomodoro';
  phase?: 'focus' | 'break';
  
  // 時間資訊
  duration: number;         // 總時長（毫秒）
  remaining: number;        // 剩餘時間（毫秒）
  elapsed: number;          // 已過時間（毫秒）
  
  // 時間戳記錄
  startTimestamp: number | null;
  pauseTimestamp: number | null;
  resumeTimestamp: number | null;
  
  // 統計資訊
  pauseDuration: number;    // 總暫停時長（毫秒）
  pauseCount: number;       // 暫停次數
  
  // 番茄鐘特有
  cycleCount: number;       // 週期計數
  
  // 狀態追蹤
  createdAt: number;        // 建立時間戳
  lastUpdateAt: number;     // 最後更新時間戳
}

// ============================================================================
// 錯誤處理
// ============================================================================

export type TimerErrorCode =
  | 'INVALID_STATE'          // 無效狀態轉換
  | 'INVALID_DURATION'       // 無效時長
  | 'TIMER_NOT_FOUND'        // 計時器不存在
  | 'ALREADY_RUNNING'        // 已在運行
  | 'NOT_RUNNING'            // 未運行
  | 'NOT_PAUSED'             // 未暫停
  | 'TIME_DRIFT_TOO_LARGE'   // 時間漂移過大
  | 'WORKER_INTERNAL_ERROR'; // Worker 內部錯誤

export class TimerWorkerError extends Error {
  constructor(
    public code: TimerErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TimerWorkerError';
  }
}

// ============================================================================
// Worker 能力描述
// ============================================================================

export interface WorkerCapabilities {
  // 支援的功能
  supportsHighPrecisionTimer: boolean;  // 高精度計時支援
  supportsBackgroundExecution: boolean; // 背景執行支援
  supportsTimeCorrection: boolean;      // 時間校正支援
  
  // 效能資訊
  minTickInterval: number;              // 最小 tick 間隔（毫秒）
  maxTimerDuration: number;             // 最大計時時長（毫秒）
  timePrecision: number;                // 時間精度（毫秒）
  
  // 瀏覽器資訊
  userAgent: string;
  isServiceWorkerContext: boolean;
}

// ============================================================================
// Worker 介面定義
// ============================================================================

export interface TimerWorkerInterface {
  /**
   * 開始計時器
   */
  start(options: {
    mode: 'water' | 'pomodoro';
    duration: number;
    phase?: 'focus' | 'break';
  }): void;
  
  /**
   * 暫停計時器
   */
  pause(): void;
  
  /**
   * 恢復計時器
   */
  resume(): void;
  
  /**
   * 停止計時器
   */
  stop(manual?: boolean): void;
  
  /**
   * 同步時間狀態
   */
  sync(currentTime: number): void;
  
  /**
   * 獲取目前狀態
   */
  getState(): WorkerTimerState;
  
  /**
   * 配置 Worker
   */
  configure(config: {
    tickInterval?: number;
    syncThreshold?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  }): void;
}

// ============================================================================
// 主執行緒 Worker 管理介面
// ============================================================================

export interface WorkerManager {
  /**
   * 初始化 Worker
   */
  initialize(): Promise<void>;
  
  /**
   * 發送訊息給 Worker
   */
  postMessage(message: WorkerInboundMessage): void;
  
  /**
   * 監聽 Worker 訊息
   */
  onMessage(callback: (message: WorkerOutboundMessage) => void): () => void;
  
  /**
   * 監聽 Worker 錯誤
   */
  onError(callback: (error: TimerWorkerError) => void): () => void;
  
  /**
   * 終止 Worker
   */
  terminate(): void;
  
  /**
   * 檢查 Worker 狀態
   */
  isAlive(): boolean;
  
  /**
   * 重啟 Worker
   */
  restart(): Promise<void>;
}

// ============================================================================
// 實用工具型別
// ============================================================================

/**
 * 提取訊息 payload 型別
 */
export type MessagePayload<T> = T extends { payload: infer P } ? P : never;

/**
 * 提取特定類型的訊息
 */
export type MessageOfType<T extends WorkerOutboundMessage, K extends T['type']> = 
  T extends { type: K } ? T : never;

/**
 * Worker 訊息處理器型別
 */
export type WorkerMessageHandler<T extends WorkerOutboundMessage> = (
  message: T
) => void;

/**
 * Worker 配置選項
 */
export interface WorkerConfig {
  workerUrl: string;
  terminateTimeout: number;  // 終止超時時間（毫秒）
  restartOnError: boolean;   // 錯誤時自動重啟
  maxRestartAttempts: number; // 最大重啟嘗試次數
}

// ============================================================================
// 常數定義
// ============================================================================

export const WORKER_CONSTANTS = {
  DEFAULT_TICK_INTERVAL: 1000,      // 預設 tick 間隔 1 秒
  DEFAULT_SYNC_THRESHOLD: 2000,     // 預設同步閾值 2 秒
  MAX_TIME_DRIFT: 5000,             // 最大允許時間漂移 5 秒
  WORKER_READY_TIMEOUT: 5000,       // Worker 就緒超時 5 秒
  MESSAGE_TIMEOUT: 10000,           // 訊息回應超時 10 秒
} as const;

export const TIMER_LIMITS = {
  MIN_DURATION: 1000,               // 最小計時時長 1 秒
  MAX_DURATION: 24 * 60 * 60 * 1000, // 最大計時時長 24 小時
  MAX_PAUSE_COUNT: 100,             // 最大暫停次數
} as const;