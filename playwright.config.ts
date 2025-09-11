import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* 平行運行測試檔案 */
  fullyParallel: true,
  /* 在 CI 中失敗時不重試 */
  forbidOnly: !!process.env.CI,
  /* 在 CI 中重試失敗的測試 */
  retries: process.env.CI ? 2 : 0,
  /* 在 CI 中限制併發工作者數量 */
  workers: process.env.CI ? 1 : undefined,
  /* 測試報告配置 */
  reporter: 'html',
  /* 全域設定 */
  use: {
    /* Base URL */
    baseURL: 'http://127.0.0.1:3000',

    /* 收集失敗測試的追蹤資訊 */
    trace: 'on-first-retry',
  },

  /* 配置測試專案 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* 行動裝置測試 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 在測試開始前啟動開發伺服器 */
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
})