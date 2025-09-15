/**
 * StorageAPI 契約測試：save/load 基本操作
 * 
 * 這些測試必須在實作前撰寫並失敗，符合 TDD RED 階段要求
 * MVP 版本只測試核心的儲存和載入功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { StorageAPI, UserSettings, ActivityRecord } from '~/types/index'
import { StorageError } from '~/types/index'
import { useStorage } from '~/composables/useStorage'

describe('StorageAPI 契約測試 - 核心功能', () => {
  let storageAPI: StorageAPI

  beforeEach(() => {
    // 清理儲存資料
    localStorage.clear()
    
    // 現在使用實際的 useStorage composable
    const storage = useStorage()
    storageAPI = storage
  })

  afterEach(() => {
    // 清理儲存資料
    localStorage.clear()
    
    // 清理 storage 實例快取
    if ('cleanup' in storageAPI) {
      storageAPI.cleanup()
    }
  })

  describe('saveSettings() 和 loadSettings() 基本操作', () => {
    it('應該能儲存和載入用戶設定', async () => {
      // Given - 準備測試設定資料
      const testSettings: UserSettings = {
        waterInterval: 30 * 60 * 1000, // 30 分鐘
        pomodoroInterval: 25 * 60 * 1000, // 25 分鐘
        breakInterval: 5 * 60 * 1000, // 5 分鐘
        soundEnabled: true,
        volume: 0.5,
        theme: 'light',
        notificationsEnabled: true
      }

      // When - 儲存設定然後載入
      await storageAPI.saveSettings(testSettings)
      const loadedSettings = await storageAPI.loadSettings()

      // Then - 載入的設定應與儲存的一致
      expect(loadedSettings).toEqual(testSettings)
      expect(loadedSettings.waterInterval).toBe(30 * 60 * 1000)
      expect(loadedSettings.pomodoroInterval).toBe(25 * 60 * 1000)
      expect(loadedSettings.soundEnabled).toBe(true)
      expect(loadedSettings.volume).toBe(0.5)
      expect(loadedSettings.theme).toBe('light')
    })

    it('應該在設定不存在時返回預設值', async () => {
      // When - 載入不存在的設定
      const settings = await storageAPI.loadSettings()

      // Then - 應返回合理的預設值
      expect(settings).toBeDefined()
      expect(settings.waterInterval).toBe(30 * 60 * 1000) // 預設 30 分鐘
      expect(settings.pomodoroInterval).toBe(25 * 60 * 1000) // 預設 25 分鐘
      expect(settings.breakInterval).toBe(5 * 60 * 1000) // 預設 5 分鐘
      expect(settings.soundEnabled).toBe(true) // 預設啟用音效
      expect(settings.volume).toBe(0.5) // 預設音量
      expect(settings.theme).toBe('light') // 預設淺色主題
      expect(settings.notificationsEnabled).toBe(true) // 預設啟用通知
    })

    it('應該能更新現有設定', async () => {
      // Given - 先儲存初始設定
      const initialSettings: UserSettings = {
        waterInterval: 30 * 60 * 1000,
        pomodoroInterval: 25 * 60 * 1000,
        breakInterval: 5 * 60 * 1000,
        soundEnabled: true,
        volume: 0.5,
        theme: 'light',
        notificationsEnabled: true
      }
      await storageAPI.saveSettings(initialSettings)

      // When - 更新部分設定
      const updatedSettings: UserSettings = {
        ...initialSettings,
        volume: 0.5,
        theme: 'dark',
        soundEnabled: false
      }
      await storageAPI.saveSettings(updatedSettings)

      // Then - 載入的設定應反映更新
      const loadedSettings = await storageAPI.loadSettings()
      expect(loadedSettings.volume).toBe(0.5)
      expect(loadedSettings.theme).toBe('dark')
      expect(loadedSettings.soundEnabled).toBe(false)
      expect(loadedSettings.waterInterval).toBe(30 * 60 * 1000) // 未改變的設定保持不變
    })
  })

  describe('saveActivity() 和 getActivitiesByDate() 基本操作', () => {
    it('應該能儲存和載入活動記錄', async () => {
      // Given - 準備測試活動記錄
      const testActivity: ActivityRecord = {
        id: 'test-activity-1',
        type: 'water',
        startTime: new Date('2025-09-10T10:00:00Z'),
        endTime: new Date('2025-09-10T10:30:00Z'),
        duration: 30 * 60 * 1000,
        completed: true,
        date: '2025-09-10'
      }

      // When - 儲存活動記錄然後載入
      await storageAPI.saveActivity(testActivity)
      const activities = await storageAPI.getActivitiesByDate('2025-09-10')

      // Then - 應能找到儲存的活動記錄
      expect(activities).toHaveLength(1)
      expect(activities[0]).toEqual(testActivity)
      expect(activities[0].id).toBe('test-activity-1')
      expect(activities[0].type).toBe('water')
      expect(activities[0].completed).toBe(true)
      expect(activities[0].duration).toBe(30 * 60 * 1000)
    })

    it('應該能儲存多個活動記錄到同一日期', async () => {
      // Given - 準備多個測試活動記錄
      const activity1: ActivityRecord = {
        id: 'activity-1',
        type: 'water',
        startTime: new Date('2025-09-10T09:00:00Z'),
        endTime: new Date('2025-09-10T09:30:00Z'),
        duration: 30 * 60 * 1000,
        completed: true,
        date: '2025-09-10'
      }

      const activity2: ActivityRecord = {
        id: 'activity-2',
        type: 'pomodoro',
        startTime: new Date('2025-09-10T10:00:00Z'),
        endTime: new Date('2025-09-10T10:25:00Z'),
        duration: 25 * 60 * 1000,
        completed: true,
        date: '2025-09-10'
      }

      // When - 儲存兩個活動記錄
      await storageAPI.saveActivity(activity1)
      await storageAPI.saveActivity(activity2)
      const activities = await storageAPI.getActivitiesByDate('2025-09-10')

      // Then - 應能找到兩個活動記錄
      expect(activities).toHaveLength(2)
      
      // 按時間排序 (確保 Date 物件正確)
      const sortedActivities = activities.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      
      expect(sortedActivities[0].id).toBe('activity-1')
      expect(sortedActivities[0].type).toBe('water')
      expect(sortedActivities[1].id).toBe('activity-2')
      expect(sortedActivities[1].type).toBe('pomodoro')
    })

    it('應該在查詢不存在的日期時返回空陣列', async () => {
      // When - 查詢沒有活動記錄的日期
      const activities = await storageAPI.getActivitiesByDate('2025-12-31')

      // Then - 應返回空陣列
      expect(activities).toEqual([])
      expect(activities).toHaveLength(0)
    })

    it('應該只返回指定日期的活動記錄', async () => {
      // Given - 準備不同日期的活動記錄
      const activity1: ActivityRecord = {
        id: 'activity-day1',
        type: 'water',
        startTime: new Date('2025-09-10T10:00:00Z'),
        endTime: new Date('2025-09-10T10:30:00Z'),
        duration: 30 * 60 * 1000,
        completed: true,
        date: '2025-09-10'
      }

      const activity2: ActivityRecord = {
        id: 'activity-day2',
        type: 'pomodoro',
        startTime: new Date('2025-09-11T10:00:00Z'),
        endTime: new Date('2025-09-11T10:25:00Z'),
        duration: 25 * 60 * 1000,
        completed: true,
        date: '2025-09-11'
      }

      // When - 儲存兩天的活動記錄
      await storageAPI.saveActivity(activity1)
      await storageAPI.saveActivity(activity2)

      // Then - 查詢特定日期應只返回該日的記錄
      const day1Activities = await storageAPI.getActivitiesByDate('2025-09-10')
      const day2Activities = await storageAPI.getActivitiesByDate('2025-09-11')

      expect(day1Activities).toHaveLength(1)
      expect(day1Activities[0].id).toBe('activity-day1')
      
      expect(day2Activities).toHaveLength(1)
      expect(day2Activities[0].id).toBe('activity-day2')
    })
  })

  describe('錯誤處理和邊界情況', () => {
    it('應該拒絕無效的活動記錄', async () => {
      // Given - 無效的活動記錄（缺少必填欄位）
      const invalidActivity = {
        // 缺少 id, type, startTime 等必填欄位
        endTime: new Date(),
        duration: 1000,
        completed: true,
        date: '2025-09-10'
      }

      // When/Then - 儲存無效記錄應拋出錯誤
      // @ts-expect-error - 測試錯誤情況
      await expect(storageAPI.saveActivity(invalidActivity)).rejects.toThrow()
    })

    it('應該拒絕無效的日期格式', async () => {
      // When/Then - 使用無效日期格式應拋出錯誤
      await expect(storageAPI.getActivitiesByDate('invalid-date')).rejects.toThrow('Invalid date format')
      await expect(storageAPI.getActivitiesByDate('2025/09/10')).rejects.toThrow('Invalid date format')
      await expect(storageAPI.getActivitiesByDate('09-10-2025')).rejects.toThrow('Invalid date format')
    })

    it('應該拒絕無效的用戶設定', async () => {
      // Given - 無效的設定（負數間隔）
      const invalidSettings = {
        waterInterval: -1000,
        pomodoroInterval: 25 * 60 * 1000,
        breakInterval: 5 * 60 * 1000,
        soundEnabled: true,
        volume: 0.5,
        theme: 'light',
        notificationsEnabled: true
      }

      // When/Then - 儲存無效設定應拋出錯誤
      // @ts-expect-error - 測試錯誤情況
      await expect(storageAPI.saveSettings(invalidSettings)).rejects.toThrow('Invalid settings')
    })

    it('應該正確處理儲存空間不足的情況', async () => {
      // 這個測試在真實環境中難以模擬，但契約應定義行為
      // Given - 模擬儲存空間不足
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      const now = new Date()
      const testActivity: ActivityRecord = {
        id: 'test-storage-full',
        type: 'water',
        startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 分鐘前開始
        endTime: now, // 現在結束
        duration: 30 * 60 * 1000,
        completed: true,
        date: '2025-09-10'
      }

      // When/Then - 應拋出適當的錯誤
      await expect(storageAPI.saveActivity(testActivity)).rejects.toThrow('儲存操作失敗')

      // 清理
      localStorage.setItem = originalSetItem
    })
  })
})