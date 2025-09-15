# 實作規劃：FlowSip 喝水提醒與番茄鐘 MVP

**分支**: `001-flowsip-mvp-pwa` | **日期**: 2025-09-10 | **規格**: [spec.md](spec.md)
**輸入**: 功能規格來自 `/specs/001-flowsip-mvp-pwa/spec.md`

## 執行流程 (/plan 指令範圍)
```
1. 載入功能規格 ✓
   → 已載入規格文件並分析需求
2. 填寫技術背景 ✓
   → 偵測專案類型：單一前端 Nuxt 4 PWA 應用程式
   → 結構決策：Nuxt 4 單一應用結構
3. 評估憲章檢查 ✓
   → 無違反事項
4. 執行 Phase 0 → research.md ✓
5. 執行 Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✓
6. 重新評估憲章檢查 ✓
   → 無新違反事項
7. 規劃 Phase 2 → 描述任務生成方法（不建立 tasks.md）✓
8. 停止 - 準備進行 /tasks 指令
```

## 摘要
FlowSip 是一個基於 Nuxt 4 的離線優先極簡 PWA 計時器應用程式，提供喝水提醒和番茄鐘功能。採用 Nuxt 4 單一應用架構，使用 UnoCSS 樣式系統，@vite-pwa/nuxt 實現 PWA 功能，Web Worker 實現精準背景計時，以及 IndexedDB 和 localStorage 進行本機資料儲存。

## 技術背景
**語言/版本**: TypeScript 5.x, Node.js 20+, Nuxt 4  
**主要相依套件**: Nuxt 4, UnoCSS, @vite-pwa/nuxt, idb, Web Workers  
**儲存**: IndexedDB (idb 程式庫) + localStorage  
**測試**: @nuxt/test-utils + Vitest + Playwright  
**目標平台**: 現代瀏覽器 (Chrome 100+, Safari 15+, Firefox 100+), 支援 PWA 安裝  
**專案類型**: 單一前端專案 - Nuxt 4 PWA 應用  
**效能目標**: 啟動時間 <1s, 計時誤差 <2s, PWA 安裝率 ≥12%  
**限制**: 離線優先, 無伺服器依賴, 行動端最佳化  
**規模/範圍**: ~8 個頁面, 支援 10k+ 本機記錄, 7天內 MVP

**架構調整原因**:
- Nuxt 4：提供完整的 SSG 能力，優化 SEO 和初始載入
- UnoCSS：避免 Tailwind 4/Vite 相容性問題，更好的效能
- @vite-pwa/nuxt：Nuxt 官方生態最穩定的 PWA 解決方案
- Web Worker：Vite 自動處理打包，確保背景計時精準
- idb：現代化 IndexedDB 包裝器，更好的 TypeScript 支援

## 憲章檢查
*門檻：Phase 0 研究前必須通過。Phase 1 設計後重新檢查。*

**簡化性**:
- 專案數量: 1 (nuxt-pwa-app) ✓
- 直接使用框架? 是 (Nuxt 4 + 原生 Web API) ✓
- 單一資料模型? 是 (統一的 ActivityRecord) ✓
- 避免模式? 是 (使用 Nuxt 約定，無不必要抽象) ✓

**架構**:
- 每個功能都是程式庫? 是 (composables + utils 模式) ✓
- 程式庫清單: [useTimer + 計時邏輯], [useStorage + 資料持久化], [useNotifications + 提醒系統]
- 每個程式庫的 CLI: timer.mjs --help, storage.mjs --export, notifications.mjs --test
- 程式庫文件: 規劃 llms.txt 格式 ✓

**測試 (非協商)**:
- RED-GREEN-重構循環? 是 ✓
- Git 提交顯示實作前測試? 是 ✓
- 順序：契約→整合→E2E→單元? 是 ✓
- 使用真實依賴? 是 (真實瀏覽器 API + Nuxt 環境) ✓
- 整合測試涵蓋: 新 composables、契約變更、共用型別? 是 ✓

**可觀測性**:
- 包含結構化日誌? 是 (console + Nuxt DevTools) ✓
- 前端日誌? 純前端應用，使用 Nuxt DevTools ✓
- 錯誤上下文充足? 是 ✓

**版本控制**:
- 分配版本號? 1.0.0 (MAJOR.MINOR.BUILD) ✓
- BUILD 每次變更遞增? 是 ✓
- 處理重大變更? 是 (遷移計畫) ✓

## 專案結構

### 文件 (此功能)
```
specs/001-flowsip-mvp-pwa/
├── plan.md              # 此檔案 (/plan 指令輸出)
├── research.md          # Phase 0 輸出 (/plan 指令)
├── data-model.md        # Phase 1 輸出 (/plan 指令)
├── quickstart.md        # Phase 1 輸出 (/plan 指令)
├── contracts/           # Phase 1 輸出 (/plan 指令)
└── tasks.md             # Phase 2 輸出 (/tasks 指令 - 不由 /plan 建立)
```

### Nuxt 4 專案結構 (儲存庫根目錄)
```
# Nuxt 4 專案結構
nuxt.config.ts           # Nuxt 配置
app.vue                  # 根元件
pwa-assets.config.ts     # PWA 資產配置

pages/
├── index.vue            # 主計時器頁面
├── stats.vue            # 統計頁面
├── settings.vue         # 設定頁面
└── about.vue            # 關於頁面

components/
├── Timer/
│   ├── Display.vue      # 計時器顯示
│   ├── Controls.vue     # 控制按鈕
│   └── ModeSwitch.vue   # 模式切換
├── Stats/
│   ├── DailyChart.vue   # 每日圖表
│   ├── WeeklyChart.vue  # 週統計
│   └── Summary.vue      # 統計摘要
├── Settings/
│   ├── TimerSettings.vue # 計時器設定
│   ├── NotificationSettings.vue # 通知設定
│   └── ThemeSettings.vue # 主題設定
└── Common/
    ├── Header.vue       # 頁面標頭
    ├── Navigation.vue   # 導航
    └── LoadingSpinner.vue # 載入指示器

composables/
├── useTimer.ts          # 計時器邏輯
├── useStorage.ts        # 儲存管理
├── useNotifications.ts  # 通知管理
├── useStats.ts          # 統計分析
├── useSettings.ts       # 設定管理
├── useTheme.ts          # 主題管理
└── usePWA.ts           # PWA 功能

utils/
├── timer.ts            # 計時器工具函式
├── storage.ts          # 儲存工具函式
├── notifications.ts    # 通知工具函式
├── stats.ts           # 統計工具函式
├── validation.ts      # 資料驗證
└── constants.ts       # 常數定義

types/
├── timer.ts           # 計時器型別定義
├── storage.ts         # 儲存型別定義
├── notifications.ts   # 通知型別定義
├── stats.ts          # 統計型別定義
└── settings.ts       # 設定型別定義

workers/
└── timer-worker.ts    # Web Worker 計時邏輯

tests/
├── unit/              # Vitest 單元測試
├── integration/       # Nuxt 整合測試
└── e2e/              # Playwright E2E 測試

public/
├── sw.js             # Service Worker (自動生成)
├── manifest.json     # PWA 清單 (自動生成)
├── icons/           # PWA 圖示
└── sounds/          # 提醒音效

assets/
└── css/
    └── main.css     # 全域樣式

# 配置檔案
package.json
tsconfig.json
uno.config.ts        # UnoCSS 配置
playwright.config.ts # Playwright 配置
vitest.config.ts    # Vitest 配置
```

**結構決策**: Nuxt 4 單一應用結構 - 現代化前端架構

## Phase 0: 大綱與研究

### Nuxt 4 技術堆疊研究
1. **Nuxt 4 最佳實務**: SSG 模式、自動導入、檔案路由系統
2. **UnoCSS 整合**: 原子化 CSS、效能最佳化、主題系統
3. **@vite-pwa/nuxt**: 自動 PWA 配置、SW 快取策略、離線支援
4. **Web Worker 計時**: Vite 自動打包、時間戳校正、背景精準度
5. **idb + localStorage**: 混合儲存策略、效能最佳化、資料同步

### 研究發現 (已更新)
- **決策**: Nuxt 4 SSG + UnoCSS + @vite-pwa/nuxt + Web Worker 計時
- **理由**: 
  - Nuxt 4：完整的現代化框架，優秀的 DX 和效能
  - UnoCSS：避免 Tailwind 相容性問題，更好的樹搖和效能
  - @vite-pwa/nuxt：官方推薦，整合度最高
  - Web Worker：Vite 原生支援，確保計時精準度
- **替代方案**: 
  - 純 Vue 3 + Vite (缺少 SSG 和約定)
  - Tailwind CSS (相容性問題)
  - 手寫 PWA 配置 (複雜度高)

## Phase 1: 設計與契約

### Nuxt 4 資料層設計
基於 Nuxt 4 的 composables 模式，重新設計資料管理：

- **useTimer**: 計時器狀態管理和 Web Worker 通信
- **useStorage**: IndexedDB 和 localStorage 的統一介面
- **useNotifications**: 系統通知、音效和視覺提醒
- **useStats**: 資料統計和趨勢分析

### 契約介面調整 (基於 Composables)
```typescript
// 主要 Composables 契約
export const useTimer: () => TimerComposable
export const useStorage: () => StorageComposable  
export const useNotifications: () => NotificationComposable
export const useStats: () => StatsComposable
```

### Nuxt 4 測試策略
- **單元測試**: Vitest + @nuxt/test-utils
- **整合測試**: Nuxt Test Environment 
- **E2E 測試**: Playwright + PWA 測試

**輸出**: 已更新 research.md, data-model.md, contracts/, quickstart.md, CLAUDE.md

## Phase 2: 任務規劃方法
*此部分描述 /tasks 指令將執行的內容 - 不在 /plan 期間執行*

**Nuxt 4 任務生成策略**:
- 環境設定：Nuxt 4 + UnoCSS + @vite-pwa/nuxt 配置
- Composables 開發：每個核心功能的 composable [P]
- 頁面開發：基於 Nuxt 檔案路由的頁面 [P]
- 元件開發：Vue 3 Composition API 元件 [P]
- Web Worker：計時 Worker 實作
- PWA 設定：圖示、清單、SW 配置

**Nuxt 4 排序策略**:
- TDD 順序：測試在實作前
- Nuxt 依賴順序：Types → Utils → Composables → Components → Pages
- 標記 [P] 表示可平行執行

**預估輸出**: 30-35 個編號任務，包含：
1. Nuxt 4 環境設定和配置
2. 型別和工具函式
3. Core Composables 實作
4. Web Worker 計時系統
5. Vue 元件開發
6. PWA 功能整合
7. 測試和驗證

## Phase 3+: 未來實作
*這些階段超出 /plan 指令範圍*

**Phase 3**: 任務執行 (/tasks 指令建立 tasks.md)  
**Phase 4**: 實作 (執行 tasks.md，遵循 Nuxt 4 最佳實務)  
**Phase 5**: 驗證 (執行測試、quickstart.md、PWA 效能驗證)

## 複雜度追蹤
*僅在憲章檢查有必須合理化的違反時填寫*

無違反事項需要合理化。Nuxt 4 架構符合所有憲章要求。

## 進度追蹤

**階段狀態**:
- [x] Phase 0: 研究完成 (/plan 指令) - 已調整為 Nuxt 4 堆疊
- [x] Phase 1: 設計完成 (/plan 指令) - 已調整為 Composables 架構
- [x] Phase 2: 任務規劃完成 (/plan 指令 - 僅描述方法)
- [x] Phase 3: 任務生成 (/tasks 指令) - 59 個任務完整定義
- [x] Phase 4: 實作完成 - 所有 MVP + 增強功能實作完畢
- [x] Phase 5: 驗證通過 - 測試、文件、PWA 效能驗證完成

**門檻狀態**:
- [x] 初始憲章檢查: 通過
- [x] 設計後憲章檢查: 通過 - Nuxt 4 架構符合要求
- [x] 所有需要釐清事項已解決
- [x] 複雜度偏差已記錄

---
*基於憲章 v2.1.1 - 參見 `/memory/constitution.md`*