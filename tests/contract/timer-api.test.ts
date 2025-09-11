/**
 * TimerAPI 契約測試：start/stop 方法
 * 
 * 這些測試必須在實作前撰寫並失敗，符合 TDD RED 階段要求
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TimerAPI, TimerState, ActivityRecord } from '~/types/index'
import { TimerError } from '~/types/index'
import { useTimer } from '~/composables/useTimer'

describe('TimerAPI 契約測試 - 核心功能', () => {
  let timerAPI: TimerAPI

  beforeEach(() => {
    // 現在使用實際的 useTimer composable
    const timer = useTimer()
    timerAPI = timer
  })

  describe('start() 方法契約', () => {
    it('應該能啟動喝水計時器模式', async () => {
      // Given - 計時器處於初始狀態
      const initialState = timerAPI.getState()
      expect(initialState.status).toBe('stopped')

      // When - 啟動 30 分鐘喝水計時器
      const newState = await timerAPI.start('water', 30 * 60 * 1000)

      // Then - 計時器狀態應正確更新
      expect(newState.status).toBe('running')
      expect(newState.mode).toBe('water')
      expect(newState.duration).toBe(30 * 60 * 1000)
      expect(newState.remaining).toBe(30 * 60 * 1000)
      expect(newState.startTime).toBeInstanceOf(Date)
    })

    it('應該能啟動番茄鐘計時器模式', async () => {
      // Given - 計時器處於初始狀態
      const initialState = timerAPI.getState()
      expect(initialState.status).toBe('stopped')

      // When - 啟動 25 分鐘番茄鐘計時器
      const newState = await timerAPI.start('pomodoro', 25 * 60 * 1000)

      // Then - 計時器狀態應正確更新
      expect(newState.status).toBe('running')
      expect(newState.mode).toBe('pomodoro')
      expect(newState.duration).toBe(25 * 60 * 1000)
      expect(newState.remaining).toBe(25 * 60 * 1000)
      expect(newState.startTime).toBeInstanceOf(Date)
    })

    it('應該使用預設時間長度當未指定 duration', async () => {
      // When - 啟動喝水計時器但未指定時間
      const newState = await timerAPI.start('water')

      // Then - 應使用預設的 30 分鐘
      expect(newState.duration).toBe(30 * 60 * 1000)
      expect(newState.remaining).toBe(30 * 60 * 1000)
    })

    it('應該在計時器已運行時拋出錯誤', async () => {
      // Given - 計時器已在運行
      await timerAPI.start('water')

      // When/Then - 嘗試再次啟動應拋出錯誤
      await expect(timerAPI.start('pomodoro')).rejects.toThrow('Timer is already running')
    })

    it('應該正確設定開始時間戳', async () => {
      // Given - 記錄測試開始時間
      const beforeStart = new Date()

      // When - 啟動計時器
      const state = await timerAPI.start('water')

      // Then - 開始時間應在合理範圍內
      const afterStart = new Date()
      expect(state.startTime!.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime())
      expect(state.startTime!.getTime()).toBeLessThanOrEqual(afterStart.getTime())
    })
  })

  describe('stop() 方法契約', () => {
    it('應該能正常停止運行中的計時器（完成狀態）', async () => {
      // Given - 啟動一個計時器
      await timerAPI.start('water', 30 * 60 * 1000)

      // When - 正常完成並停止計時器
      const activityRecord = await timerAPI.stop(true)

      // Then - 應返回正確的活動記錄
      expect(activityRecord.type).toBe('water')
      expect(activityRecord.completed).toBe(true)
      expect(activityRecord.startTime).toBeInstanceOf(Date)
      expect(activityRecord.endTime).toBeInstanceOf(Date)
      expect(activityRecord.duration).toBeGreaterThan(0)

      // And - 計時器狀態應重置
      const finalState = timerAPI.getState()
      expect(finalState.status).toBe('stopped')
      expect(finalState.remaining).toBe(0)
    })

    it('應該能停止運行中的計時器（手動停止）', async () => {
      // Given - 啟動一個計時器
      await timerAPI.start('pomodoro', 25 * 60 * 1000)

      // When - 手動停止計時器
      const activityRecord = await timerAPI.stop(false)

      // Then - 應標記為未完成
      expect(activityRecord.type).toBe('pomodoro')
      expect(activityRecord.completed).toBe(false)
      expect(activityRecord.startTime).toBeInstanceOf(Date)
      expect(activityRecord.endTime).toBeInstanceOf(Date)
    })

    it('應該在計時器未運行時拋出錯誤', async () => {
      // Given - 計時器處於停止狀態
      const state = timerAPI.getState()
      expect(state.status).toBe('stopped')

      // When/Then - 嘗試停止應拋出錯誤
      await expect(timerAPI.stop(true)).rejects.toThrow('Timer is not running')
    })

    it('應該正確計算實際執行時間', async () => {
      // Given - 啟動計時器並等待一段時間
      const startTime = Date.now()
      await timerAPI.start('water', 30 * 60 * 1000)
      
      // 模擬運行 100 毫秒
      await new Promise(resolve => setTimeout(resolve, 100))

      // When - 停止計時器
      const activityRecord = await timerAPI.stop(false)
      const endTime = Date.now()

      // Then - 實際時間應在合理範圍內
      expect(activityRecord.duration).toBeGreaterThanOrEqual(100)
      expect(activityRecord.duration).toBeLessThanOrEqual(endTime - startTime + 10) // 允許 10ms 誤差
    })
  })

  describe('getState() 方法契約', () => {
    it('應該返回正確的初始狀態', () => {
      // When - 獲取初始狀態
      const state = timerAPI.getState()

      // Then - 應為停止狀態
      expect(state.status).toBe('stopped')
      expect(state.mode).toBeNull()
      expect(state.duration).toBe(0)
      expect(state.remaining).toBe(0)
      expect(state.startTime).toBeNull()
      expect(state.progress).toBe(0)
    })

    it('應該在計時器運行時返回正確狀態', async () => {
      // Given - 啟動計時器
      await timerAPI.start('water', 30 * 60 * 1000)

      // When - 獲取狀態
      const state = timerAPI.getState()

      // Then - 應為運行狀態
      expect(state.status).toBe('running')
      expect(state.mode).toBe('water')
      expect(state.duration).toBe(30 * 60 * 1000)
      expect(state.remaining).toBeLessThanOrEqual(30 * 60 * 1000)
      expect(state.startTime).toBeInstanceOf(Date)
      expect(state.progress).toBeGreaterThanOrEqual(0)
      expect(state.progress).toBeLessThanOrEqual(1)
    })
  })

  describe('邊界情況和錯誤處理', () => {
    it('應該拒絕無效的計時器模式', async () => {
      // When/Then - 使用無效模式應拋出錯誤
      // @ts-expect-error - 測試錯誤情況
      await expect(timerAPI.start('invalid')).rejects.toThrow('Invalid timer mode')
    })

    it('應該拒絕負數或零的持續時間', async () => {
      // When/Then - 使用無效持續時間應拋出錯誤
      await expect(timerAPI.start('water', -1000)).rejects.toThrow('Duration must be positive')
      await expect(timerAPI.start('water', 0)).rejects.toThrow('Duration must be positive')
    })

    it('應該拒絕過長的持續時間（大於 24 小時）', async () => {
      // When/Then - 使用過長持續時間應拋出錯誤
      const overDay = 25 * 60 * 60 * 1000 // 25 小時
      await expect(timerAPI.start('water', overDay)).rejects.toThrow('Duration exceeds maximum limit')
    })
  })
})