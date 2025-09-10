# Phase 1 資料模型：FlowSip PWA

## 核心實體設計

### TimerState（計時器狀態）
計時器的即時狀態和運行資訊。

```typescript
interface TimerState {
  // 基本狀態
  mode: 'water' | 'pomodoro';        // 計時器模式
  duration: number;                  // 總時長（毫秒）
  remaining: number;                 // 剩餘時間（毫秒）
  
  // 時間控制
  startTimestamp: number | null;     // 開始時間戳（毫秒）
  pauseTimestamp: number | null;     // 暫停時間戳（毫秒）
  isRunning: boolean;                // 是否正在運行
  isPaused: boolean;                 // 是否已暫停
  
  // 番茄鐘特有
  phase: 'focus' | 'break' | null;   // 番茄鐘階段（僅番茄鐘模式）
  cycleCount: number;                // 當前週期數（番茄鐘模式）
}
```

**驗證規則**：
- `duration` 必須 > 0
- `remaining` 必須 >= 0 且 <= `duration`
- `isRunning` 為 true 時，`startTimestamp` 不可為 null
- 番茄鐘模式時，`phase` 不可為 null

**狀態轉換**：
- `idle` → `running`：用戶點擊開始
- `running` → `paused`：用戶點擊暫停
- `paused` → `running`：用戶點擊繼續
- `running` → `completed`：時間歸零

### UserSettings（用戶設定）
應用程式的個人化設定。

```typescript
interface UserSettings {
  // 計時間隔設定
  waterInterval: number;             // 喝水間隔（分鐘）
  pomodoroFocus: number;            // 番茄鐘專注時間（分鐘）
  pomodoroBreak: number;            // 番茄鐘休息時間（分鐘）
  
  // 提醒設定
  volume: number;                   // 音量 (0-100)
  soundEnabled: boolean;            // 是否啟用音效
  notificationEnabled: boolean;     // 是否啟用系統通知
  vibrationEnabled: boolean;        // 是否啟用振動（行動端）
  
  // 介面設定
  theme: 'light' | 'dark' | 'auto'; // 主題模式
  language: 'zh-TW' | 'en';         // 語言設定
  
  // 預設值設定
  defaultMode: 'water' | 'pomodoro'; // 預設計時器模式
  waterAmount: number;              // 每次喝水毫升數（預設 200ml）
  
  // 系統設定
  dataRetentionDays: number;        // 資料保留天數（預設 90 天）
  autoStartBreak: boolean;          // 番茄鐘是否自動開始休息
}
```

**預設值**：
```typescript
const DEFAULT_SETTINGS: UserSettings = {
  waterInterval: 30,
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  volume: 70,
  soundEnabled: true,
  notificationEnabled: false, // 需用戶授權
  vibrationEnabled: true,
  theme: 'auto',
  language: 'zh-TW',
  defaultMode: 'water',
  waterAmount: 200,
  dataRetentionDays: 90,
  autoStartBreak: true
};
```

**驗證規則**：
- 所有時間間隔必須 > 0
- `volume` 範圍 0-100
- `waterAmount` 必須 > 0
- `dataRetentionDays` 必須 >= 1

### ActivityRecord（活動記錄）
用戶的計時活動歷史記錄。

```typescript
interface ActivityRecord {
  // 基本資訊
  id: string;                       // 唯一識別碼（UUID）
  timestamp: number;                // 記錄時間戳（毫秒）
  date: string;                     // 日期字串 (YYYY-MM-DD)
  
  // 活動詳情
  type: 'water' | 'pomodoro';       // 活動類型
  duration: number;                 // 計劃時長（毫秒）
  actualDuration: number;           // 實際時長（毫秒）
  completed: boolean;               // 是否完成
  interrupted: boolean;             // 是否被中斷
  
  // 類型特定資料
  waterAmount?: number;             // 喝水量（毫升）- 喝水記錄特有
  phase?: 'focus' | 'break';        // 番茄鐘階段 - 番茄鐘記錄特有
  cycleNumber?: number;             // 番茄鐘週期編號
  
  // 上下文資訊
  startTime: string;                // 開始時間 (HH:MM)
  endTime?: string;                 // 結束時間 (HH:MM)
  weekday: number;                  // 星期幾 (0=週日, 1=週一...)
  
  // 使用者行為
  manualStop: boolean;              // 是否手動停止
  skipBreak?: boolean;              // 是否跳過休息（番茄鐘特有）
}
```

**索引設計**（IndexedDB）：
- 主鍵：`timestamp`
- 複合索引：`[date, type]` - 用於日期範圍查詢
- 索引：`completed` - 用於統計查詢

**資料保留策略**：
- 根據 `dataRetentionDays` 設定自動清理舊記錄
- 保留統計摘要，刪除詳細記錄

### StatsData（統計資料）
彙總的統計資料，用於提升查詢效能。

```typescript
interface DailyStats {
  date: string;                     // 日期 (YYYY-MM-DD)
  
  // 喝水統計
  waterSessions: number;            // 喝水次數
  waterAmount: number;              // 總喝水量（毫升）
  waterTarget: number;              // 目標喝水量
  waterCompletionRate: number;      // 完成率 (0-1)
  
  // 番茄鐘統計
  pomodoroSessions: number;         // 番茄鐘次數
  focusMinutes: number;             // 專注時間（分鐘）
  breakMinutes: number;             // 休息時間（分鐘）
  pomodoroCompletionRate: number;   // 完成率 (0-1)
  
  // 綜合統計
  totalSessions: number;            // 總計時次數
  totalMinutes: number;             // 總計時時間（分鐘）
  interrupted: number;              // 中斷次數
  
  // 時間分佈
  peakHours: number[];              // 使用高峰時段 (0-23)
  averageSessionLength: number;     // 平均計時時長（分鐘）
  
  // 更新時間
  lastUpdated: number;              // 最後更新時間戳
}

interface WeeklyStats {
  weekStart: string;                // 週開始日期 (YYYY-MM-DD)
  weekEnd: string;                  // 週結束日期 (YYYY-MM-DD)
  
  // 彙總統計
  dailyStats: DailyStats[];         // 每日統計陣列（7天）
  
  // 週統計
  totalWaterSessions: number;
  totalWaterAmount: number;
  totalPomodoroSessions: number;
  totalFocusMinutes: number;
  
  // 趨勢分析
  waterTrend: 'up' | 'down' | 'stable';     // 喝水趨勢
  pomodoroTrend: 'up' | 'down' | 'stable';  // 番茄鐘趨勢
  
  // 目標達成
  daysWithWaterGoal: number;        // 達到喝水目標的天數
  daysWithPomodoroGoal: number;     // 達到番茄鐘目標的天數
  
  lastUpdated: number;
}
```

## 實體關係

### 主要關係
```
UserSettings (1) ←→ (∞) ActivityRecord
- 設定影響活動記錄的產生和預設值

ActivityRecord (∞) ←→ (1) DailyStats
- 活動記錄彙總產生每日統計

DailyStats (7) ←→ (1) WeeklyStats
- 7天的日統計彙總產生週統計

TimerState (1) ←→ (1) UserSettings
- 計時器狀態參考用戶設定
```

### 資料流向
```
用戶操作 → TimerState 更新 → ActivityRecord 產生 → Stats 重新計算
```

## 本機儲存策略

### IndexedDB 物件存放區設計
```javascript
// 主要資料庫設計
const DB_NAME = 'flowsip_db';
const DB_VERSION = 1;

const stores = {
  activities: {
    keyPath: 'timestamp',
    indexes: [
      { name: 'date', keyPath: 'date' },
      { name: 'date_type', keyPath: ['date', 'type'] },
      { name: 'completed', keyPath: 'completed' }
    ]
  },
  dailyStats: {
    keyPath: 'date',
    indexes: []
  },
  weeklyStats: {
    keyPath: 'weekStart',
    indexes: []
  }
};
```

### localStorage 使用
```javascript
// 輕量級設定儲存
const STORAGE_KEYS = {
  USER_SETTINGS: 'flowsip_settings',
  TIMER_STATE: 'flowsip_timer_state',    // 計時器狀態持久化
  LAST_ACTIVE: 'flowsip_last_active'     // 最後活躍時間
};
```

### 資料同步策略
1. **即時更新**：TimerState 變化立即同步到 localStorage
2. **批次寫入**：ActivityRecord 累積一定數量後批次寫入 IndexedDB
3. **統計更新**：每日午夜和應用程式啟動時重新計算統計

## 離線資料處理

### 資料優先級
1. **Critical**：TimerState, UserSettings（必須可用）
2. **Important**：今日 ActivityRecord（影響當日統計）
3. **Nice-to-have**：歷史 ActivityRecord, WeeklyStats

### 衝突解決
- **時間戳優先**：以最新時間戳為準
- **合併策略**：設定變更以最後修改為準
- **資料校驗**：載入時驗證資料完整性

### 資料匯出格式（CSV）
```csv
日期,類型,開始時間,結束時間,時長(分鐘),是否完成,水量(ml),備註
2025-09-10,喝水,09:30,09:30,30,是,200,
2025-09-10,番茄鐘,10:00,10:25,25,是,,專注階段
```

---

**資料模型結論**：所有實體和關係已明確定義，支援離線優先架構和效能最佳化查詢。資料結構設計考量了未來擴展性和版本遷移需求。