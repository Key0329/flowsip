/**
 * useWorkerManager composable
 * 
 * 管理 Timer Web Worker 的生命週期和通信，包含：
 * - Worker 初始化和終止
 * - 訊息發送和接收
 * - 錯誤處理和重啟機制
 * - 狀態同步
 */

import { ref, reactive, computed, onUnmounted, type Ref } from 'vue'
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
  WorkerManager,
  WorkerConfig,
  WorkerCapabilities,
  TimerWorkerError,
  WorkerTimerState,
  TimerErrorCode
} from '~/specs/001-flowsip-mvp-pwa/contracts/web-worker'

/**
 * Worker 管理器狀態
 */
export interface WorkerManagerState {
  /** Worker 是否就緒 */
  isReady: boolean
  
  /** Worker 是否存活 */
  isAlive: boolean
  
  /** Worker 能力描述 */
  capabilities: WorkerCapabilities | null
  
  /** 連線錯誤 */
  connectionError: TimerWorkerError | null
  
  /** 重啟次數 */
  restartCount: number
  
  /** 最後活動時間 */
  lastActivity: Date | null
}

/**
 * useWorkerManager 返回值類型
 */
export interface UseWorkerManagerReturn extends WorkerManager {
  /** Worker 狀態 */
  state: WorkerManagerState
  
  /** 是否就緒 */
  isReady: Ref<boolean>
  
  /** 能力描述 */
  capabilities: Ref<WorkerCapabilities | null>
  
  /** 發送訊息（帶 Promise 支援） */
  sendMessage<T extends WorkerOutboundMessage>(
    message: WorkerInboundMessage,
    expectedResponseType?: T['type'],
    timeout?: number
  ): Promise<T>
}

/**
 * 預設 Worker 配置
 */
const DEFAULT_CONFIG: WorkerConfig = {
  workerUrl: '/workers/timer-worker.ts',
  terminateTimeout: 5000,
  restartOnError: true,
  maxRestartAttempts: 3
}

/**
 * useWorkerManager composable
 */
export function useWorkerManager(config: Partial<WorkerConfig> = {}): UseWorkerManagerReturn {
  const workerConfig = { ...DEFAULT_CONFIG, ...config }
  
  // 狀態管理
  const state = reactive<WorkerManagerState>({
    isReady: false,
    isAlive: false,
    capabilities: null,
    connectionError: null,
    restartCount: 0,
    lastActivity: null
  })
  
  // 計算屬性
  const isReady = computed(() => state.isReady)
  const capabilities = computed(() => state.capabilities)
  
  // Worker 實例
  let worker: Worker | null = null
  
  // 訊息處理器
  const messageHandlers = new Map<string, (message: WorkerOutboundMessage) => void>()
  const errorHandlers = new Set<(error: TimerWorkerError) => void>()
  
  // 待回應的訊息
  const pendingMessages = new Map<string, {
    resolve: (message: WorkerOutboundMessage) => void
    reject: (error: Error) => void
    timeout: number
    expectedType?: string
  }>()
  
  /**
   * 初始化 Worker
   */
  async function initialize(): Promise<void> {
    if (worker) {
      await terminate()
    }
    
    try {
      // 建立 Worker 實例
      worker = new Worker(workerConfig.workerUrl, {
        type: 'module' // 支援 ES 模組
      })
      
      // 設定事件監聽器
      worker.addEventListener('message', handleWorkerMessage)
      worker.addEventListener('error', handleWorkerError)
      worker.addEventListener('messageerror', handleWorkerMessageError)
      
      // 更新狀態
      state.isAlive = true
      state.connectionError = null
      state.lastActivity = new Date()
      
      // 等待 Worker 就緒
      await waitForWorkerReady()
      
    } catch (error) {
      const workerError = new TimerWorkerError(
        'WORKER_INTERNAL_ERROR',
        `Worker 初始化失敗: ${error}`,
        { originalError: error }
      )
      
      state.connectionError = workerError
      state.isAlive = false
      
      // 如果允許重啟，嘗試重啟
      if (workerConfig.restartOnError && state.restartCount < workerConfig.maxRestartAttempts) {
        await restart()
      } else {
        throw workerError
      }
    }
  }
  
  /**
   * 等待 Worker 就緒
   */
  async function waitForWorkerReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new TimerWorkerError(
          'WORKER_INTERNAL_ERROR',
          'Worker 就緒超時',
          { timeout: 5000 }
        ))
      }, 5000)
      
      const readyHandler = (message: WorkerOutboundMessage) => {
        if (message.type === 'WORKER_READY') {
          clearTimeout(timeout)
          
          // 更新狀態
          state.isReady = true
          state.capabilities = message.payload.capabilities
          state.lastActivity = new Date()
          
          // 移除臨時處理器
          messageHandlers.delete('ready-waiter')
          
          resolve()
        }
      }
      
      messageHandlers.set('ready-waiter', readyHandler)
    })
  }
  
  /**
   * 處理 Worker 訊息
   */
  function handleWorkerMessage(event: MessageEvent<WorkerOutboundMessage>): void {
    const message = event.data
    state.lastActivity = new Date()
    
    // 處理待回應的訊息
    if (pendingMessages.has(message.id)) {
      const pending = pendingMessages.get(message.id)!
      
      // 檢查是否為期望的回應類型
      if (!pending.expectedType || message.type === pending.expectedType) {
        clearTimeout(pending.timeout)
        pendingMessages.delete(message.id)
        pending.resolve(message)
        return
      }
    }
    
    // 呼叫註冊的處理器
    messageHandlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        console.error('訊息處理器錯誤:', error)
      }
    })
  }
  
  /**
   * 處理 Worker 錯誤
   */
  function handleWorkerError(event: ErrorEvent): void {
    const error = new TimerWorkerError(
      'WORKER_INTERNAL_ERROR',
      `Worker 執行錯誤: ${event.message}`,
      { 
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        originalError: event.error
      }
    )
    
    state.connectionError = error
    state.isAlive = false
    state.isReady = false
    
    // 通知錯誤處理器
    errorHandlers.forEach(handler => {
      try {
        handler(error)
      } catch (handlerError) {
        console.error('錯誤處理器錯誤:', handlerError)
      }
    })
    
    // 自動重啟
    if (workerConfig.restartOnError && state.restartCount < workerConfig.maxRestartAttempts) {
      restart().catch(restartError => {
        console.error('自動重啟失敗:', restartError)
      })
    }
  }
  
  /**
   * 處理 Worker 訊息錯誤
   */
  function handleWorkerMessageError(event: MessageEvent): void {
    const error = new TimerWorkerError(
      'WORKER_INTERNAL_ERROR',
      '訊息序列化錯誤',
      { data: event.data }
    )
    
    state.connectionError = error
    
    errorHandlers.forEach(handler => {
      try {
        handler(error)
      } catch (handlerError) {
        console.error('錯誤處理器錯誤:', handlerError)
      }
    })
  }
  
  /**
   * 發送訊息給 Worker
   */
  function postMessage(message: WorkerInboundMessage): void {
    if (!worker || !state.isAlive) {
      throw new TimerWorkerError(
        'WORKER_INTERNAL_ERROR',
        'Worker 未就緒或已終止',
        { state: { ...state } }
      )
    }
    
    worker.postMessage(message)
    state.lastActivity = new Date()
  }
  
  /**
   * 發送訊息並等待回應
   */
  async function sendMessage<T extends WorkerOutboundMessage>(
    message: WorkerInboundMessage,
    expectedResponseType?: T['type'],
    timeout: number = 10000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pendingMessages.delete(message.id)
        reject(new TimerWorkerError(
          'WORKER_INTERNAL_ERROR',
          '訊息回應超時',
          { messageId: message.id, timeout }
        ))
      }, timeout)
      
      pendingMessages.set(message.id, {
        resolve: resolve as (message: WorkerOutboundMessage) => void,
        reject,
        timeout: timeoutId,
        expectedType: expectedResponseType
      })
      
      try {
        postMessage(message)
      } catch (error) {
        clearTimeout(timeoutId)
        pendingMessages.delete(message.id)
        reject(error)
      }
    })
  }
  
  /**
   * 監聽 Worker 訊息
   */
  function onMessage(callback: (message: WorkerOutboundMessage) => void): () => void {
    const id = `handler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    messageHandlers.set(id, callback)
    
    return () => {
      messageHandlers.delete(id)
    }
  }
  
  /**
   * 監聽 Worker 錯誤
   */
  function onError(callback: (error: TimerWorkerError) => void): () => void {
    errorHandlers.add(callback)
    
    return () => {
      errorHandlers.delete(callback)
    }
  }
  
  /**
   * 終止 Worker
   */
  async function terminate(): Promise<void> {
    if (!worker) {
      return
    }
    
    // 清理待回應的訊息
    pendingMessages.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(new TimerWorkerError(
        'WORKER_INTERNAL_ERROR',
        'Worker 已終止',
        {}
      ))
    })
    pendingMessages.clear()
    
    // 終止 Worker
    worker.terminate()
    worker = null
    
    // 更新狀態
    state.isAlive = false
    state.isReady = false
    state.capabilities = null
    state.lastActivity = new Date()
  }
  
  /**
   * 檢查 Worker 狀態
   */
  function isAlive(): boolean {
    return state.isAlive && worker !== null
  }
  
  /**
   * 重啟 Worker
   */
  async function restart(): Promise<void> {
    state.restartCount++
    
    try {
      await terminate()
      await initialize()
    } catch (error) {
      throw new TimerWorkerError(
        'WORKER_INTERNAL_ERROR',
        `Worker 重啟失敗 (嘗試 ${state.restartCount}/${workerConfig.maxRestartAttempts})`,
        { originalError: error, restartCount: state.restartCount }
      )
    }
  }
  
  // 清理函數（只在 Vue 環境中使用）
  if (typeof window !== 'undefined' && 'Vue' in globalThis) {
    try {
      onUnmounted(() => {
        terminate()
      })
    } catch {
      // 在測試環境或非 Vue 環境中忽略
    }
  }
  
  return {
    state,
    isReady,
    capabilities,
    initialize,
    postMessage,
    sendMessage,
    onMessage,
    onError,
    terminate,
    isAlive,
    restart
  }
}

/**
 * TimerWorkerError 類別實作
 */
class TimerWorkerError extends Error {
  constructor(
    public code: TimerErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'TimerWorkerError'
  }
}