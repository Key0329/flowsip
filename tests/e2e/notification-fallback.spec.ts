/**
 * E2E 測試：通知拒絕後的替代提醒
 * 
 * 降級機制驗證：當用戶拒絕系統通知時，應提供替代提醒方式
 * 這些測試必須在實作前撰寫並失敗，符合 TDD RED 階段要求
 */

import { test, expect, type Page } from '@playwright/test'

test.describe('通知拒絕後的替代提醒機制測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 前往 FlowSip 主頁面
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // 確保應用程式已載入
    await expect(page.locator('[data-testid="app-title"]')).toHaveText('FlowSip')
  })

  test('當用戶拒絕通知權限時，應顯示替代提醒選項', async ({ page, context }) => {
    // Given - 模擬用戶拒絕通知權限
    await context.grantPermissions([], { origin: page.url() })
    
    // 覆蓋 Notification API 返回 denied 狀態
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false
      })
      
      window.Notification.requestPermission = async () => 'denied'
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // When - 嘗試啟動計時器
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.05') // 3 秒測試
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 應顯示替代提醒設定
    await expect(page.locator('[data-testid="notification-denied-alert"]')).toBeVisible()
    await expect(page.locator('[data-testid="notification-denied-alert"]')).toContainText('無法發送系統通知')
    
    // 應提供替代選項
    await expect(page.locator('[data-testid="fallback-options"]')).toBeVisible()
    await expect(page.locator('[data-testid="visual-alerts-option"]')).toBeVisible()
    await expect(page.locator('[data-testid="sound-alerts-option"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-title-option"]')).toBeVisible()
  })

  test('視覺替代提醒應正常工作', async ({ page, context }) => {
    // Given - 拒絕通知權限並啟用視覺提醒
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false
      })
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // 設定視覺替代提醒
    await page.locator('[data-testid="settings-button"]').click()
    await page.locator('[data-testid="visual-alerts-enabled"]').check()
    await page.locator('[data-testid="flash-screen-enabled"]').check()
    await page.locator('[data-testid="settings-save"]').click()
    
    // When - 啟動短時間計時器
    await page.locator('[data-testid="mode-pomodoro"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.05')
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 等待計時器完成並檢查視覺提醒
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已完成', { timeout: 10000 })
    
    // 檢查視覺提醒效果
    await expect(page.locator('[data-testid="visual-alert-overlay"]')).toBeVisible()
    await expect(page.locator('[data-testid="completion-message"]')).toHaveText('番茄鐘完成！')
    await expect(page.locator('[data-testid="completion-message"]')).toHaveClass(/.*pulsing.*/)
    
    // 檢查螢幕閃爍效果
    const bodyClass = await page.locator('body').getAttribute('class')
    expect(bodyClass).toContain('flash-alert')
    
    // 確認提醒可以關閉
    await page.locator('[data-testid="dismiss-alert"]').click()
    await expect(page.locator('[data-testid="visual-alert-overlay"]')).not.toBeVisible()
  })

  test('音效替代提醒應正常工作', async ({ page }) => {
    // Given - 拒絕通知權限並啟用音效提醒
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false
      })
      
      // 模擬音效播放
      window.testAudioPlayed = false
      const originalPlay = HTMLAudioElement.prototype.play
      HTMLAudioElement.prototype.play = function() {
        window.testAudioPlayed = true
        return Promise.resolve()
      }
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // 設定音效替代提醒
    await page.locator('[data-testid="settings-button"]').click()
    await page.locator('[data-testid="sound-alerts-enabled"]').check()
    await page.locator('[data-testid="alert-sound-select"]').selectOption('chime')
    await page.locator('[data-testid="alert-volume"]').fill('0.8')
    await page.locator('[data-testid="repeat-sound-enabled"]').check()
    await page.locator('[data-testid="settings-save"]').click()
    
    // When - 啟動計時器
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.05')
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 等待完成並檢查音效播放
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已完成', { timeout: 10000 })
    
    // 檢查音效是否播放
    const audioPlayed = await page.evaluate(() => window.testAudioPlayed)
    expect(audioPlayed).toBe(true)
    
    // 檢查音效控制項顯示
    await expect(page.locator('[data-testid="sound-playing-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="stop-sound-button"]')).toBeVisible()
    
    // 測試停止音效功能
    await page.locator('[data-testid="stop-sound-button"]').click()
    await expect(page.locator('[data-testid="sound-playing-indicator"]')).not.toBeVisible()
  })

  test('分頁標題提醒應正常工作', async ({ page }) => {
    // Given - 拒絕通知權限並啟用分頁標題提醒
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false
      })
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // 設定分頁標題提醒
    await page.locator('[data-testid="settings-button"]').click()
    await page.locator('[data-testid="tab-title-alerts-enabled"]').check()
    await page.locator('[data-testid="settings-save"]').click()
    
    // 記錄原始標題
    const originalTitle = await page.title()
    expect(originalTitle).toBe('FlowSip - 喝水提醒與番茄鐘')
    
    // When - 啟動計時器
    await page.locator('[data-testid="mode-pomodoro"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.05')
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 等待完成並檢查標題變化
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已完成', { timeout: 10000 })
    
    // 檢查標題是否更改為提醒訊息
    await expect(page).toHaveTitle('🍅 番茄鐘完成！- FlowSip')
    
    // 檢查標題閃爍效果
    await page.waitForTimeout(1000)
    await expect(page).toHaveTitle('⏰ 時間到了！- FlowSip')
    
    await page.waitForTimeout(1000)
    await expect(page).toHaveTitle('🍅 番茄鐘完成！- FlowSip')
    
    // 當用戶返回分頁時，標題應恢復正常
    await page.locator('[data-testid="dismiss-alert"]').click()
    await expect(page).toHaveTitle(originalTitle)
  })

  test('多重替代提醒組合應同時工作', async ({ page }) => {
    // Given - 拒絕通知權限並啟用多重替代提醒
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false
      })
      
      window.testAudioPlayed = false
      HTMLAudioElement.prototype.play = function() {
        window.testAudioPlayed = true
        return Promise.resolve()
      }
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // 啟用所有替代提醒方式
    await page.locator('[data-testid="settings-button"]').click()
    await page.locator('[data-testid="visual-alerts-enabled"]').check()
    await page.locator('[data-testid="sound-alerts-enabled"]').check()
    await page.locator('[data-testid="tab-title-alerts-enabled"]').check()
    await page.locator('[data-testid="settings-save"]').click()
    
    // When - 啟動計時器
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.05')
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 等待完成並檢查所有提醒方式
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已完成', { timeout: 10000 })
    
    // 檢查視覺提醒
    await expect(page.locator('[data-testid="visual-alert-overlay"]')).toBeVisible()
    
    // 檢查音效提醒
    const audioPlayed = await page.evaluate(() => window.testAudioPlayed)
    expect(audioPlayed).toBe(true)
    
    // 檢查分頁標題提醒
    await expect(page).toHaveTitle('💧 喝水時間！- FlowSip')
    
    // 所有提醒應可統一關閉
    await page.locator('[data-testid="dismiss-all-alerts"]').click()
    await expect(page.locator('[data-testid="visual-alert-overlay"]')).not.toBeVisible()
    await expect(page).toHaveTitle('FlowSip - 喝水提醒與番茄鐘')
  })

  test('應提供重新申請通知權限的選項', async ({ page, context }) => {
    // Given - 模擬權限被拒絕
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false
      })
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // When - 啟動計時器觸發權限檢查
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 應顯示重新申請權限的選項
    await expect(page.locator('[data-testid="notification-denied-help"]')).toBeVisible()
    await expect(page.locator('[data-testid="enable-notifications-guide"]')).toBeVisible()
    await expect(page.locator('[data-testid="browser-settings-link"]')).toBeVisible()
    
    // 提供瀏覽器設定指南
    const guideText = await page.locator('[data-testid="enable-notifications-guide"]').textContent()
    expect(guideText).toContain('若要重新啟用系統通知')
    expect(guideText).toContain('請前往瀏覽器設定')
  })

  test('替代提醒設定應正確保存和載入', async ({ page }) => {
    // Given - 設定替代提醒偏好
    await page.addInitScript(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: false
      })
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // 配置替代提醒設定
    await page.locator('[data-testid="settings-button"]').click()
    await page.locator('[data-testid="visual-alerts-enabled"]').check()
    await page.locator('[data-testid="flash-duration"]').fill('3')
    await page.locator('[data-testid="sound-alerts-enabled"]').check()
    await page.locator('[data-testid="alert-sound-select"]').selectOption('bell')
    await page.locator('[data-testid="tab-title-alerts-enabled"]').check()
    await page.locator('[data-testid="settings-save"]').click()
    
    // When - 重新載入頁面
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // Then - 設定應正確載入
    await page.locator('[data-testid="settings-button"]').click()
    
    const visualEnabled = await page.locator('[data-testid="visual-alerts-enabled"]').isChecked()
    const flashDuration = await page.locator('[data-testid="flash-duration"]').inputValue()
    const soundEnabled = await page.locator('[data-testid="sound-alerts-enabled"]').isChecked()
    const selectedSound = await page.locator('[data-testid="alert-sound-select"]').inputValue()
    const titleEnabled = await page.locator('[data-testid="tab-title-alerts-enabled"]').isChecked()
    
    expect(visualEnabled).toBe(true)
    expect(flashDuration).toBe('3')
    expect(soundEnabled).toBe(true)
    expect(selectedSound).toBe('bell')
    expect(titleEnabled).toBe(true)
  })

  test('當通知權限從 denied 變為 granted 時應自動切換', async ({ page, context }) => {
    // Given - 開始時權限被拒絕
    await page.addInitScript(() => {
      window.notificationPermission = 'denied'
      Object.defineProperty(window.Notification, 'permission', {
        get: () => window.notificationPermission,
        set: (value) => { window.notificationPermission = value }
      })
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // 確認替代提醒已啟用
    await page.locator('[data-testid="timer-start"]').click()
    await expect(page.locator('[data-testid="fallback-options"]')).toBeVisible()
    
    // When - 模擬權限變更為 granted
    await page.evaluate(() => {
      window.notificationPermission = 'granted'
      // 觸發權限變更事件
      window.dispatchEvent(new CustomEvent('permissionchange'))
    })
    
    // Then - 應自動切換回系統通知
    await expect(page.locator('[data-testid="notification-enabled-notice"]')).toBeVisible()
    await expect(page.locator('[data-testid="notification-enabled-notice"]')).toContainText('系統通知已啟用')
    await expect(page.locator('[data-testid="fallback-options"]')).not.toBeVisible()
  })

  test('在不支援通知的環境中應優雅降級', async ({ page }) => {
    // Given - 模擬不支援 Notification API 的環境
    await page.addInitScript(() => {
      delete window.Notification
    })
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // When - 啟動計時器
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 應自動啟用替代提醒並顯示說明
    await expect(page.locator('[data-testid="no-notification-support"]')).toBeVisible()
    await expect(page.locator('[data-testid="no-notification-support"]')).toContainText('此瀏覽器不支援系統通知')
    
    // 替代提醒選項應自動顯示
    await expect(page.locator('[data-testid="fallback-options"]')).toBeVisible()
    
    // 預設應啟用視覺和音效提醒
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('flowsip-settings')
      return stored ? JSON.parse(stored) : {}
    })
    
    expect(settings.visualAlertsEnabled).toBe(true)
    expect(settings.soundAlertsEnabled).toBe(true)
  })
})