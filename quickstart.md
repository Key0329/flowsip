# FlowSip 快速開始指南

FlowSip 是一個結合喝水提醒與番茄鐘技術的 PWA 應用，幫助您維持健康的工作習慣。

## 🚀 立即開始

### 1. 訪問應用
- **開發模式**: `http://localhost:3000` (執行 `npm run dev` 後)
- **生產模式**: 建置後透過 `npm run preview`

### 2. 首次使用
1. **允許通知權限**: 點擊瀏覽器通知提示中的「允許」
2. **完成新手導覽**: 跟隨 5 步驟導覽了解功能
3. **安裝 PWA**: 點擊安裝提示將應用新增到主畫面

## ⚡ 核心功能

### 🍅 番茄鐘計時
1. 點擊主頁面的「開始」按鈕
2. 預設 25 分鐘專注時間
3. 完成後自動進入 5 分鐘休息時間
4. 支援暫停、停止、重置功能

### 💧 喝水提醒
1. 計時器運行時自動啟用喝水提醒
2. 預設每 30 分鐘提醒一次
3. 支援瀏覽器通知 + 音效提醒
4. 可在設定中調整提醒間隔

### 📊 統計分析
1. 進入「統計」頁面查看專注數據
2. 支援每日、週、月統計視圖
3. 圖表顯示專注時間趨勢
4. 追蹤完成的番茄鐘和喝水次數

### ⚙️ 個人化設定
1. **主題切換**: 明亮/暗色主題，支援系統自動切換
2. **音效設定**: 調整音量、選擇提醒音效
3. **通知偏好**: 自訂通知方式和間隔
4. **字型大小**: 調整介面文字大小
5. **動畫效果**: 開啟/關閉過渡動畫

## 🛠️ 開發指南

### 專案結構
```
flowsip/
├── pages/              # Nuxt 4 檔案路由
│   ├── index.vue      # 主計時器頁面  
│   ├── stats.vue      # 統計頁面
│   ├── settings.vue   # 設定頁面
│   └── about.vue      # 關於頁面
├── components/         # Vue 元件
│   ├── Timer/         # 計時器相關元件
│   ├── Stats/         # 統計圖表元件  
│   ├── Settings/      # 設定介面元件
│   ├── PWA/           # PWA 功能元件
│   └── Common/        # 共用元件
├── composables/       # Nuxt 4 Composables
│   ├── useTimer.ts    # 計時器邏輯
│   ├── useStorage.ts  # 資料儲存
│   ├── useNotifications.ts # 通知管理
│   ├── useSettings.ts # 設定管理
│   ├── useStats.ts    # 統計分析
│   ├── useTheme.ts    # 主題管理
│   └── useSounds.ts   # 音效管理
├── workers/           # Web Workers
│   └── timer-worker.ts # 背景計時器
├── types/             # TypeScript 型別定義
├── utils/             # 工具函式
└── tests/             # 測試檔案
```

### 常用指令
```bash
# 開發
npm run dev              # 啟動開發伺服器
npm run build            # 建置專案
npm run generate         # 生成靜態網站
npm run preview          # 預覽建置結果

# 測試
npm run test             # 執行 Vitest 單元測試
npm run test:e2e         # 執行 Playwright E2E 測試
npm run type-check       # TypeScript 型別檢查

# 程式碼品質
npm run lint             # ESLint 檢查
npm run lint:fix         # 自動修復 ESLint 錯誤
```

### 技術架構
- **框架**: Nuxt 4 + Vue 3 Composition API
- **樣式**: UnoCSS 原子化 CSS
- **PWA**: @vite-pwa/nuxt 自動配置
- **儲存**: IndexedDB (idb) + localStorage
- **計時**: Web Workers 背景精準計時
- **測試**: Vitest (單元) + Playwright (E2E)
- **型別**: TypeScript 嚴格模式

## 🔧 故障排除

### 通知無法正常工作
1. 檢查瀏覽器通知權限設定
2. 確認瀏覽器支援 Notification API
3. 在 HTTPS 環境下使用 (PWA 要求)

### 計時器不準確
1. 確認 Web Worker 正常載入
2. 檢查瀏覽器背景執行權限
3. 避免瀏覽器進入節能模式

### PWA 安裝問題
1. 確認在 HTTPS 環境下訪問
2. 檢查 Service Worker 註冊狀態
3. 清除瀏覽器快取後重試

### 資料遺失問題
1. 檢查 IndexedDB 支援狀態
2. 確認瀏覽器儲存權限
3. 在隱身模式下資料不會持久化

## 📱 PWA 功能

### 安裝到主畫面
1. Chrome: 點擊網址列的安裝圖示
2. Safari: 分享 → 新增到主畫面
3. Edge: 設定 → 應用程式 → 安裝此網站

### 離線使用
- 應用核心功能支援完全離線使用
- 計時器、設定、本地資料都可離線訪問
- 網路恢復後自動同步雲端功能

### 背景執行
- PWA 支援背景計時功能
- 即使切換應用程式計時仍持續
- 完成時發送系統通知

## 🎯 使用建議

### 最佳實務
1. **定期休息**: 遵循番茄鐘 25/5 分鐘節奏
2. **保持水分**: 響應喝水提醒，維持健康
3. **追蹤進度**: 定期查看統計數據分析習慣
4. **個人化設定**: 調整音效、主題符合個人偏好

### 工作流程建議
1. 早上設定當日目標番茄鐘數量
2. 每個番茄鐘專注單一任務
3. 休息時間離開螢幕活動身體
4. 晚上回顧統計數據調整策略

## 🤝 支援與回饋

- **問題回報**: [GitHub Issues](https://github.com/your-repo/flowsip/issues)
- **功能建議**: [GitHub Discussions](https://github.com/your-repo/flowsip/discussions)
- **開發文件**: 詳見 `CLAUDE.md` 開發指南

---

**FlowSip v1.0.0** - 讓工作與健康完美結合 🍅💧