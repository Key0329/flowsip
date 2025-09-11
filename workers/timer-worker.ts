/**
 * Timer Web Worker 實作
 * 
 * 提供精準的時間戳計時功能，包含：
 * - 高精度計時器 (使用 performance.now())
 * - 背景執行能力
 * - 時間同步和校正
 * - 狀態管理和錯誤處理
 * - 番茄鐘和喝水提醒模式支援
 */

import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
  TimerTickMessage,
  TimerCompleteMessage,
  TimerStateMessage,
  TimerErrorMessage,
  WorkerReadyMessage,
  SyncResponseMessage,
  WorkerTimerState,
  TimerErrorCode,
  WorkerCapabilities,
  StartTimerMessage,
  PauseTimerMessage,
  ResumeTimerMessage,
  StopTimerMessage,
  SyncTimerMessage,
  ConfigMessage
} from '~/specs/001-flowsip-mvp-pwa/contracts/web-worker'

/**
 * Timer Web Worker 主類別
 */
class TimerWorker {
  /** Worker 配置 */
  private config = {
    tickInterval: 1000,        // tick 間隔（毫秒）
    syncThreshold: 2000,       // 同步閾值（毫秒）
    logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error'
  }
  
  /** 計時器狀態 */
  private state: WorkerTimerState = {
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
  
  /** 計時器間隔 ID */
  private tickIntervalId: number | null = null
  
  /** Worker ID */
  private workerId: string
  
  /** 能力描述 */
  private capabilities: WorkerCapabilities
  
  constructor() {
    this.workerId = `timer-worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.capabilities = this.detectCapabilities()
    this.initialize()
  }
  
  /**
   * 初始化 Worker
   */
  private initialize(): void {
    // 監聽主執行緒訊息
    self.addEventListener('message', this.handleMessage.bind(this))
    
    // 發送就緒訊息
    this.postMessage({
      type: 'WORKER_READY',
      payload: {
        workerId: this.workerId,
        capabilities: this.capabilities,
        timestamp: performance.now()
      }
    } as WorkerReadyMessage)
    
    this.log('info', 'Timer Worker 已初始化', { workerId: this.workerId })
  }
  
  /**
   * 處理來自主執行緒的訊息
   */
  private handleMessage(event: MessageEvent<WorkerInboundMessage>): void {
    const message = event.data
    
    try {
      switch (message.type) {
        case 'START_TIMER':
          this.handleStartTimer(message as StartTimerMessage)
          break
        case 'PAUSE_TIMER':
          this.handlePauseTimer(message as PauseTimerMessage)
          break
        case 'RESUME_TIMER':
          this.handleResumeTimer(message as ResumeTimerMessage)
          break
        case 'STOP_TIMER':
          this.handleStopTimer(message as StopTimerMessage)
          break
        case 'SYNC_TIMER':
          this.handleSyncTimer(message as SyncTimerMessage)
          break
        case 'GET_STATE':
          this.handleGetState(message)
          break
        case 'CONFIG':
          this.handleConfig(message as ConfigMessage)
          break
        default:
          this.sendError('WORKER_INTERNAL_ERROR', `未知的訊息類型: ${(message as any).type}`, message.id)
      }
    } catch (error) {
      this.log('error', '處理訊息時發生錯誤', { error, message })
      this.sendError('WORKER_INTERNAL_ERROR', `處理訊息失敗: ${error}`, message.id)
    }
  }
  
  /**
   * 處理開始計時器
   */
  private handleStartTimer(message: StartTimerMessage): void {
    if (this.state.isRunning) {
      this.sendError('ALREADY_RUNNING', '計時器已在運行中', message.id)
      return
    }
    
    if (message.payload.duration <= 0) {
      this.sendError('INVALID_DURATION', '無效的計時時長', message.id)
      return
    }
    
    // 更新狀態
    const now = performance.now()
    
    this.state = {
      ...this.state,
      isRunning: true,
      isPaused: false,
      mode: message.payload.mode,
      phase: message.payload.phase,
      duration: message.payload.duration,
      remaining: message.payload.duration,
      elapsed: 0,
      startTimestamp: now,  // 使用 Worker 內部的 performance.now()
      pauseTimestamp: null,
      resumeTimestamp: null,
      pauseDuration: 0,
      pauseCount: 0,
      lastUpdateAt: now
    }
    
    // 開始計時循環
    this.startTicking()
    
    // 發送狀態更新
    this.sendState(message.id)
    
    this.log('info', '計時器已開始', {
      mode: message.payload.mode,
      duration: message.payload.duration,
      phase: message.payload.phase
    })
  }
  
  /**
   * 處理暫停計時器
   */
  private handlePauseTimer(message: PauseTimerMessage): void {
    if (!this.state.isRunning) {
      this.sendError('NOT_RUNNING', '計時器未在運行', message.id)
      return
    }
    
    if (this.state.isPaused) {
      this.sendError('INVALID_STATE', '計時器已暫停', message.id)
      return
    }
    
    // 停止 tick
    this.stopTicking()
    
    // 更新狀態
    this.state = {
      ...this.state,
      isPaused: true,
      pauseTimestamp: message.payload.pauseTime || performance.now(),
      pauseCount: this.state.pauseCount + 1,
      lastUpdateAt: performance.now()
    }
    
    // 發送狀態更新
    this.sendState(message.id)
    
    this.log('info', '計時器已暫停', { pauseCount: this.state.pauseCount })
  }
  
  /**
   * 處理恢復計時器
   */
  private handleResumeTimer(message: ResumeTimerMessage): void {
    if (!this.state.isRunning) {
      this.sendError('NOT_RUNNING', '計時器未在運行', message.id)
      return
    }
    
    if (!this.state.isPaused) {
      this.sendError('NOT_PAUSED', '計時器未暫停', message.id)
      return
    }
    
    const resumeTime = message.payload.resumeTime || performance.now()
    
    // 計算暫停時長
    if (this.state.pauseTimestamp) {
      const pauseDuration = resumeTime - this.state.pauseTimestamp
      this.state.pauseDuration += pauseDuration
    }
    
    // 更新狀態
    this.state = {
      ...this.state,
      isPaused: false,
      pauseTimestamp: null,
      resumeTimestamp: resumeTime,
      lastUpdateAt: performance.now()
    }
    
    // 重新開始計時
    this.startTicking()
    
    // 發送狀態更新
    this.sendState(message.id)
    
    this.log('info', '計時器已恢復', { totalPauseDuration: this.state.pauseDuration })
  }
  
  /**
   * 處理停止計時器
   */
  private handleStopTimer(message: StopTimerMessage): void {
    if (!this.state.isRunning) {
      this.sendError('NOT_RUNNING', '計時器未在運行', message.id)
      return
    }
    
    // 停止 tick
    this.stopTicking()
    
    // 計算最終統計
    const stopTime = message.payload.stopTime || performance.now()
    const actualDuration = stopTime - (this.state.startTimestamp || 0) - this.state.pauseDuration
    const completed = !message.payload.manual && this.state.remaining <= 0
    
    // 發送完成訊息
    this.postMessage({
      type: 'TIMER_COMPLETE',
      id: message.id,
      payload: {
        mode: this.state.mode,
        phase: this.state.phase,
        duration: this.state.duration,
        actualDuration,
        completedAt: stopTime,
        nextPhase: this.calculateNextPhase()
      }
    } as TimerCompleteMessage)
    
    // 重置狀態
    this.resetState()
    
    this.log('info', '計時器已停止', {
      manual: message.payload.manual,
      completed,
      actualDuration
    })
  }
  
  /**
   * 處理同步計時器
   */
  private handleSyncTimer(message: SyncTimerMessage): void {
    if (!this.state.isRunning) {
      this.sendError('NOT_RUNNING', '計時器未在運行', message.id)
      return
    }
    
    // 計算時間漂移
    const currentTime = message.payload.currentTime
    const expectedTime = this.state.startTimestamp! + this.state.elapsed + this.state.pauseDuration
    const timeDrift = currentTime - expectedTime
    
    // 如果漂移過大，校正狀態
    if (Math.abs(timeDrift) > this.config.syncThreshold) {
      this.correctTimeState(currentTime, timeDrift)
    }
    
    // 發送同步回應
    this.postMessage({
      type: 'SYNC_RESPONSE',
      id: message.id,
      payload: {
        correctedState: { ...this.state },
        timeDrift,
        syncedAt: performance.now()
      }
    } as SyncResponseMessage)
    
    this.log('debug', '時間同步完成', { timeDrift, threshold: this.config.syncThreshold })
  }
  
  /**
   * 處理獲取狀態
   */
  private handleGetState(message: { type: string; id: string }): void {
    this.sendState(message.id)
  }
  
  /**
   * 處理配置更新
   */
  private handleConfig(message: ConfigMessage): void {
    // 更新配置
    if (message.payload.tickInterval) {
      this.config.tickInterval = Math.max(100, message.payload.tickInterval) // 最小 100ms
    }
    
    if (message.payload.syncThreshold) {
      this.config.syncThreshold = message.payload.syncThreshold
    }
    
    if (message.payload.logLevel) {
      this.config.logLevel = message.payload.logLevel
    }
    
    // 如果計時器正在運行，重新啟動 tick
    if (this.state.isRunning && !this.state.isPaused) {
      this.stopTicking()
      this.startTicking()
    }
    
    this.log('info', '配置已更新', this.config)
  }
  
  /**
   * 開始計時循環
   */
  private startTicking(): void {
    if (this.tickIntervalId) {
      this.stopTicking()
    }
    
    this.tickIntervalId = self.setInterval(() => {
      this.tick()
    }, this.config.tickInterval)
  }
  
  /**
   * 停止計時循環
   */
  private stopTicking(): void {
    if (this.tickIntervalId) {
      self.clearInterval(this.tickIntervalId)
      this.tickIntervalId = null
    }
  }
  
  /**
   * 執行一次 tick
   */
  private tick(): void {
    if (!this.state.isRunning || this.state.isPaused) {
      return
    }
    
    const now = performance.now()
    const realStartTime = this.state.startTimestamp || now
    
    // 計算已過時間（扣除暫停時間）
    let elapsed = now - realStartTime - this.state.pauseDuration
    
    // 如果目前在恢復狀態，需要從恢復時間開始計算
    if (this.state.resumeTimestamp) {
      elapsed = now - this.state.resumeTimestamp + this.state.elapsed
    }
    
    // 確保 elapsed 不會是負數
    elapsed = Math.max(0, elapsed)
    
    // 計算剩餘時間 - 確保不會是負數
    const remaining = Math.max(0, this.state.duration - elapsed)
    const progress = this.state.duration > 0 ? Math.min(1, elapsed / this.state.duration) : 0
    
    // 調試日誌
    if (elapsed > 1000) { // 只在有明顯進展時記錄
      this.log('debug', 'Tick計算', {
        now,
        startTime: realStartTime,
        elapsed,
        remaining,
        progress,
        duration: this.state.duration
      })
    }
    
    // 更新狀態
    this.state = {
      ...this.state,
      elapsed,
      remaining,
      lastUpdateAt: now
    }
    
    // 發送 tick 訊息
    this.postMessage({
      type: 'TIMER_TICK',
      id: 'tick',
      payload: {
        remaining,
        elapsed,
        progress: Math.min(1, progress),
        timestamp: now
      }
    } as TimerTickMessage)
    
    // 檢查是否完成
    if (remaining <= 0) {
      this.handleTimerComplete()
    }
  }
  
  /**
   * 處理計時器完成
   */
  private handleTimerComplete(): void {
    this.stopTicking()
    
    const now = performance.now()
    const actualDuration = now - (this.state.startTimestamp || 0) - this.state.pauseDuration
    
    // 發送完成訊息
    this.postMessage({
      type: 'TIMER_COMPLETE',
      id: 'complete',
      payload: {
        mode: this.state.mode,
        phase: this.state.phase,
        duration: this.state.duration,
        actualDuration,
        completedAt: now,
        nextPhase: this.calculateNextPhase()
      }
    } as TimerCompleteMessage)
    
    // 重置狀態
    this.resetState()
    
    this.log('info', '計時器自然完成', { actualDuration })
  }
  
  /**
   * 計算下一階段（番茄鐘專用）
   */
  private calculateNextPhase(): 'break' | 'focus' | null {
    if (this.state.mode !== 'pomodoro') {
      return null
    }
    
    if (this.state.phase === 'focus') {
      return 'break'
    } else if (this.state.phase === 'break') {
      return 'focus'
    }
    
    return null
  }
  
  /**
   * 校正時間狀態
   */
  private correctTimeState(_currentTime: number, timeDrift: number): void {
    // 校正已過時間
    const correctedElapsed = Math.max(0, this.state.elapsed + timeDrift)
    const correctedRemaining = Math.max(0, this.state.duration - correctedElapsed)
    
    this.state = {
      ...this.state,
      elapsed: correctedElapsed,
      remaining: correctedRemaining,
      lastUpdateAt: performance.now()
    }
    
    this.log('warn', '時間狀態已校正', {
      timeDrift,
      correctedElapsed,
      correctedRemaining
    })
  }
  
  /**
   * 重置狀態
   */
  private resetState(): void {
    this.state = {
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
      cycleCount: this.state.mode === 'pomodoro' ? this.state.cycleCount + 1 : 0,
      createdAt: this.state.createdAt,
      lastUpdateAt: performance.now()
    }
  }
  
  /**
   * 檢測 Worker 能力
   */
  private detectCapabilities(): WorkerCapabilities {
    return {
      supportsHighPrecisionTimer: 'performance' in self && 'now' in performance,
      supportsBackgroundExecution: true, // Web Worker 天生支援
      supportsTimeCorrection: true,
      minTickInterval: 100,
      maxTimerDuration: 24 * 60 * 60 * 1000, // 24 小時
      timePrecision: 1, // 毫秒級精度
      userAgent: self.navigator?.userAgent || 'Unknown',
      isServiceWorkerContext: 'ServiceWorkerGlobalScope' in self
    }
  }
  
  /**
   * 發送狀態訊息
   */
  private sendState(messageId: string): void {
    this.postMessage({
      type: 'TIMER_STATE',
      id: messageId,
      payload: { ...this.state }
    } as TimerStateMessage)
  }
  
  /**
   * 發送錯誤訊息
   */
  private sendError(code: TimerErrorCode, message: string, messageId: string): void {
    this.postMessage({
      type: 'TIMER_ERROR',
      id: messageId,
      error: {
        code,
        message,
        timestamp: performance.now()
      }
    } as TimerErrorMessage)
    
    this.log('error', `錯誤: ${code}`, { message, messageId })
  }
  
  /**
   * 發送訊息到主執行緒
   */
  private postMessage(message: WorkerOutboundMessage): void {
    self.postMessage(message)
  }
  
  /**
   * 記錄日誌
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    const configLevel = levels[this.config.logLevel]
    const messageLevel = levels[level]
    
    if (messageLevel >= configLevel) {
      const logMessage = `[TimerWorker:${this.workerId}] ${message}`
      
      switch (level) {
        case 'debug':
          console.debug(logMessage, data)
          break
        case 'info':
          console.info(logMessage, data)
          break
        case 'warn':
          console.warn(logMessage, data)
          break
        case 'error':
          console.error(logMessage, data)
          break
      }
    }
  }
}

// 建立並啟動 Worker 實例
new TimerWorker()