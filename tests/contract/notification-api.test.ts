/**
 * NotificationAPI 契約測試：基本通知功能
 * 
 * 這些測試必須在實作前撰寫並失敗，符合 TDD RED 階段要求
 * MVP 版本只測試核心的通知和替代提醒功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { NotificationAPI, FallbackAlertSettings } from '~/composables/useNotifications'
import { useNotifications } from '~/composables/useNotifications'

describe('NotificationAPI 契約測試 - 核心功能', () => {
  let notificationAPI: NotificationAPI

  beforeEach(() => {
    // 清理儲存資料
    localStorage.clear()
    
    // 重置通知 mock
    global.Notification = vi.fn() as any
    Object.defineProperty(global.Notification, 'permission', {
      value: 'default',
      writable: true
    })
    Object.defineProperty(global.Notification, 'requestPermission', {
      value: vi.fn().mockResolvedValue('granted'),
      writable: true
    })
    
    // 模擬 DOM 環境
    Object.defineProperty(global, 'document', {
      value: {
        title: 'FlowSip - 喝水提醒與番茄鐘',
        body: {
          classList: {
            add: vi.fn(),
            remove: vi.fn()
          }
        }
      },
      writable: true
    })
    
    // 現在使用實際的 useNotifications composable
    const notifications = useNotifications()
    notificationAPI = notifications
  })

  afterEach(() => {
    // 清理通知 API
    if (notificationAPI.cleanup) {
      notificationAPI.cleanup()
    }
    
    // 清理儲存資料
    localStorage.clear()
    
    // 清理全域 mocks
    vi.clearAllMocks()
  })

  describe('checkPermission() 和 requestPermission() 基本操作', () => {
    it('應該能檢查通知權限狀態', async () => {
      // Given - 設定權限狀態
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true
      })

      // When - 檢查權限
      const permission = await notificationAPI.checkPermission()

      // Then - 應返回正確的權限狀態
      expect(permission).toBe('granted')
    })

    it('應該能請求通知權限', async () => {
      // Given - 模擬權限請求
      const mockRequestPermission = vi.fn().mockResolvedValue('granted')
      Object.defineProperty(global.Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      })

      // When - 請求權限
      const permission = await notificationAPI.requestPermission()

      // Then - 應調用權限請求並返回結果
      expect(mockRequestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('應該在不支援通知時返回 denied', async () => {
      // Given - 移除 Notification API 支援
      delete (global as any).Notification

      // When - 檢查權限
      const permission = await notificationAPI.checkPermission()

      // Then - 應返回 denied
      expect(permission).toBe('denied')
    })
  })

  describe('sendNotification() 系統通知功能', () => {
    it('應該能發送基本系統通知', async () => {
      // Given - 設定有效權限
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true
      })
      
      const mockNotification = { close: vi.fn() }
      global.Notification = vi.fn().mockReturnValue(mockNotification) as any

      // When - 發送通知
      const notification = await notificationAPI.sendNotification('測試標題', {
        body: '測試內容'
      })

      // Then - 應建立通知實例
      expect(global.Notification).toHaveBeenCalledWith('測試標題', expect.objectContaining({
        body: '測試內容',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-badge.png',
        tag: 'flowsip-timer',
        renotify: true
      }))
      expect(notification).toBe(mockNotification)
    })

    it('應該在權限被拒絕時返回 null', async () => {
      // Given - 設定拒絕權限
      Object.defineProperty(global.Notification, 'permission', {
        value: 'denied',
        writable: true
      })

      // When - 嘗試發送通知
      const notification = await notificationAPI.sendNotification('測試標題')

      // Then - 應返回 null
      expect(notification).toBe(null)
    })
  })

  describe('sendTimerCompleteNotification() 計時完成通知', () => {
    it('應該能發送喝水完成通知', async () => {
      // Given - 有效權限和活動記錄
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true
      })
      
      const mockNotification = { close: vi.fn() }
      global.Notification = vi.fn().mockReturnValue(mockNotification) as any

      const mockRecord = {
        id: 'test-1',
        type: 'water' as const,
        startTime: new Date('2025-09-10T10:00:00Z'),
        endTime: new Date('2025-09-10T10:30:00Z'),
        duration: 30 * 60 * 1000,
        completed: true,
        date: '2025-09-10'
      }

      // When - 發送計時完成通知
      await notificationAPI.sendTimerCompleteNotification('water', mockRecord)

      // Then - 應發送適當的通知
      expect(global.Notification).toHaveBeenCalledWith('💧 喝水時間！', expect.objectContaining({
        body: expect.stringContaining('30 分鐘'),
        icon: '/icons/water-icon.png'
      }))
    })

    it('應該能發送番茄鐘完成通知', async () => {
      // Given - 有效權限和番茄鐘記錄
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        writable: true
      })
      
      const mockNotification = { close: vi.fn() }
      global.Notification = vi.fn().mockReturnValue(mockNotification) as any

      const mockRecord = {
        id: 'test-2',
        type: 'pomodoro' as const,
        startTime: new Date('2025-09-10T10:00:00Z'),
        endTime: new Date('2025-09-10T10:25:00Z'),
        duration: 25 * 60 * 1000,
        completed: true,
        date: '2025-09-10'
      }

      // When - 發送計時完成通知
      await notificationAPI.sendTimerCompleteNotification('pomodoro', mockRecord)

      // Then - 應發送適當的通知
      expect(global.Notification).toHaveBeenCalledWith('🍅 番茄鐘完成！', expect.objectContaining({
        body: expect.stringContaining('25 分鐘'),
        icon: '/icons/pomodoro-icon.png'
      }))
    })
  })

  describe('音效提醒功能', () => {
    it('應該能播放提醒音效', async () => {
      // Given - 模擬 HTMLAudioElement
      const mockAudio = {
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        currentTime: 0,
        volume: 0,
        loop: false,
        addEventListener: vi.fn(),
        preload: 'auto'
      }
      
      global.Audio = vi.fn().mockImplementation(() => mockAudio) as any

      // When - 播放音效
      await notificationAPI.playAlertSound('chime', 0.8)

      // Then - 應建立和播放音效
      expect(global.Audio).toHaveBeenCalledWith('/sounds/chime.mp3')
      expect(mockAudio.volume).toBe(0.8)
      expect(mockAudio.play).toHaveBeenCalled()
    })

    it('應該能停止播放音效', async () => {
      // Given - 模擬播放中的音效
      const mockAudio = {
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        currentTime: 0,
        volume: 0,
        loop: false,
        addEventListener: vi.fn(),
        preload: 'auto'
      }
      
      global.Audio = vi.fn().mockImplementation(() => mockAudio) as any

      // 先播放音效
      await notificationAPI.playAlertSound('bell')

      // When - 停止音效
      await notificationAPI.stopAlertSound()

      // Then - 應暫停所有音效
      expect(mockAudio.pause).toHaveBeenCalled()
      expect(mockAudio.currentTime).toBe(0)
      expect(mockAudio.loop).toBe(false)
    })
  })

  describe('視覺提醒功能', () => {
    it('應該能顯示視覺提醒', async () => {
      // Given - 模擬 DOM 環境
      const mockClassList = {
        add: vi.fn(),
        remove: vi.fn()
      }
      
      Object.defineProperty(global, 'document', {
        value: {
          title: 'FlowSip',
          body: { classList: mockClassList }
        },
        writable: true
      })

      // When - 顯示視覺提醒
      await notificationAPI.showVisualAlert('測試提醒', 'water')

      // Then - 應添加閃爍樣式
      expect(mockClassList.add).toHaveBeenCalledWith('flash-alert')
    })

    it('應該能隱藏視覺提醒', () => {
      // Given - 模擬顯示中的視覺提醒
      const mockClassList = {
        add: vi.fn(),
        remove: vi.fn()
      }
      
      Object.defineProperty(global, 'document', {
        value: {
          title: 'FlowSip',
          body: { classList: mockClassList }
        },
        writable: true
      })

      // When - 隱藏視覺提醒
      notificationAPI.hideVisualAlert()

      // Then - 應移除閃爍樣式
      expect(mockClassList.remove).toHaveBeenCalledWith('flash-alert')
    })
  })

  describe('分頁標題提醒功能', () => {
    it('應該能啟動分頁標題提醒', () => {
      // Given - 模擬 document
      let documentTitle = 'FlowSip - 原始標題'
      Object.defineProperty(global, 'document', {
        value: {
          get title() { return documentTitle },
          set title(value: string) { documentTitle = value },
          body: { classList: { add: vi.fn(), remove: vi.fn() } }
        },
        writable: true
      })

      // When - 啟動標題提醒
      notificationAPI.startTabTitleAlert('💧 喝水時間！')

      // Then - 應更改標題
      expect(documentTitle).toBe('💧 喝水時間！')
    })

    it('應該能停止分頁標題提醒', () => {
      // Given - 模擬 document 和正在進行的標題提醒
      let documentTitle = '💧 喝水時間！'
      const originalTitle = 'FlowSip - 原始標題'
      
      Object.defineProperty(global, 'document', {
        value: {
          get title() { return documentTitle },
          set title(value: string) { documentTitle = value },
          body: { classList: { add: vi.fn(), remove: vi.fn() } }
        },
        writable: true
      })

      // 先設定原始標題（模擬正常的標題提醒流程）
      documentTitle = originalTitle
      notificationAPI.startTabTitleAlert('💧 喝水時間！')

      // When - 停止標題提醒
      notificationAPI.stopTabTitleAlert()

      // Then - 應恢復原始標題
      expect(documentTitle).toBe(originalTitle)
    })
  })

  describe('替代提醒設定管理', () => {
    it('應該能更新替代提醒設定', async () => {
      // Given - 新的替代提醒設定
      const newSettings: FallbackAlertSettings = {
        visualAlertsEnabled: false,
        soundAlertsEnabled: true,
        tabTitleAlertsEnabled: true,
        flashDuration: 5,
        alertSoundType: 'bell',
        repeatSound: true
      }

      // When - 更新設定
      await notificationAPI.updateFallbackSettings(newSettings)

      // Then - 設定應被保存（檢查 localStorage）
      const stored = localStorage.getItem('flowsip-settings')
      expect(stored).toBeTruthy()
      
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        expect(parsedSettings.fallbackAlerts).toEqual(newSettings)
      }
    })

    it('應該在設定無效時拋出錯誤', async () => {
      // Given - 無效的設定（負數閃爍時間）
      const invalidSettings = {
        visualAlertsEnabled: true,
        soundAlertsEnabled: true,
        tabTitleAlertsEnabled: true,
        flashDuration: -1,
        alertSoundType: 'chime',
        repeatSound: false
      } as FallbackAlertSettings

      // When/Then - 更新無效設定應拋出錯誤
      await expect(notificationAPI.updateFallbackSettings(invalidSettings)).rejects.toThrow()
    })
  })

  describe('dismissAllAlerts() 全部關閉功能', () => {
    it('應該能同時關閉所有類型的提醒', async () => {
      // Given - 模擬各種提醒正在進行
      const mockAudio = {
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        currentTime: 0,
        volume: 0,
        loop: false,
        addEventListener: vi.fn(),
        preload: 'auto'
      }
      
      global.Audio = vi.fn().mockImplementation(() => mockAudio) as any
      
      const mockClassList = {
        add: vi.fn(),
        remove: vi.fn()
      }
      
      let documentTitle = '💧 喝水時間！'
      Object.defineProperty(global, 'document', {
        value: {
          get title() { return documentTitle },
          set title(value: string) { documentTitle = value },
          body: { classList: mockClassList }
        },
        writable: true
      })

      // 啟動各種提醒
      await notificationAPI.playAlertSound('chime')
      await notificationAPI.showVisualAlert('測試提醒', 'water')
      notificationAPI.startTabTitleAlert('測試標題提醒')

      // When - 關閉所有提醒
      notificationAPI.dismissAllAlerts()

      // Then - 所有提醒應被關閉
      expect(mockAudio.pause).toHaveBeenCalled()
      expect(mockClassList.remove).toHaveBeenCalledWith('flash-alert')
      // 標題會被恢復（具體值取決於實作）
    })
  })
})