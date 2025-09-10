# FlowSip PWA 開發指南

Auto-generated from all feature plans. Last updated: 2025-09-10

## Active Technologies
- **Nuxt 4**: 現代化 Vue 框架，SSG 模式，自動導入和檔案路由
- **TypeScript 5.x**: 型別安全和優秀的開發體驗
- **UnoCSS**: 原子化 CSS，避免 Tailwind 4 相容性問題
- **@vite-pwa/nuxt**: Nuxt 官方 PWA 解決方案
- **Web Workers**: Vite 自動打包，精準背景計時
- **idb**: 現代化 IndexedDB 包裝器
- **@vueuse/core**: Vue 3 工具庫
- **Vitest + Playwright**: 測試框架

## Project Structure
```
# Nuxt 4 專案結構
nuxt.config.ts           # Nuxt 配置
app.vue                  # 根元件
pwa-assets.config.ts     # PWA 資產配置

pages/                   # 檔案路由系統
├── index.vue           # 主計時器頁面
├── stats.vue           # 統計頁面
├── settings.vue        # 設定頁面
└── about.vue           # 關於頁面

components/
├── Timer/              # 計時器元件
├── Stats/              # 統計元件
├── Settings/           # 設定元件
└── Common/             # 共用元件

composables/            # Nuxt 4 composables
├── useTimer.ts         # 計時器邏輯
├── useStorage.ts       # 儲存管理
├── useNotifications.ts # 通知管理
├── useStats.ts         # 統計分析
├── useSettings.ts      # 設定管理
├── useTheme.ts         # 主題管理
└── usePWA.ts          # PWA 功能

utils/                  # 工具函式
types/                  # 型別定義
workers/                # Web Workers
├── timer-worker.ts     # 計時 Worker
tests/                  # 測試檔案
├── unit/              # Vitest 單元測試
├── integration/       # Nuxt 整合測試
└── e2e/               # Playwright E2E 測試

public/
├── icons/             # PWA 圖示
└── sounds/            # 提醒音效
```

## Commands
```bash
# 開發
npm run dev            # 啟動開發伺服器
npm run build          # 建置專案
npm run generate       # 生成靜態網站
npm run preview        # 預覽建置結果

# 測試
npm run test           # Vitest 單元測試
npm run test:e2e       # Playwright E2E 測試
npm run type-check     # TypeScript 型別檢查

# 程式碼品質
npm run lint           # ESLint 檢查
npm run lint:fix       # 自動修復 ESLint 錯誤
```

## Core Concepts

### Composables Pattern
- 使用 Nuxt 4 自動導入的 composables
- 響應式狀態管理（ref, computed, reactive）
- 生命週期管理（onMounted, onUnmounted）
- 副作用管理（watch, watchEffect）

### Web Worker 計時
- 主執行緒與 Worker 通信協議
- 時間戳校正機制確保精準度 <2s
- Page Visibility API 整合

### PWA 最佳實務
- @vite-pwa/nuxt 自動配置
- 離線優先策略
- Service Worker 快取管理
- 安裝提示和更新機制

### 儲存策略
- localStorage: 設定和計時器狀態
- IndexedDB (idb): 活動記錄和統計資料
- 資料分層和優先級管理

## Code Style

### Nuxt 4 約定
```typescript
// composables/useExample.ts - 自動導入
export const useExample = () => {
  const state = ref(initialState)
  const computed = computed(() => derivedValue)
  
  return {
    state: readonly(state),
    computed,
    methods
  }
}

// pages/example.vue - 檔案路由
<script setup lang="ts">
// 自動導入 composables
const example = useExample()

// SEO 設定
useSeoMeta({
  title: '頁面標題',
  description: '頁面描述'
})
</script>
```

### TypeScript 最佳實務
- 嚴格型別檢查 (`strict: true`)
- 介面定義優於 `any`
- 使用 `readonly` 保護狀態
- 善用型別推斷，避免冗餘註釋

### UnoCSS 使用
```vue
<template>
  <!-- 原子類別 -->
  <div class="flex justify-center items-center">
    <!-- shortcuts -->
    <button class="btn-primary">
      <!-- 主題色彩 -->
      <span class="text-water-500">💧</span>
    </button>
  </div>
</template>
```

### 元件設計原則
- 單一職責，功能內聚
- 響應式設計，行動優先
- 無障礙支援 (ARIA)
- 效能優化（懶載入、虛擬滾動）

## Testing Strategy

### 單元測試 (Vitest)
```typescript
import { describe, it, expect } from 'vitest'
import { useTimer } from '~/composables/useTimer'

describe('useTimer', () => {
  it('should initialize correctly', () => {
    const timer = useTimer()
    expect(timer.isRunning.value).toBe(false)
  })
})
```

### 整合測試 (Nuxt Test Utils)
```typescript
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TimerComponent from '~/components/Timer/Display.vue'

describe('Timer Integration', () => {
  it('should render timer display', async () => {
    const component = await mountSuspended(TimerComponent)
    expect(component.html()).toContain('00:00')
  })
})
```

### E2E 測試 (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('PWA functionality', async ({ page }) => {
  await page.goto('/')
  
  // 測試計時器功能
  await page.click('[data-testid="start-button"]')
  await expect(page.locator('[data-testid="timer-display"]')).toContain('29:59')
  
  // 測試離線功能
  await page.context().setOffline(true)
  await page.reload()
  await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
})
```

## Recent Changes
- 001-flowsip-mvp-pwa: 採用 Nuxt 4 + UnoCSS + @vite-pwa/nuxt 技術堆疊
- 實作 Web Worker 精準計時系統
- 建立 Composables 架構和型別定義
- 配置 PWA 和測試環境
- 建立 MVP 任務清單 (26個任務) 和進度追蹤系統

## Performance Targets
- 啟動時間: <1s (Nuxt 4 SSG + 預快取)
- 計時精準度: <2s 誤差 (Web Worker + 時間戳校正)
- PWA 安裝率: ≥12% (自動提示 + 價值主張)
- 離線支援: 100% 核心功能 (Service Worker + 本機儲存)

## Development Workflow
1. **TDD**: 測試先行，RED-GREEN-重構循環
2. **型別優先**: 定義介面後實作
3. **漸進式增強**: 核心功能優先，漸進新增
4. **效能監控**: 定期檢查 Web Vitals

## Progress Tracking Rules
**重要**: 每次執行任務後必須同時更新：

### 1. tasks.md - 標記任務完成
```markdown
- [x] **T00X** 任務名稱 ✅
```

### 2. progress.md - 詳細狀態記錄
```markdown
- [x] **T00X** 任務名稱
  - **狀態**: ✅ 已完成
  - **實際時間**: X小時
  - **完成時間**: 2025-09-XX XX:XX
  - **備註**: 實作要點或遇到的問題
```

**目的**: 追蹤進度、時間估算準確度、記錄學習成果

## 語言規範
**本專案所有溝通和文件均使用正體中文**

### 開發過程中的語言要求
- **AI 助理回答**: 必須使用正體中文回答所有問題和提供建議
- **程式碼註解**: 使用正體中文撰寫，提高程式碼可讀性
- **Git 提交**: 提交訊息使用正體中文描述變更內容
- **文件撰寫**: 所有技術文件、規格書、任務清單使用正體中文
- **錯誤處理**: 錯誤訊息和日誌使用正體中文，便於除錯

### UI 文案標準
- 使用台灣慣用的正體中文用詞和語法
- 按鈕文字簡潔明確（如：「開始」、「暫停」、「設定」）
- 提示訊息友善易懂（如：「計時已開始」、「請允許通知權限」）
- 錯誤訊息具體明確（如：「無法儲存設定，請稍後再試」）

### 技術術語處理
- 優先使用中文術語：「元件」而非 "Component"
- 必要時括號標註：「響應式 (Reactive)」
- 保持專業性和一致性
- 建立專案術語詞彙表確保用詞統一

**目標**: 創造完全在地化的開發和使用體驗，提高專案的可理解性和使用者友善度。

<!-- MANUAL ADDITIONS START -->
<!-- 在這裡新增手動內容，不會被自動更新覆蓋 -->
<!-- MANUAL ADDITIONS END -->