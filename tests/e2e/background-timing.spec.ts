/**
 * E2E 測試：背景計時準確度
 * 
 * 關鍵效能需求：背景計時誤差必須小於 2 秒
 * 這些測試必須在實作前撰寫並失敗，符合 TDD RED 階段要求
 */

import { test, expect, type Page } from '@playwright/test'

test.describe('背景計時準確度測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 前往 FlowSip 主頁面
    await page.goto('/')
    
    // 等待頁面載入完成
    await page.waitForLoadState('domcontentloaded')
    
    // 確保計時器處於初始狀態
    const timerStatus = await page.locator('[data-testid="timer-status"]')
    await expect(timerStatus).toHaveText('已停止')
  })

  test('喝水計時器在分頁切換到背景後應保持準確計時', async ({ page, context }) => {
    // Given - 啟動 30 分鐘喝水計時器
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('30')
    const startButton = page.locator('[data-testid="timer-start"]')
    
    // 記錄實際開始時間
    const actualStartTime = Date.now()
    await startButton.click()
    
    // 驗證計時器已啟動
    const timerStatus = page.locator('[data-testid="timer-status"]')
    await expect(timerStatus).toHaveText('進行中')
    
    // When - 創建新分頁並切換（模擬背景運行）
    const backgroundPage = await context.newPage()
    await backgroundPage.goto('about:blank')
    
    // 等待 3 秒模擬背景運行
    await backgroundPage.waitForTimeout(3000)
    
    // 切回原分頁
    await page.bringToFront()
    await page.waitForLoadState('domcontentloaded')
    
    // Then - 檢查計時器時間準確性
    const actualElapsedTime = Date.now() - actualStartTime
    const displayedTime = await page.locator('[data-testid="timer-remaining"]').textContent()
    
    // 解析顯示時間（格式：MM:SS）
    const [minutes, seconds] = displayedTime!.split(':').map(Number)
    const displayedRemaining = (minutes * 60 + seconds) * 1000
    const expectedRemaining = (30 * 60 * 1000) - actualElapsedTime
    
    // 驗證誤差小於 2 秒
    const timingError = Math.abs(displayedRemaining - expectedRemaining)
    expect(timingError).toBeLessThan(2000) // < 2 秒誤差要求
    
    // 清理
    await backgroundPage.close()
  })

  test('番茄鐘計時器在分頁最小化後應保持準確計時', async ({ page, context }) => {
    // Given - 啟動 25 分鐘番茄鐘計時器
    await page.locator('[data-testid="mode-pomodoro"]').click()
    await page.locator('[data-testid="duration-input"]').fill('25')
    
    const actualStartTime = Date.now()
    await page.locator('[data-testid="timer-start"]').click()
    
    // 驗證計時器已啟動
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('進行中')
    
    // When - 模擬頁面失去焦點（最小化）
    await page.evaluate(() => {
      // 觸發頁面失去焦點事件
      window.dispatchEvent(new Event('blur'))
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    // 等待 5 秒
    await page.waitForTimeout(5000)
    
    // 模擬頁面重新獲得焦點
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'))
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Then - 檢查計時準確性
    const actualElapsedTime = Date.now() - actualStartTime
    const remainingText = await page.locator('[data-testid="timer-remaining"]').textContent()
    const [minutes, seconds] = remainingText!.split(':').map(Number)
    const displayedRemaining = (minutes * 60 + seconds) * 1000
    const expectedRemaining = (25 * 60 * 1000) - actualElapsedTime
    
    // 驗證誤差小於 2 秒
    const timingError = Math.abs(displayedRemaining - expectedRemaining)
    expect(timingError).toBeLessThan(2000)
  })

  test('計時器在長時間背景運行後應正確同步時間', async ({ page, context }) => {
    // Given - 啟動 10 分鐘計時器（較短時間便於測試）
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('10')
    
    const actualStartTime = Date.now()
    await page.locator('[data-testid="timer-start"]').click()
    
    // When - 模擬長時間背景運行（10 秒）
    const backgroundPage = await context.newPage()
    await backgroundPage.goto('about:blank')
    await backgroundPage.waitForTimeout(10000) // 10 秒背景運行
    
    // 切回原分頁
    await page.bringToFront()
    
    // 等待同步完成
    await page.waitForTimeout(500)
    
    // Then - 檢查時間同步準確性
    const actualElapsedTime = Date.now() - actualStartTime
    const progress = await page.locator('[data-testid="timer-progress"]').getAttribute('data-progress')
    const progressValue = parseFloat(progress!)
    
    // 根據進度計算剩餘時間
    const totalDuration = 10 * 60 * 1000
    const calculatedElapsed = totalDuration * progressValue
    
    // 驗證計算的經過時間與實際時間的誤差
    const syncError = Math.abs(calculatedElapsed - actualElapsedTime)
    expect(syncError).toBeLessThan(2000) // 同步誤差 < 2 秒
    
    await backgroundPage.close()
  })

  test('計時器在瀏覽器刷新後應能恢復正確時間', async ({ page }) => {
    // Given - 啟動計時器
    await page.locator('[data-testid="mode-pomodoro"]').click()
    await page.locator('[data-testid="duration-input"]').fill('15')
    
    const actualStartTime = Date.now()
    await page.locator('[data-testid="timer-start"]').click()
    
    // 等待 3 秒
    await page.waitForTimeout(3000)
    
    // When - 刷新頁面
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    // Then - 檢查計時器是否恢復到正確狀態
    const actualElapsedTime = Date.now() - actualStartTime
    
    // 驗證計時器狀態已恢復
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('進行中')
    
    // 檢查剩餘時間準確性
    const remainingText = await page.locator('[data-testid="timer-remaining"]').textContent()
    const [minutes, seconds] = remainingText!.split(':').map(Number)
    const displayedRemaining = (minutes * 60 + seconds) * 1000
    const expectedRemaining = (15 * 60 * 1000) - actualElapsedTime
    
    const recoveryError = Math.abs(displayedRemaining - expectedRemaining)
    expect(recoveryError).toBeLessThan(2000) // 恢復誤差 < 2 秒
  })

  test('多個計時器狀態變化不應影響時間準確性', async ({ page }) => {
    // Given - 啟動計時器
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('5')
    
    const startTime = Date.now()
    await page.locator('[data-testid="timer-start"]').click()
    
    // 等待 2 秒
    await page.waitForTimeout(2000)
    
    // When - 執行暫停和繼續操作
    await page.locator('[data-testid="timer-pause"]').click()
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已暫停')
    
    const pauseTime = Date.now()
    await page.waitForTimeout(3000) // 暫停 3 秒
    
    await page.locator('[data-testid="timer-resume"]').click()
    const resumeTime = Date.now()
    
    // 等待 2 秒後檢查
    await page.waitForTimeout(2000)
    
    // Then - 計算預期剩餘時間（扣除暫停時間）
    const totalElapsedTime = (pauseTime - startTime) + (Date.now() - resumeTime)
    const expectedRemaining = (5 * 60 * 1000) - totalElapsedTime
    
    const displayedTime = await page.locator('[data-testid="timer-remaining"]').textContent()
    const [minutes, seconds] = displayedTime!.split(':').map(Number)
    const displayedRemaining = (minutes * 60 + seconds) * 1000
    
    // 驗證暫停/恢復不影響計時準確性
    const pauseResumeError = Math.abs(displayedRemaining - expectedRemaining)
    expect(pauseResumeError).toBeLessThan(2000)
  })

  test('計時器完成時應在準確時間觸發', async ({ page }) => {
    // Given - 設定一個很短的計時器（5 秒便於測試）
    await page.locator('[data-testid="mode-water"]').click()
    await page.locator('[data-testid="duration-input"]').fill('0.08') // 5 秒
    
    const startTime = Date.now()
    await page.locator('[data-testid="timer-start"]').click()
    
    // When - 等待計時器完成
    await expect(page.locator('[data-testid="timer-status"]')).toHaveText('已完成', { timeout: 10000 })
    
    // Then - 檢查完成時間準確性
    const completionTime = Date.now()
    const actualDuration = completionTime - startTime
    const expectedDuration = 5000 // 5 秒
    
    // 驗證完成時間誤差
    const completionError = Math.abs(actualDuration - expectedDuration)
    expect(completionError).toBeLessThan(2000) // 完成時間誤差 < 2 秒
    
    // 驗證完成通知
    await expect(page.locator('[data-testid="completion-notification"]')).toBeVisible()
  })

  test('Web Worker 計時系統應獨立於主線程運行', async ({ page }) => {
    // Given - 啟動計時器
    await page.locator('[data-testid="mode-pomodoro"]').click()
    await page.locator('[data-testid="duration-input"]').fill('2') // 2 分鐘
    
    const startTime = Date.now()
    await page.locator('[data-testid="timer-start"]').click()
    
    // When - 在主線程中執行密集運算（模擬阻塞）
    await page.evaluate(() => {
      const blockStart = Date.now()
      // 執行 2 秒的密集運算
      while (Date.now() - blockStart < 2000) {
        // 阻塞主線程
        Math.random()
      }
    })
    
    // Then - 檢查計時器是否不受影響
    const checkTime = Date.now()
    const actualElapsed = checkTime - startTime
    
    const remainingText = await page.locator('[data-testid="timer-remaining"]').textContent()
    const [minutes, seconds] = remainingText!.split(':').map(Number)
    const displayedRemaining = (minutes * 60 + seconds) * 1000
    const expectedRemaining = (2 * 60 * 1000) - actualElapsed
    
    // 即使主線程被阻塞，Web Worker 計時應保持準確
    const workerError = Math.abs(displayedRemaining - expectedRemaining)
    expect(workerError).toBeLessThan(2000)
  })
})