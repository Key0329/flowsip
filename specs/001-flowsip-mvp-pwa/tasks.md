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

- [ ] **T001** 建立 Nuxt 4 專案結構 (`nuxt.config.ts`, `package.json`, 目錄結構)
- [ ] **T002** 安裝核心相依套件 (Nuxt 4, UnoCSS, @vite-pwa/nuxt, idb, @vueuse/core)
- [ ] **T003** [P] 配置開發工具 (ESLint, TypeScript, Vitest, Playwright)

## Phase 3.2: 測試優先 (TDD) ⚠️ 必須在 3.3 前完成
**關鍵：這些測試必須先寫且必須失敗，才能開始實作**

### 契約測試（MVP 精簡版）
- [ ] **T004** [P] TimerAPI 契約測試：start/stop 方法 (`tests/contract/timer-api.test.ts`)
- [ ] **T005** [P] StorageAPI 契約測試：save/load 基本操作 (`tests/contract/storage-api.test.ts`)

### E2E 測試（MVP 核心場景）
- [ ] **T006** [P] E2E：背景計時準確度測試 (`tests/e2e/background-timing.spec.ts`)
- [ ] **T007** [P] E2E：離線啟動功能測試 (`tests/e2e/offline-startup.spec.ts`) 
- [ ] **T008** [P] E2E：通知拒絕後的替代提醒 (`tests/e2e/notification-fallback.spec.ts`)

## Phase 3.3: 核心實作（僅在測試失敗後）

### 型別和資料模型
- [ ] **T009** [P] 基礎型別定義 (`types/index.ts` - TimerState, UserSettings, ActivityRecord)
- [ ] **T010** [P] 資料驗證工具 (`utils/validation.ts`)

### 核心 Composables (MVP 版)
- [ ] **T011** [P] useTimer composable 基礎版 (`composables/useTimer.ts` - 僅 start/stop/狀態)
- [ ] **T012** [P] useStorage composable 精簡版 (`composables/useStorage.ts` - localStorage 僅設定)
- [ ] **T013** [P] useNotifications 基礎版 (`composables/useNotifications.ts` - 音效+視覺提醒)

### Web Worker 計時系統
- [ ] **T014** Timer Web Worker 實作 (`workers/timer-worker.ts` - 精準時間戳計時)

### UI 元件 (極簡版)
- [ ] **T015** [P] 計時器顯示元件 (`components/Timer/Display.vue`)
- [ ] **T016** [P] 控制按鈕元件 (`components/Timer/Controls.vue`)
- [ ] **T017** [P] 模式切換元件 (`components/Timer/ModeSwitch.vue`)

### 頁面
- [ ] **T018** 主計時器頁面 (`pages/index.vue` - 整合所有元件)
- [ ] **T019** 根應用程式 (`app.vue` - 基本佈局和主題)

## Phase 3.4: PWA 整合

- [ ] **T020** PWA 基礎配置 (`nuxt.config.ts` 中的 pwa 設定)
- [ ] **T021** [P] PWA 圖示和清單檔案 (`public/icons/`, `public/manifest.json`)
- [ ] **T022** [P] 基礎音效檔案 (`public/sounds/`)

## Phase 3.5: 整合和精簡驗證

- [ ] **T023** 主頁面整合測試（所有元件協作）
- [ ] **T024** 計時精準度驗證（<2秒誤差）
- [ ] **T025** PWA 安裝功能驗證
- [ ] **T026** 基本效能檢查（<1s 啟動時間）

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