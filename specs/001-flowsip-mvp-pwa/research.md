# Phase 0 研究：FlowSip Nuxt 4 PWA 技術決策

## Nuxt 4 最佳實務研究

### 決策：Nuxt 4 SSG 模式 + 自動導入 + 檔案路由
- **選擇理由**：
  - Nuxt 4 提供完整的 SSG 支援，優化初始載入和 SEO
  - 自動導入 composables 和 components，減少樣板程式碼
  - 檔案路由系統簡化頁面管理
  - TypeScript 原生支援，優秀的開發體驗
- **SSG 優勢**：
  - 靜態生成的頁面啟動更快（<1s 目標）
  - 更好的快取策略和 PWA 整合
  - 離線優先架構的理想基礎
- **替代方案**：
  - Next.js：React 生態，但需要額外學習成本
  - Vite + Vue 3：配置複雜，缺少約定優於配置
  - SvelteKit：生態較小，TypeScript 支援不如 Vue

### Nuxt 4 新特性應用
```typescript
// nuxt.config.ts - 現代化配置
export default defineNuxtConfig({
  ssr: false,           // PWA 不需要 SSR
  generate: {
    prerender: true     // 預渲染所有頁面
  },
  experimental: {
    payloadExtraction: false  // PWA 優化
  }
})
```

## UnoCSS 整合研究

### 決策：UnoCSS 替代 Tailwind CSS
- **選擇理由**：
  - 避免 Tailwind 4 與 Vite plugin 的相容性問題
  - 更好的效能：按需生成，零執行時開銷
  - 靈活的預設配置和自訂規則
  - 與 Nuxt 完美整合
- **效能優勢**：
  ```typescript
  // uno.config.ts - 優化配置
  import { defineConfig, presetUno, presetIcons } from 'unocss'
  
  export default defineConfig({
    presets: [
      presetUno(),
      presetIcons({
        extraProperties: {
          'display': 'inline-block',
          'vertical-align': 'middle'
        }
      })
    ],
    // 自訂主題變數
    theme: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#06b6d4',
          900: '#164e63'
        }
      }
    }
  })
  ```

### 主題系統設計
- **決策**：CSS 變數 + UnoCSS 動態主題
- **實作策略**：
  - 使用 CSS 變數定義主題色彩
  - UnoCSS shortcuts 建立元件樣式
  - 支援深色/淺色/自動主題切換

## @vite-pwa/nuxt PWA 整合

### 決策：@vite-pwa/nuxt 作為 PWA 解決方案
- **選擇理由**：
  - Nuxt 官方生態系統中最成熟的 PWA 方案
  - 自動生成 Service Worker 和 Web App Manifest
  - 完整的離線支援和快取策略
  - 與 Vite 和 Nuxt 深度整合
- **配置策略**：
  ```typescript
  // nuxt.config.ts - PWA 配置
  export default defineNuxtConfig({
    modules: ['@vite-pwa/nuxt'],
    pwa: {
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      },
      client: {
        installPrompt: true,
        periodicSyncForUpdates: 20
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        type: 'module'
      }
    }
  })
  ```

### PWA 最佳化策略
- **快取策略**：
  - 應用殼層：Cache First
  - API 資料：Network First with Cache Fallback
  - 靜態資源：Stale While Revalidate
- **離線支援**：
  - 核心功能完全離線可用
  - 離線頁面友善提示
  - 資料同步佇列機制

## Web Worker 計時系統

### 決策：Web Worker + 時間戳校正
- **選擇理由**：
  - Vite 原生支援 Web Worker 打包，無需額外配置
  - 背景執行緒確保計時精準度，不受主執行緒影響
  - 時間戳校正機制保證誤差 <2s
- **實作架構**：
  ```typescript
  // workers/timer-worker.ts
  export interface TimerWorkerMessage {
    type: 'start' | 'pause' | 'stop' | 'sync';
    payload: {
      startTime: number;
      duration: number;
      mode: 'water' | 'pomodoro';
    };
  }
  
  // 主執行緒通信
  const worker = new Worker('/workers/timer-worker.ts', { type: 'module' });
  ```

### 時間戳校正機制
```typescript
// 精準計時核心邏輯
class TimerWorker {
  private startTimestamp: number = 0;
  private duration: number = 0;
  
  start(duration: number) {
    this.startTimestamp = Date.now();
    this.duration = duration;
    this.scheduleCheck();
  }
  
  getRemaining(): number {
    const elapsed = Date.now() - this.startTimestamp;
    return Math.max(0, this.duration - elapsed);
  }
  
  // 每秒校正一次
  scheduleCheck() {
    setTimeout(() => {
      if (this.isRunning) {
        this.postMessage({
          type: 'tick',
          remaining: this.getRemaining()
        });
        this.scheduleCheck();
      }
    }, 1000);
  }
}
```

### Page Visibility API 整合
```typescript
// composables/useTimer.ts
export const useTimer = () => {
  const { $worker } = useNuxtApp();
  
  // 頁面可見性變化處理
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // 立即校正計時器狀態
      $worker.postMessage({ type: 'sync', timestamp: Date.now() });
    }
  });
}
```

## idb + localStorage 混合儲存

### 決策：分層儲存策略
- **localStorage**：
  - 用戶設定（小量資料）
  - 計時器狀態（需要同步存取）
  - 主題偏好（啟動時立即需要）
- **IndexedDB (idb)**：
  - 活動記錄（大量結構化資料）
  - 統計資料（複雜查詢需求）
  - 匯出資料快取

### idb 現代化封裝
```typescript
// utils/storage.ts - 使用 idb 程式庫
import { openDB, type DBSchema } from 'idb';

interface FlowSipDB extends DBSchema {
  activities: {
    key: number;
    value: ActivityRecord;
    indexes: { 'by-date': string; 'by-type': string; };
  };
  stats: {
    key: string;
    value: DailyStats | WeeklyStats;
  };
}

const db = await openDB<FlowSipDB>('flowsip-db', 1, {
  upgrade(db) {
    const activityStore = db.createObjectStore('activities', { 
      keyPath: 'timestamp' 
    });
    activityStore.createIndex('by-date', 'date');
    activityStore.createIndex('by-type', 'type');
  }
});
```

### 資料同步策略
- **寫入優先級**：
  1. Critical：立即寫入 localStorage
  2. Important：批次寫入 IndexedDB（每 5 筆或 30 秒）
  3. Statistics：背景計算和寫入
- **讀取優先級**：
  1. 設定：localStorage（同步）
  2. 今日資料：IndexedDB 優先，localStorage 降級
  3. 歷史資料：純 IndexedDB

## 測試策略：@nuxt/test-utils + Vitest + Playwright

### 決策：三層測試架構
- **單元測試**：Vitest + @nuxt/test-utils
  ```typescript
  // tests/unit/useTimer.test.ts
  import { describe, it, expect } from 'vitest'
  import { mountSuspended } from '@nuxt/test-utils/runtime'
  
  describe('useTimer', () => {
    it('should start timer correctly', async () => {
      const { timer } = await useTimer();
      await timer.start('water', 30 * 60 * 1000);
      expect(timer.isRunning.value).toBe(true);
    });
  });
  ```

- **整合測試**：Nuxt Test Environment
  ```typescript
  // tests/integration/timer-workflow.test.ts
  import { setup, $fetch } from '@nuxt/test-utils'
  
  describe('Timer Workflow', async () => {
    await setup({
      // Nuxt 配置
    })
    
    it('should complete full timer cycle', async () => {
      // 測試完整的計時器工作流程
    });
  });
  ```

- **E2E 測試**：Playwright + PWA
  ```typescript
  // tests/e2e/pwa.spec.ts
  import { test, expect } from '@playwright/test'
  
  test('PWA install and offline functionality', async ({ page }) => {
    await page.goto('/');
    
    // 測試 PWA 安裝提示
    await expect(page.locator('[data-testid="install-prompt"]')).toBeVisible();
    
    // 測試離線功能
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });
  ```

### 測試配置最佳化
```typescript
// vitest.config.ts - Nuxt 測試配置
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom'
      }
    }
  }
})
```

## 效能最佳化策略

### 啟動時間 < 1 秒
- **決策**：
  - Nuxt 4 SSG 預渲染所有頁面
  - Critical CSS 內嵌，UnoCSS 按需載入
  - 自動程式碼分割和懶載入
  - Service Worker 預快取關鍵資源

### 計時精準度 < 2 秒誤差
- **決策**：Web Worker + 時間戳校正（已詳述）

### PWA 安裝率 ≥ 12%
- **決策**：
  - @vite-pwa/nuxt 自動處理 PWA 清單
  - 智慧型安裝提示（使用 3 次後顯示）
  - 明確的離線價值主張

## 開發工具鏈

### 核心工具決策
- **Nuxt DevTools**: 內建開發除錯和效能分析
- **Vue DevTools**: Vue 3 狀態和元件檢查
- **UnoCSS Inspector**: CSS 原子類別視覺化
- **PWA DevTools**: PWA 功能測試和驗證

### 程式碼品質
```json
{
  "scripts": {
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts",
    "lint:fix": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "type-check": "vue-tsc --noEmit"
  }
}
```

## 部署策略

### 靜態網站託管
- **決策**：Nuxt 4 generate 模式 + 靜態託管
- **推薦平台**：
  - Vercel：最佳 Nuxt 4 支援
  - Netlify：優秀的 PWA 支援
  - GitHub Pages：免費且可靠
- **CI/CD**：GitHub Actions 自動建置和部署

---

**Nuxt 4 研究結論**：所有技術決策已明確，採用現代化的 Nuxt 4 堆疊確保最佳的開發體驗和效能表現。架構設計支援所有 MVP 需求，並為未來擴展預留空間。