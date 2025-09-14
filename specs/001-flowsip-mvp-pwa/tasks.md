# 任務清單：FlowSip PWA MVP

**輸入**: 設計文件來自 `/specs/001-flowsip-mvp-pwa/`  
**前置需求**: plan.md (必需), research.md, data-model.md, contracts/

## 執行流程概述

```
MVP 模式：僅實作核心計時功能和基礎 PWA 支援
- 重點：快速驗證核心價值（計時和提醒）
- 測試策略：精簡但關鍵的測試覆蓋
- 延後功能：統計圖表、進階設定、全面測試覆蓋
```

## 格式：`[ID] [P?] 描述`

- **[P]**: 可平行執行（不同檔案，無相依性）
- 每個任務包含確切的檔案路徑

## Phase 3.1: 專案設定

- [x] **T001** 建立 Nuxt 4 專案結構 (`nuxt.config.ts`, `package.json`, 目錄結構) ✅
- [x] **T002** 安裝核心相依套件 (Nuxt 4, UnoCSS, @vite-pwa/nuxt, idb, @vueuse/core) ✅
- [x] **T003** [P] 配置開發工具 (ESLint, TypeScript, Vitest, Playwright) ✅

## Phase 3.2: 測試優先 (TDD) ⚠️ 必須在 3.3 前完成

**關鍵：這些測試必須先寫且必須失敗，才能開始實作**

### 契約測試（MVP 精簡版）

- [x] **T004** [P] TimerAPI 契約測試：start/stop 方法 (`tests/contract/timer-api.test.ts`) ✅
- [x] **T005** [P] StorageAPI 契約測試：save/load 基本操作 (`tests/contract/storage-api.test.ts`) ✅

### E2E 測試（MVP 核心場景）

- [x] **T006** [P] E2E：背景計時準確度測試 (`tests/e2e/background-timing.spec.ts`) ✅
- [x] **T007** [P] E2E：離線啟動功能測試 (`tests/e2e/offline-startup.spec.ts`) ✅
- [x] **T008** [P] E2E：通知拒絕後的替代提醒 (`tests/e2e/notification-fallback.spec.ts`) ✅

## Phase 3.3: 核心實作（僅在測試失敗後）

### 型別和資料模型

- [x] **T009** [P] 基礎型別定義 (`types/index.ts` - TimerState, UserSettings, ActivityRecord) ✅
- [x] **T010** [P] 資料驗證工具 (`utils/validation.ts`) ✅

### 核心 Composables (MVP 版)

- [x] **T011** [P] useTimer composable 基礎版 (`composables/useTimer.ts` - 僅 start/stop/狀態) ✅
- [x] **T012** [P] useStorage composable 精簡版 (`composables/useStorage.ts` - localStorage 僅設定) ✅
- [x] **T013** [P] useNotifications 基礎版 (`composables/useNotifications.ts` - 音效+視覺提醒) ✅

### Web Worker 計時系統

- [x] **T014** Timer Web Worker 實作 (`workers/timer-worker.ts` - 精準時間戳計時) ✅

### UI 元件 (極簡版)

- [x] **T015** [P] 計時器顯示元件 (`components/Timer/Display.vue`) ✅
- [x] **T016** [P] 控制按鈕元件 (`components/Timer/Controls.vue`) ✅
- [x] **T017** [P] 模式切換元件 (`components/Timer/ModeSwitch.vue`) ✅

### 頁面

- [x] **T018** 主計時器頁面 (`pages/index.vue` - 整合所有元件) ✅
- [x] **T019** 根應用程式 (`app.vue` - 基本佈局和主題) ✅

## Phase 3.4: PWA 整合

- [x] **T020** PWA 基礎配置 (`nuxt.config.ts` 中的 pwa 設定) ✅
- [x] **T021** [P] PWA 圖示和清單檔案 (`public/icons/`, `public/manifest.json`) ✅
- [x] **T022** [P] 基礎音效檔案 (`public/sounds/`) ✅

## Phase 3.5: 整合和精簡驗證

- [x] **T023** 主頁面整合測試（所有元件協作） ✅
- [x] **T024** 計時精準度驗證（<2秒誤差） ✅
- [x] **T025** PWA 安裝功能驗證 ✅
- [x] **T026** 基本效能檢查（<1s 啟動時間） ✅

## 相依關係圖

```
T001,T002 → T003 → T004-T008（測試） → T009,T010 → T011-T013 → T014-T019 → T020-T022 → T023-T026
     ↓              ↓                    ↓               ↓              ↓              ↓
   設定階段      測試必須失敗         核心 composables   UI + Worker    PWA 設定      整合驗證
```

## 平行執行範例

### Phase 3.2 (測試階段):

```bash
Task: "TimerAPI 契約測試：start/stop 方法在 tests/contract/timer-api.test.ts"
Task: "StorageAPI 契約測試：save/load 基本操作在 tests/contract/storage-api.test.ts"
Task: "E2E：背景計時準確度測試在 tests/e2e/background-timing.spec.ts"
```

### Phase 3.3 (核心實作):

```bash
Task: "基礎型別定義在 types/index.ts"
Task: "資料驗證工具在 utils/validation.ts"
Task: "useTimer composable 在 composables/useTimer.ts"
```

## MVP 任務規則

### 包含（每個任務 ≤ 1小時）:

- ✅ 核心計時功能（喝水30分 + 番茄鐘25分）
- ✅ 基本提醒（音效 + 視覺）
- ✅ 簡單 PWA 支援
- ✅ 關鍵路徑的測試覆蓋

### 排除（移至 backlog）:

- ❌ 完整統計圖表和報告
- ❌ 進階設定頁面
- ❌ 全面單元測試矩陣
- ❌ CI/CD 流水線
- ❌ 視覺回歸測試
- ❌ 效能基準測試

## 驗證清單

- [ ] 所有關鍵 composables 有契約測試
- [ ] 核心用戶流程有 E2E 覆蓋
- [ ] 所有測試在實作前撰寫且失敗
- [ ] 平行任務真正獨立
- [ ] 每個任務指定確切檔案路徑
- [ ] 無任務修改與其他 [P] 任務相同的檔案

## 執行注意事項

1. **嚴格 TDD**: T004-T008 必須先完成且失敗
2. **MVP 專注**: 每個實作任務專注於最小可用功能
3. **快速迭代**: 每個任務完成後立即提交
4. **測試驅動**: 實作以通過測試為目標，不添加額外功能

## 📋 進度追蹤規則

**重要**: 每次執行任務後必須同時更新兩個檔案：

### 1. 更新 tasks.md

將完成的任務標記為完成：

```markdown
- [x] **T00X** 任務名稱 ✅
```

### 2. 更新 progress.md

更新詳細的任務狀態：

```markdown
- [x] **T00X** 任務名稱
  - **狀態**: ✅ 已完成
  - **實際時間**: X小時
  - **完成時間**: 2025-09-XX XX:XX
  - **備註**: 實作要點或遇到的問題
```

**目的**:

- 追蹤實際進度vs預估進度
- 識別時間估算偏差
- 記錄實作過程中的學習和問題
- 為未來類似專案提供參考數據

## 📝 語言規範要求

**所有開發過程均使用正體中文**，包括：

### 任務執行時

- **回答和說明**: AI 助理必須用正體中文回答問題
- **程式碼註解**: 所有註解使用正體中文撰寫
- **變數命名**: 適當使用中文或有意義的英文，附上中文註解
- **提交訊息**: Git commit 訊息使用正體中文

### 文件更新時

- **進度記錄**: progress.md 中的備註使用正體中文
- **問題描述**: 遇到的技術問題用正體中文記錄
- **解決方案**: 解決方法和學習心得用正體中文撰寫

### UI 實作時

- **介面文案**: 所有按鈕、標籤、提示使用正體中文
- **錯誤訊息**: 用戶友善的正體中文錯誤說明
- **通知內容**: 系統通知使用正體中文

**語言品質標準**：

- 使用台灣慣用詞彙和語法
- 保持專業性和一致性
- 技術術語優先中文，必要時標註英文
- 確保使用者體驗完全在地化

**預估總時長**: 20-25 小時（符合 7 天內 MVP 上線目標）

---

# Phase 4: 產品完善與美化任務 (Enhanced MVP)

**基於**: MVP 已完成，現在從 backlog 中實作重要功能以提升產品品質
**目標**: 將基本 MVP 升級為完整可發布的產品

## Phase 4.1: 核心頁面完善

### 統計功能

- [x] **T027** [P] 統計資料 composable (`composables/useStats.ts` - 今日/週統計、趨勢分析) ✅
- [x] **T028** [P] 統計圖表元件 (`components/Stats/Charts.vue` - 使用 Chart.js) ✅
- [x] **T029** [P] 統計卡片元件 (`components/Stats/StatsCard.vue` - 資料展示卡片) ✅
- [x] **T030** 統計頁面實作 (`pages/stats.vue` - 整合所有統計元件) ✅

### 設定功能

- [x] **T031** [P] 設定管理 composable (`composables/useSettings.ts` - 進階設定管理) ✅
- [x] **T032** [P] 主題選擇元件 (`components/Settings/ThemeSelector.vue` - 深色/淺色模式) ✅
- [x] **T033** [P] 音效設定元件 (`components/Settings/SoundSettings.vue` - 音效選擇和測試) ✅
- [x] **T034** [P] 時間設定元件 (`components/Settings/TimeSettings.vue` - 自訂計時時間) ✅
- [x] **T035** 設定頁面實作 (`pages/settings.vue` - 整合所有設定元件) ✅

## Phase 4.2: 視覺與體驗美化

### UI 視覺優化

- [x] **T036** [P] 色彩系統擴充 (`assets/styles/colors.css` - 完整色彩變數系統) ✅
- [x] **T037** [P] 排版系統優化 (`assets/styles/typography.css` - 字型大小、行高系統) ✅
- [x] **T038** [P] 間距系統標準化 (`assets/styles/spacing.css` - 統一間距變數) ✅
- [x] **T039** 全域樣式整合 (`assets/styles/global.css` - 整合所有樣式系統) ✅

### 動畫與互動

- [x] **T040** [P] 計時器動畫優化 (更新 `components/Timer/Display.vue` - 流暢進度動畫) ✅
- [x] **T041** [P] 頁面轉場動畫 (`assets/styles/transitions.css` - 頁面切換效果) ✅
- [x] **T042** [P] 按鈕互動效果 (更新 `components/Timer/Controls.vue` - hover/click 動畫) ✅
- [x] **T043** [P] 載入狀態動畫 (`components/Common/LoadingSpinner.vue` - 優雅載入效果) ✅

### 音效系統

- [x] **T044** [P] 音效管理 composable (`composables/useSounds.ts` - 音效播放和管理) ✅
- [x] **T045** [P] 多種提醒音效 (新增 `public/sounds/` - 水滴、鈴聲、自然音效) ✅
- [x] **T046** [P] 音效測試元件 (`components/Settings/SoundPreview.vue` - 音效試聽) ✅
- [x] **T047** 音效系統整合 (更新通知系統支援多音效選擇) ✅

## Phase 4.3: 主題與個人化

### 主題系統

- [ ] **T048** [P] 主題管理 composable (`composables/useTheme.ts` - 主題切換和持久化)
- [ ] **T049** [P] 深色模式樣式 (`assets/styles/dark-theme.css` - 深色主題變數)
- [ ] **T050** [P] 淺色模式樣式 (`assets/styles/light-theme.css` - 淺色主題變數)
- [ ] **T051** [P] 主題動態切換 (更新所有元件支援主題變數)

### 個人化選項

- [ ] **T052** [P] 字型大小調整 (`components/Settings/FontSize.vue` - 無障礙字型設定)
- [ ] **T053** [P] 動畫效果控制 (`components/Settings/AnimationSettings.vue` - 減少動畫選項)
- [ ] **T054** [P] 通知偏好設定 (`components/Settings/NotificationPrefs.vue` - 通知方式自訂)

## Phase 4.4: PWA 體驗優化

### 安裝與更新

- [ ] **T055** [P] PWA 安裝提示優化 (`components/PWA/InstallPrompt.vue` - 智能安裝提示)
- [ ] **T056** [P] 應用更新通知 (`components/PWA/UpdateNotifier.vue` - 新版本提示)
- [ ] **T057** [P] 離線狀態指示 (`components/Common/OfflineIndicator.vue` - 網路狀態顯示)

### 啟動體驗

- [ ] **T058** [P] 啟動畫面設計 (`public/splash/` - 各尺寸啟動畫面圖片)
- [ ] **T059** [P] 載入進度指示 (更新 `app.vue` - 應用啟動載入狀態)
- [ ] **T060** [P] 首次使用引導 (`components/Onboarding/Welcome.vue` - 功能介紹流程)

## Phase 4.5: 測試基礎設施

### 元件測試

- [ ] **T061** [P] 統計頁面單元測試 (`tests/unit/pages-stats.test.ts`)
- [ ] **T062** [P] 設定頁面單元測試 (`tests/unit/pages-settings.test.ts`)
- [ ] **T063** [P] 主題系統單元測試 (`tests/unit/use-theme.test.ts`)
- [ ] **T064** [P] 音效系統單元測試 (`tests/unit/use-sounds.test.ts`)

### 整合測試

- [ ] **T065** [P] 統計功能 E2E 測試 (`tests/e2e/stats-functionality.spec.ts`)
- [ ] **T066** [P] 設定功能 E2E 測試 (`tests/e2e/settings-functionality.spec.ts`)
- [ ] **T067** [P] 主題切換 E2E 測試 (`tests/e2e/theme-switching.spec.ts`)
- [ ] **T068** [P] 音效系統 E2E 測試 (`tests/e2e/sound-system.spec.ts`)

## Phase 4.6: 效能與品質優化

### 效能優化

- [ ] **T069** [P] 程式碼分割優化 (更新 `nuxt.config.ts` - 動態導入和懶載入)
- [ ] **T070** [P] 圖片資源優化 (壓縮 `public/` 下所有圖片資源)
- [ ] **T071** [P] Service Worker 快取策略 (更新 PWA 配置 - 智能快取)
- [ ] **T072** Bundle 大小分析和優化 (webpack-bundle-analyzer 分析優化)

### 使用者體驗

- [ ] **T073** [P] 無障礙支援檢查 (ARIA 標籤、鍵盤導航、對比度)
- [ ] **T074** [P] 響應式設計完善 (各螢幕尺寸適配檢查)
- [ ] **T075** [P] 錯誤邊界處理 (`components/Common/ErrorBoundary.vue`)
- [ ] **T076** 使用者體驗測試和調校 (流暢度、直覺性評估)

## 相依關係圖 (Phase 4)

```
T027-T030 → T031-T035 → T036-T039 → T040-T043 → T044-T047 → T048-T054 → T055-T060 → T061-T068 → T069-T076
    ↓           ↓           ↓           ↓           ↓           ↓           ↓           ↓           ↓
  統計功能    設定功能    視覺系統    動畫效果    音效系統    主題系統    PWA優化     測試覆蓋    效能品質
```

## 平行執行範例 (Phase 4)

### Phase 4.1 (統計和設定):

```bash
Task: "統計資料 composable 在 composables/useStats.ts"
Task: "統計圖表元件在 components/Stats/Charts.vue"
Task: "設定管理 composable 在 composables/useSettings.ts"
Task: "主題選擇元件在 components/Settings/ThemeSelector.vue"
```

### Phase 4.2 (視覺美化):

```bash
Task: "色彩系統擴充在 assets/styles/colors.css"
Task: "計時器動畫優化更新 components/Timer/Display.vue"
Task: "音效管理 composable 在 composables/useSounds.ts"
Task: "載入狀態動畫在 components/Common/LoadingSpinner.vue"
```

## Enhanced MVP 成功標準

### 功能完整性

- [ ] 用戶可以查看使用統計和趨勢分析
- [ ] 完整的設定頁面支援個人化配置
- [ ] 流暢的主題切換（深色/淺色模式）
- [ ] 多種音效選擇和測試功能

### 視覺與體驗

- [ ] 現代化的視覺設計和一致的設計語言
- [ ] 流暢的動畫效果和互動回饋
- [ ] 響應式設計適配各種螢幕尺寸
- [ ] 優秀的無障礙支援

### 效能與品質

- [ ] Bundle 大小控制在 500KB 以內
- [ ] 首屏載入時間保持 <1 秒
- [ ] PWA 體驗評分達到 90+ (Lighthouse)
- [ ] 測試覆蓋率達到 80%+

**預估時長**: 35-45 小時（Phase 4 增強功能）  
**總計時長**: 55-70 小時（完整產品開發周期）
