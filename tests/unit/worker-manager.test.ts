/**
 * WorkerManager 單元測試
 * 
 * 測試 Web Worker 管理功能的基本操作
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useWorkerManager } from '~/composables/useWorkerManager'

// 模擬 Worker
class MockWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: ErrorEvent) => void) | null = null
  public onmessageerror: ((event: MessageEvent) => void) | null = null
  
  private listeners = new Map<string, ((event: any) => void)[]>()
  
  constructor(public url: string, public options?: WorkerOptions) {
    // 模擬 Worker 初始化
    setTimeout(() => {
      this.postMessageToMain({
        type: 'WORKER_READY',
        payload: {
          workerId: 'mock-worker-123',
          capabilities: {
            supportsHighPrecisionTimer: true,
            supportsBackgroundExecution: true,
            supportsTimeCorrection: true,
            minTickInterval: 100,
            maxTimerDuration: 24 * 60 * 60 * 1000,
            timePrecision: 1,
            userAgent: 'MockWorker/1.0',
            isServiceWorkerContext: false
          },
          timestamp: performance.now()
        }
      })
    }, 10)
  }
  
  postMessage(message: any): void {
    // 模擬處理訊息的延遲
    setTimeout(() => {
      this.handleMessage(message)
    }, 5)
  }
  
  terminate(): void {
    this.listeners.clear()
  }
  
  addEventListener(type: string, listener: (event: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(listener)
  }
  
  removeEventListener(type: string, listener: (event: any) => void): void {
    const handlers = this.listeners.get(type)
    if (handlers) {
      const index = handlers.indexOf(listener)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
  
  private handleMessage(message: any): void {
    // 模擬 Worker 回應
    switch (message.type) {
      case 'START_TIMER':
        this.postMessageToMain({
          type: 'TIMER_STATE',
          id: message.id,
          payload: {
            isRunning: true,
            isPaused: false,
            mode: message.payload.mode,
            duration: message.payload.duration,
            remaining: message.payload.duration,
            elapsed: 0,
            startTimestamp: message.payload.startTime,
            pauseTimestamp: null,
            resumeTimestamp: null,
            pauseDuration: 0,
            pauseCount: 0,
            cycleCount: 0,
            createdAt: performance.now(),
            lastUpdateAt: performance.now()
          }
        })
        break
      
      case 'GET_STATE':
        this.postMessageToMain({
          type: 'TIMER_STATE',
          id: message.id,
          payload: {
            isRunning: false,
            isPaused: false,
            mode: 'water',
            duration: 0,
            remaining: 0,
            elapsed: 0,
            startTimestamp: null,
            pauseTimestamp: null,
            resumeTimestamp: null,
            pauseDuration: 0,
            pauseCount: 0,
            cycleCount: 0,
            createdAt: performance.now(),
            lastUpdateAt: performance.now()
          }
        })
        break
      
      default:
        this.postMessageToMain({
          type: 'TIMER_ERROR',
          id: message.id,
          error: {
            code: 'WORKER_INTERNAL_ERROR',
            message: `未知的訊息類型: ${message.type}`,
            timestamp: performance.now()
          }
        })
    }
  }
  
  private postMessageToMain(message: any): void {
    const event = { data: message } as MessageEvent
    
    // 觸發事件監聽器
    const handlers = this.listeners.get('message')
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
    
    // 觸發 onmessage
    if (this.onmessage) {
      this.onmessage(event)
    }
  }
}

describe('useWorkerManager', () => {
  beforeEach(() => {
    // 模擬 Worker 建構函數
    global.Worker = MockWorker as any
    
    // 模擬 performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(1000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本功能', () => {
    it('應該能初始化 Worker Manager', async () => {
      const manager = useWorkerManager()
      
      expect(manager.state.isReady).toBe(false)
      expect(manager.state.isAlive).toBe(false)
      expect(manager.state.capabilities).toBe(null)
    })

    it('應該能成功初始化 Worker', async () => {
      const manager = useWorkerManager()
      
      await manager.initialize()
      
      expect(manager.state.isReady).toBe(true)
      expect(manager.state.isAlive).toBe(true)
      expect(manager.state.capabilities).toBeDefined()
      expect(manager.state.capabilities?.supportsHighPrecisionTimer).toBe(true)
    })

    it('應該能發送和接收訊息', async () => {
      const manager = useWorkerManager()
      await manager.initialize()
      
      const response = await manager.sendMessage({
        type: 'GET_STATE',
        id: 'test-1'
      }, 'TIMER_STATE')
      
      expect(response.type).toBe('TIMER_STATE')
      expect(response.id).toBe('test-1')
      expect(response.payload).toBeDefined()
    })

    it('應該能檢查 Worker 存活狀態', async () => {
      const manager = useWorkerManager()
      
      expect(manager.isAlive()).toBe(false)
      
      await manager.initialize()
      
      expect(manager.isAlive()).toBe(true)
    })

    it('應該能終止 Worker', async () => {
      const manager = useWorkerManager()
      await manager.initialize()
      
      expect(manager.isAlive()).toBe(true)
      
      await manager.terminate()
      
      expect(manager.isAlive()).toBe(false)
      expect(manager.state.isReady).toBe(false)
    })
  })

  describe('訊息處理', () => {
    it.skip('應該能註冊和移除訊息監聽器', async () => {
      const manager = useWorkerManager()
      await manager.initialize()
      
      const messages: any[] = []
      const unsubscribe = manager.onMessage((message) => {
        messages.push(message)
      })
      
      await manager.sendMessage({
        type: 'GET_STATE',
        id: 'test-2'
      })
      
      // 等待訊息處理
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(messages.length).toBeGreaterThan(0)
      
      unsubscribe()
      
      await manager.sendMessage({
        type: 'GET_STATE',
        id: 'test-3'
      })
      
      // 訊息應該不再增加
      const previousLength = messages.length
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(messages.length).toBe(previousLength)
    })

    it('應該能處理 Worker 錯誤', async () => {
      const manager = useWorkerManager()
      await manager.initialize()
      
      const errors: any[] = []
      manager.onError((error) => {
        errors.push(error)
      })
      
      // 發送無效訊息觸發錯誤
      try {
        await manager.sendMessage({
          type: 'INVALID_MESSAGE' as any,
          id: 'test-error'
        })
      } catch {
        // 預期會拋出錯誤
      }
      
      // 等待錯誤處理
      await new Promise(resolve => setTimeout(resolve, 50))
    })
  })

  describe('計時器操作', () => {
    it('應該能啟動計時器', async () => {
      const manager = useWorkerManager()
      await manager.initialize()
      
      const response = await manager.sendMessage({
        type: 'START_TIMER',
        id: 'start-test',
        payload: {
          mode: 'water',
          duration: 30 * 60 * 1000, // 30 分鐘
          startTime: performance.now()
        }
      }, 'TIMER_STATE')
      
      expect(response.type).toBe('TIMER_STATE')
      expect(response.payload.isRunning).toBe(true)
      expect(response.payload.mode).toBe('water')
      expect(response.payload.duration).toBe(30 * 60 * 1000)
    })

    it('應該能處理訊息超時', async () => {
      const manager = useWorkerManager()
      await manager.initialize()
      
      // 發送不會回應的訊息，設定短超時
      const promise = manager.sendMessage({
        type: 'UNKNOWN_MESSAGE' as any,
        id: 'timeout-test'
      }, 'NEVER_RESPONSE' as any, 100)
      
      await expect(promise).rejects.toThrow('訊息回應超時')
    })
  })

  describe('配置管理', () => {
    it('應該能使用自訂配置', () => {
      const customConfig = {
        workerUrl: '/custom-worker.js',
        terminateTimeout: 3000,
        restartOnError: false,
        maxRestartAttempts: 1
      }
      
      const manager = useWorkerManager(customConfig)
      
      // 驗證配置已應用（需要透過行為來驗證，因為配置是私有的）
      expect(manager).toBeDefined()
    })
  })
})