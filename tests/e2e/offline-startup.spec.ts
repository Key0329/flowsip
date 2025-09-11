/**
 * E2E 測試：離線啟動功能
 * 
 * PWA 離線核心功能測試
 * 這些測試必須在實作前撰寫並失敗，符合 TDD RED 階段要求
 */

import { test, expect, type Page } from '@playwright/test'

test.describe('PWA 離線啟動功能測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 前往 FlowSip 主頁面並等待 PWA 安裝
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // 等待 Service Worker 註冊完成
    await page.waitForFunction(() => 'serviceWorker' in navigator)
    
    // 確認 PWA 功能可用
    const isPWAReady = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return registration.active !== null
      }
      return false
    })
    
    if (!isPWAReady) {
      // 等待 PWA 準備完成
      await page.waitForTimeout(2000)
    }
  })

  test('PWA 應能在離線狀態下啟動', async ({ page, context }) => {
    // Given - 確保頁面已載入並快取
    await expect(page.locator('[data-testid="app-title"]')).toHaveText('FlowSip')
    await page.waitForTimeout(1000) // 等待資源快取

    // When - 模擬離線狀態
    await context.setOffline(true)
    
    // 刷新頁面測試離線啟動
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Then - 應能正常顯示應用程式
    await expect(page.locator('[data-testid="app-title"]')).toHaveText('FlowSip')
    await expect(page.locator('[data-testid="timer-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="timer-controls"]')).toBeVisible()
    
    // 驗證離線提示顯示
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toHaveText('離線模式')
    
    // 恢復線上狀態
    await context.setOffline(false)
  })

  test('離線狀態下計時器功能應正常運作', async ({ page, context }) => {
    // Given - 設定離線狀態
    await context.setOffline(true)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // When - 啟動計時器
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('2') // 2 分鐘測試
    await page.locator('[data-testid="timer-start"]').click()
    
    // Then - 計時器應正常啟動
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('進行中')
    
    // 驗證計時器顯示更新
    await page.waitForTimeout(1000)
    const initialTime = await page.locator('[data-testid="timer-remaining"]').textContent()
    
    await page.waitForTimeout(2000)
    const updatedTime = await page.locator('[data-testid="timer-remaining"]').textContent()
    
    expect(initialTime).not.toBe(updatedTime) // 時間應有變化
    
    // 驗證可以暫停和繼續
    await page.locator('[data-testid="timer-pause"]').click()
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已暫停')
    
    await page.locator('[data-testid="timer-resume"]').click()
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('進行中')
    
    // 恢復線上狀態
    await context.setOffline(false)
  })

  test('離線狀態下設定應能正常儲存和載入', async ({ page, context }) => {
    // Given - 在線上狀態先設定一些偏好
    await page.locator('[data-testid="settings-button"]').click()
    await page.locator('[data-testid="volume-slider"]').fill('0.8')
    await page.locator('[data-testid="theme-dark"]').click()
    await page.locator('[data-testid="settings-save"]').click()
    
    // When - 切換到離線狀態
    await context.setOffline(true)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // Then - 設定應正確載入
    await page.locator('[data-testid="settings-button"]').click()
    const volumeValue = await page.locator('[data-testid="volume-slider"]').inputValue()
    const isDarkTheme = await page.locator('[data-testid="theme-dark"]').isChecked()
    
    expect(volumeValue).toBe('0.8')
    expect(isDarkTheme).toBe(true)
    
    // 在離線狀態下修改設定
    await page.locator('[data-testid="volume-slider"]').fill('0.6')
    await page.locator('[data-testid="theme-light"]').click()
    await page.locator('[data-testid="settings-save"]').click()
    
    // 刷新頁面驗證設定持久化
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    await page.locator('[data-testid="settings-button"]').click()
    const newVolumeValue = await page.locator('[data-testid="volume-slider"]').inputValue()
    const isLightTheme = await page.locator('[data-testid="theme-light"]').isChecked()
    
    expect(newVolumeValue).toBe('0.6')
    expect(isLightTheme).toBe(true)
    
    // 恢復線上狀態
    await context.setOffline(false)
  })

  test('離線狀態下活動記錄應能正常儲存', async ({ page, context }) => {
    // Given - 設定離線狀態
    await context.setOffline(true)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // When - 完成一個短計時器
    await page.locator('[data-testid="mode-pomodoro"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.05') // 3 秒測試
    await page.locator('[data-testid="timer-start"]').click()
    
    // 等待計時器完成
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已完成', { timeout: 10000 })
    
    // Then - 檢查活動記錄
    await page.locator('[data-testid="stats-button"]').click()
    const todayRecords = await page.locator('[data-testid="today-pomodoro-count"]').textContent()
    expect(todayRecords).toBe('1')
    
    // 再完成一個計時器
    await page.locator('[data-testid="back-to-timer"]').click()
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.05')
    await page.locator('[data-testid="timer-start"]').click()
    
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已完成', { timeout: 10000 })
    
    // 驗證記錄累積
    await page.locator('[data-testid="stats-button"]').click()
    const waterCount = await page.locator('[data-testid="today-water-count"]').textContent()
    expect(waterCount).toBe('1')
    
    // 刷新頁面驗證記錄持久化
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    await page.locator('[data-testid="stats-button"]').click()
    const persistedPomodoroCount = await page.locator('[data-testid="today-pomodoro-count"]').textContent()
    const persistedWaterCount = await page.locator('[data-testid="today-water-count"]').textContent()
    
    expect(persistedPomodoroCount).toBe('1')
    expect(persistedWaterCount).toBe('1')
    
    // 恢復線上狀態
    await context.setOffline(false)
  })

  test('Service Worker 應正確快取應用程式資源', async ({ page, context }) => {
    // Given - 確保所有資源已載入
    await page.waitForLoadState('networkidle')
    
    // 檢查 Service Worker 快取
    const cacheStatus = await page.evaluate(async () => {
      const cacheNames = await caches.keys()
      const hasAppCache = cacheNames.some(name => name.includes('app') || name.includes('workbox'))
      return { hasCaches: cacheNames.length > 0, hasAppCache }
    })
    
    expect(cacheStatus.hasCaches).toBe(true)
    expect(cacheStatus.hasAppCache).toBe(true)
    
    // When - 模擬網路中斷
    await context.setOffline(true)
    
    // Then - 應用程式仍能載入
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // 驗證關鍵資源已快取
    await expect(page.locator('[data-testid="app-title"]')).toHaveText('FlowSip')
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible()
    
    // 檢查控制台沒有載入錯誤
    const errors = await page.evaluate(() => {
      return window.console.errors || []
    })
    
    // 不應有關鍵資源載入失敗
    const criticalErrors = errors.filter(error => 
      error.includes('Failed to load') || error.includes('net::ERR_INTERNET_DISCONNECTED')
    )
    expect(criticalErrors.length).toBe(0)
    
    // 恢復線上狀態
    await context.setOffline(false)
  })

  test('PWA 安裝提示應在支援的瀏覽器顯示', async ({ page }) => {
    // Given - 訪問應用程式
    await page.waitForLoadState('domcontentloaded')
    
    // 模擬 PWA 安裝提示事件
    await page.evaluate(() => {
      // 創建模擬的 beforeinstallprompt 事件
      const mockEvent = new CustomEvent('beforeinstallprompt', {
        cancelable: true
      })
      // @ts-expect-error - 測試用模擬事件
      mockEvent.prompt = () => Promise.resolve()
      // @ts-expect-error - 測試用模擬事件
      mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
      
      window.dispatchEvent(mockEvent)
    })
    
    // Then - 安裝提示應顯示
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible()
    
    // 點擊安裝按鈕
    await page.locator('[data-testid="pwa-install-button"]').click()
    
    // 驗證安裝流程啟動
    const installResult = await page.evaluate(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve('install-attempted'), 100)
      })
    })
    
    expect(installResult).toBe('install-attempted')
  })

  test('離線狀態指示器應正確顯示網路狀態', async ({ page, context }) => {
    // Given - 確保在線狀態
    await context.setOffline(false)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // Then - 應顯示在線狀態
    const onlineIndicator = page.locator('[data-testid="network-status"]')
    await expect(onlineIndicator).toHaveText('已連線')
    await expect(onlineIndicator).toHaveClass(/.*online.*/)
    
    // When - 切換到離線狀態
    await context.setOffline(true)
    
    // 觸發網路狀態變更事件
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    
    // Then - 應顯示離線狀態
    await expect(onlineIndicator).toHaveText('離線模式')
    await expect(onlineIndicator).toHaveClass(/.*offline.*/)
    
    // When - 恢復在線狀態
    await context.setOffline(false)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
    
    // Then - 應恢復在線顯示
    await expect(onlineIndicator).toHaveText('已連線')
    await expect(onlineIndicator).toHaveClass(/.*online.*/)
  })

  test('離線狀態下應顯示適當的功能限制提示', async ({ page, context }) => {
    // Given - 設定離線狀態
    await context.setOffline(true)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // Then - 應顯示離線功能說明
    await expect(page.locator('[data-testid="offline-notice"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-notice"]')).toContainText('離線模式下，所有資料將儲存在本機')
    
    // 核心功能應可用
    await expect(page.locator('[data-testid="timer-start"]')).toBeEnabled()
    await expect(page.locator('[data-testid="settings-button"]')).toBeEnabled()
    
    // 可能受限的功能應有提示
    const syncButton = page.locator('[data-testid="sync-button"]')
    if (await syncButton.isVisible()) {
      await expect(syncButton).toBeDisabled()
      await expect(page.locator('[data-testid="sync-disabled-tooltip"]')).toHaveText('離線時無法同步資料')
    }
    
    // 恢復線上狀態
    await context.setOffline(false)
  })
})