/**
 * useTimer Composable - FlowSip MVP 基礎版
 * 
 * 提供計時器核心功能的 Vue composable
 * 實作 TimerAPI 契約並整合 Web Worker 計時系統
 * 遵循正體中文註解規範和 MVP 精簡原則
 */

import { ref, computed, reactive, onMounted, onUnmounted, nextTick, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { 
  TimerState, 
  TimerAPI, 
  TimerCallbacks, 
  TimerMode, 
  ActivityRecord,
  TimerError,
  WorkerMessage,
  TimerStartData,
  TimerTickData
} from '~/types'
import { 
  DEFAULT_TIMER_STATE, 
  TIME_CONSTANTS,
  STORAGE_KEYS 
} from '~/types'
import { 
  validateTimerState, 
  throwTimerError,
  generateSimpleUUID,
  normalizeDateString 
} from '~/utils/validation'

/**
 * Timer Web Worker 介面
 */
interface TimerWorker extends Worker {
  postMessage(message: WorkerMessage): void
}

/**
 * useTimer composable 回傳型別
 */
export interface UseTimerReturn extends TimerAPI {
  /** 響應式計時器狀態 */
  state: Readonly<Ref<TimerState>>
  
  /** 計算屬性：是否正在運行 */
  isRunning: ComputedRef<boolean>
  
  /** 計算屬性：是否已暫停 */
  isPaused: ComputedRef<boolean>
  
  /** 計算屬性：是否已停止 */
  isStopped: ComputedRef<boolean>
  
  /** 計算屬性：格式化的剩餘時間 */
  formattedTime: ComputedRef<string>
  
  /** 計算屬性：進度百分比字串 */
  progressPercentage: ComputedRef<string>
  
  /** 清理資源 */
  cleanup(): void
}

/**
 * 預設計時器回調
 */
const defaultCallbacks: TimerCallbacks = {
  onStateChange: () => {},
  onComplete: () => {},
  onError: () => {},
  onTick: () => {}
}

/**
 * useTimer - 計時器 composable
 * 
 * @param initialCallbacks 初始回調函數設定
 * @returns Timer API 和響應式狀態
 */
export function useTimer(initialCallbacks: Partial<TimerCallbacks> = {}): UseTimerReturn {
  // =========================================================================
  // 響應式狀態
  // =========================================================================
  
  /** 計時器狀態 */
  const state = ref<TimerState>({ ...DEFAULT_TIMER_STATE })
  
  /** 計時器回調 */
  const callbacks = reactive<TimerCallbacks>({ 
    ...defaultCallbacks, 
    ...initialCallbacks 
  })
  
  /** Web Worker 實例 */
  let timerWorker: TimerWorker | null = null
  
  /** 計時器 ID（用於識別不同實例） */
  const timerId = generateSimpleUUID()
  
  /** 最後更新時間（用於同步檢查） */
  let lastUpdateTime = 0
  
  // =========================================================================
  // 計算屬性
  // =========================================================================
  
  /** 是否正在運行 */
  const isRunning = computed(() => state.value.status === 'running')
  
  /** 是否已暫停 */
  const isPaused = computed(() => state.value.status === 'paused')
  
  /** 是否已停止 */
  const isStopped = computed(() => state.value.status === 'stopped')
  
  /** 格式化的剩餘時間 */
  const formattedTime = computed(() => {
    return formatTime(state.value.remaining)
  })
  
  /** 進度百分比字串 */
  const progressPercentage = computed(() => {
    return `${Math.round(state.value.progress * 100)}%`
  })
  
  // =========================================================================
  // 內部工具函數
  // =========================================================================
  
  /**
   * 格式化時間（毫秒轉為 MM:SS 格式）
   */
  function formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  /**
   * 更新計時器狀態
   */
  function updateState(newState: Partial<TimerState>): void {
    const updatedState = { ...state.value, ...newState, id: timerId }
    
    // 驗證新狀態
    const validation = validateTimerState(updatedState)
    if (!validation.isValid) {
      throwTimerError('狀態更新失敗：' + validation.errors[0], 'TIMER_INITIALIZATION_FAILED')
      return
    }
    
    state.value = updatedState
    lastUpdateTime = Date.now()
    
    // 觸發狀態變更回調
    callbacks.onStateChange?.(state.value)
    
    // 儲存狀態到 localStorage（用於頁面重新載入恢復）
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(state.value))
      }
    } catch (error) {
      console.warn('計時器狀態儲存失敗:', error)
    }
  }
  
  /**
   * 建立活動記錄
   */
  function createActivityRecord(completed: boolean): ActivityRecord {
    const now = new Date()
    const startTime = state.value.startTime || now
    
    // 計算實際執行時間（如果計時器正在運行，使用實際時間差；如果已停止，使用計畫時間減去剩餘時間）
    let actualDuration: number
    if (state.value.startTime) {
      actualDuration = Math.max(1, now.getTime() - startTime.getTime()) // 至少 1ms
    } else {
      // 如果沒有開始時間，使用計畫時間
      actualDuration = Math.max(1, state.value.duration - state.value.remaining)
    }
    
    return {
      id: generateSimpleUUID(),
      type: state.value.mode!,
      startTime,
      endTime: now,
      duration: actualDuration,
      completed,
      date: normalizeDateString(now),
      metadata: {
        plannedDuration: state.value.duration,
        pauseCount: 0, // MVP 版本暫不追蹤暫停次數
        totalPauseTime: 0 // MVP 版本暫不追蹤暫停時間
      }
    }
  }
  
  /**
   * 初始化 Web Worker
   */
  function initializeWorker(): void {
    try {
      // 創建 Timer Web Worker（實際實作在 T014）
      timerWorker = new Worker('/workers/timer-worker.js') as TimerWorker
      
      // 監聽 Worker 訊息
      timerWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        handleWorkerMessage(event.data)
      }
      
      // 監聽 Worker 錯誤
      timerWorker.onerror = (error) => {
        console.error('Timer Worker 錯誤:', error)
        callbacks.onError?.(new TimerError(
          'Timer Worker 發生錯誤',
          'TIMER_INITIALIZATION_FAILED',
          error
        ))
      }
      
    } catch (error) {
      console.warn('無法載入 Timer Worker，使用 fallback 計時器')
      // MVP 版本的 fallback 實作
      initializeFallbackTimer()
    }
  }
  
  /**
   * Fallback 計時器（當 Web Worker 不可用時）
   */
  function initializeFallbackTimer(): void {
    // 使用 setInterval 作為 fallback
    // 注意：這種方式精度較低，僅用於開發階段
    let intervalId: NodeJS.Timeout | null = null
    
    const startFallbackTimer = () => {
      if (intervalId) clearInterval(intervalId)
      
      intervalId = setInterval(() => {
        if (isRunning.value) {
          const now = Date.now()
          const elapsed = now - (state.value.startTime?.getTime() || now)
          const remaining = Math.max(0, state.value.duration - elapsed)
          const progress = state.value.duration > 0 ? 
            (state.value.duration - remaining) / state.value.duration : 0
          
          updateState({ remaining, progress })
          callbacks.onTick?.(remaining, progress)
          
          // 檢查是否完成
          if (remaining <= 0) {
            completeTimer()
          }
        }
      }, 100) // 每 100ms 更新一次
    }
    
    // 替換 worker 相關方法
    const originalStart = timerAPI.start
    timerAPI.start = async (mode: TimerMode, duration?: number) => {
      const result = await originalStart(mode, duration)
      startFallbackTimer()
      return result
    }
    
    const originalStop = timerAPI.stop
    timerAPI.stop = async (completed: boolean) => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      return await originalStop(completed)
    }
  }
  
  /**
   * 處理 Worker 訊息
   */
  function handleWorkerMessage(message: WorkerMessage): void {
    switch (message.type) {
      case 'TIMER_TICK':
        const tickData = message.data as TimerTickData
        updateState({
          remaining: tickData.remaining,
          progress: tickData.progress
        })
        callbacks.onTick?.(tickData.remaining, tickData.progress)
        break
        
      case 'TIMER_COMPLETE':
        completeTimer()
        break
        
      case 'TIMER_ERROR':
        const errorMessage = message.data as string
        callbacks.onError?.(new TimerError(
          errorMessage,
          'TIMER_INITIALIZATION_FAILED'
        ))
        break
        
      default:
        console.warn('未知的 Worker 訊息類型:', message.type)
    }
  }
  
  /**
   * 完成計時器
   */
  function completeTimer(): void {
    const record = createActivityRecord(true)
    
    updateState({
      status: 'stopped',
      remaining: 0,
      progress: 1,
      startTime: null,
      pauseTime: null
    })
    
    // 停止 Worker
    if (timerWorker) {
      timerWorker.postMessage({
        type: 'TIMER_STOP',
        id: timerId,
        timestamp: Date.now()
      })
    }
    
    callbacks.onComplete?.(record)
  }
  
  /**
   * 發送訊息到 Worker
   */
  function sendWorkerMessage(type: string, data?: unknown): void {
    if (timerWorker) {
      timerWorker.postMessage({
        type,
        id: timerId,
        timestamp: Date.now(),
        data
      })
    }
  }
  
  // =========================================================================
  // TimerAPI 實作
  // =========================================================================
  
  const timerAPI: TimerAPI = {
    /**
     * 啟動計時器
     */
    async start(mode: TimerMode, duration?: number): Promise<TimerState> {
      // 驗證參數
      if (!mode || (mode !== 'water' && mode !== 'pomodoro')) {
        throwTimerError('Invalid timer mode', 'INVALID_TIMER_MODE')
      }
      
      if (isRunning.value) {
        throwTimerError('Timer is already running', 'TIMER_ALREADY_RUNNING')
      }
      
      // 確定計時長度
      let timerDuration: number
      if (duration !== undefined) {
        if (duration <= 0) {
          throwTimerError('Duration must be positive', 'INVALID_DURATION')
        }
        if (duration > TIME_CONSTANTS.MAX_DURATION) {
          throwTimerError('Duration exceeds maximum limit', 'DURATION_EXCEEDS_LIMIT')
        }
        timerDuration = duration
      } else {
        // 使用預設時間
        timerDuration = mode === 'water' ? 
          30 * TIME_CONSTANTS.MINUTE : // 30 分鐘
          25 * TIME_CONSTANTS.MINUTE   // 25 分鐘
      }
      
      const startTime = new Date()
      
      // 更新狀態
      updateState({
        status: 'running',
        mode,
        duration: timerDuration,
        remaining: timerDuration,
        startTime,
        pauseTime: null,
        progress: 0
      })
      
      // 啟動 Worker 計時
      sendWorkerMessage('TIMER_START', {
        mode,
        duration: timerDuration,
        startTime: startTime.getTime()
      } as TimerStartData)
      
      return state.value
    },
    
    /**
     * 暫停計時器
     */
    async pause(): Promise<TimerState> {
      if (!isRunning.value) {
        throwTimerError('Timer is not running', 'TIMER_NOT_RUNNING')
      }
      
      updateState({
        status: 'paused',
        pauseTime: new Date()
      })
      
      sendWorkerMessage('TIMER_PAUSE')
      
      return state.value
    },
    
    /**
     * 繼續計時器
     */
    async resume(): Promise<TimerState> {
      if (!isPaused.value) {
        throwTimerError('Timer is not paused', 'TIMER_NOT_PAUSED')
      }
      
      // 調整開始時間以補償暫停時間
      const pauseTime = state.value.pauseTime?.getTime() || Date.now()
      const pauseDuration = Date.now() - pauseTime
      const newStartTime = new Date((state.value.startTime?.getTime() || 0) + pauseDuration)
      
      updateState({
        status: 'running',
        startTime: newStartTime,
        pauseTime: null
      })
      
      sendWorkerMessage('TIMER_RESUME')
      
      return state.value
    },
    
    /**
     * 停止計時器
     */
    async stop(completed: boolean = false): Promise<ActivityRecord> {
      if (isStopped.value) {
        throwTimerError('Timer is not running', 'TIMER_NOT_RUNNING')
      }
      
      const record = createActivityRecord(completed)
      
      updateState({
        status: 'stopped',
        startTime: null,
        pauseTime: null,
        remaining: completed ? 0 : state.value.remaining,
        progress: completed ? 1 : state.value.progress
      })
      
      sendWorkerMessage('TIMER_STOP')
      
      return record
    },
    
    /**
     * 重置計時器
     */
    async reset(): Promise<TimerState> {
      updateState({
        ...DEFAULT_TIMER_STATE,
        mode: state.value.mode // 保持當前模式
      })
      
      sendWorkerMessage('TIMER_RESET')
      
      return state.value
    },
    
    /**
     * 獲取計時器狀態
     */
    getState(): TimerState {
      return { ...state.value }
    },
    
    /**
     * 校正計時器時間
     */
    async syncTime(): Promise<TimerState> {
      if (!isRunning.value && !isPaused.value) {
        return state.value
      }
      
      // 重新計算剩餘時間
      const now = Date.now()
      const startTime = state.value.startTime?.getTime() || now
      const elapsed = isPaused.value ? 
        (state.value.pauseTime?.getTime() || now) - startTime :
        now - startTime
      
      const remaining = Math.max(0, state.value.duration - elapsed)
      const progress = state.value.duration > 0 ? 
        (state.value.duration - remaining) / state.value.duration : 0
      
      updateState({ remaining, progress })
      
      // 如果時間已到但狀態未更新，觸發完成
      if (remaining <= 0 && isRunning.value) {
        completeTimer()
      }
      
      return state.value
    },
    
    /**
     * 設定計時器回調
     */
    setCallbacks(newCallbacks: TimerCallbacks): void {
      Object.assign(callbacks, newCallbacks)
    }
  }
  
  // =========================================================================
  // 生命週期管理
  // =========================================================================
  
  /**
   * 初始化 composable
   */
  const initializeComposable = async () => {
    // 嘗試從 localStorage 恢復狀態
    try {
      if (typeof localStorage !== 'undefined') {
        const savedState = localStorage.getItem(STORAGE_KEYS.TIMER_STATE)
        if (savedState) {
          const parsedState = JSON.parse(savedState) as TimerState
          const validation = validateTimerState(parsedState)
          
          if (validation.isValid) {
            // 只恢復基本狀態，不恢復運行中的計時器
            if (parsedState.status === 'running') {
              updateState({ ...parsedState, status: 'stopped' })
            } else {
              updateState(parsedState)
            }
          }
        }
      }
    } catch (error) {
      console.warn('計時器狀態恢復失敗:', error)
    }
    
    // 初始化 Worker
    initializeWorker()
  }
  
  // 檢查是否在測試環境中
  const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
  
  // 只在瀏覽器環境中使用生命週期鉤子
  if (typeof window !== 'undefined' && !isTestEnvironment) {
    onMounted(initializeComposable)
    
    /**
     * 組件卸載時清理
     */
    onUnmounted(() => {
      cleanup()
    })
  } else {
    // 在測試環境中立即初始化
    initializeComposable()
  }
  
  /**
   * 清理資源
   */
  function cleanup(): void {
    if (timerWorker) {
      timerWorker.terminate()
      timerWorker = null
    }
    
    // 清理 localStorage 中的狀態
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TIMER_STATE)
      }
    } catch (error) {
      console.warn('清理計時器狀態失敗:', error)
    }
  }
  
  // =========================================================================
  // 回傳 API
  // =========================================================================
  
  return {
    // TimerAPI 方法
    ...timerAPI,
    
    // 響應式狀態
    state: state as Readonly<Ref<TimerState>>,
    
    // 計算屬性
    isRunning,
    isPaused,
    isStopped,
    formattedTime,
    progressPercentage,
    
    // 清理方法
    cleanup
  }
}

/**
 * 全域 Timer 實例 (單例模式)
 * 確保整個應用程式只有一個計時器實例
 */
let globalTimerInstance: UseTimerReturn | null = null

/**
 * 獲取全域計時器實例
 */
export function useGlobalTimer(callbacks?: Partial<TimerCallbacks>): UseTimerReturn {
  if (!globalTimerInstance) {
    globalTimerInstance = useTimer(callbacks)
  } else if (callbacks) {
    // 更新回調
    globalTimerInstance.setCallbacks({ ...callbacks })
  }
  
  return globalTimerInstance
}

/**
 * 重置全域計時器實例
 */
export function resetGlobalTimer(): void {
  if (globalTimerInstance) {
    globalTimerInstance.cleanup()
    globalTimerInstance = null
  }
}