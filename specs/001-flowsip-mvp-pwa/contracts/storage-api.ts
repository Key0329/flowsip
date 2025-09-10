/**
 * 儲存 API 契約定義
 * 負責本機資料的持久化和檢索
 */

export interface StorageAPI {
  /**
   * 儲存活動記錄
   * @param record - 活動記錄
   * @returns Promise<void>
   * @throws StorageError 當儲存失敗時
   */
  saveActivity(record: ActivityRecord): Promise<void>;

  /**
   * 批次儲存活動記錄
   * @param records - 活動記錄陣列
   * @returns Promise<number> 成功儲存的記錄數量
   */
  saveActivities(records: ActivityRecord[]): Promise<number>;

  /**
   * 獲取指定日期的活動記錄
   * @param date - 日期字串 (YYYY-MM-DD)
   * @returns Promise<ActivityRecord[]> 該日的所有活動記錄
   */
  getActivitiesByDate(date: string): Promise<ActivityRecord[]>;

  /**
   * 獲取日期範圍內的活動記錄
   * @param startDate - 開始日期 (YYYY-MM-DD)
   * @param endDate - 結束日期 (YYYY-MM-DD)
   * @returns Promise<ActivityRecord[]> 範圍內的所有活動記錄
   */
  getActivitiesByDateRange(startDate: string, endDate: string): Promise<ActivityRecord[]>;

  /**
   * 刪除指定活動記錄
   * @param id - 活動記錄 ID
   * @returns Promise<boolean> 是否成功刪除
   */
  deleteActivity(id: string): Promise<boolean>;

  /**
   * 儲存用戶設定
   * @param settings - 用戶設定物件
   * @returns Promise<void>
   */
  saveSettings(settings: UserSettings): Promise<void>;

  /**
   * 載入用戶設定
   * @returns Promise<UserSettings> 用戶設定，若不存在則返回預設值
   */
  loadSettings(): Promise<UserSettings>;

  /**
   * 儲存每日統計
   * @param stats - 每日統計資料
   * @returns Promise<void>
   */
  saveDailyStats(stats: DailyStats): Promise<void>;

  /**
   * 載入每日統計
   * @param date - 日期字串 (YYYY-MM-DD)
   * @returns Promise<DailyStats | null> 該日統計，若不存在則返回 null
   */
  loadDailyStats(date: string): Promise<DailyStats | null>;

  /**
   * 儲存週統計
   * @param stats - 週統計資料
   * @returns Promise<void>
   */
  saveWeeklyStats(stats: WeeklyStats): Promise<void>;

  /**
   * 載入週統計
   * @param weekStart - 週開始日期 (YYYY-MM-DD)
   * @returns Promise<WeeklyStats | null> 該週統計，若不存在則返回 null
   */
  loadWeeklyStats(weekStart: string): Promise<WeeklyStats | null>;

  /**
   * 匯出所有資料為 CSV 格式
   * @param startDate - 開始日期 (YYYY-MM-DD)，可選
   * @param endDate - 結束日期 (YYYY-MM-DD)，可選
   * @returns Promise<string> CSV 格式字串
   */
  exportToCSV(startDate?: string, endDate?: string): Promise<string>;

  /**
   * 匯出所有資料為 JSON 格式
   * @returns Promise<ExportData> 完整資料匯出
   */
  exportToJSON(): Promise<ExportData>;

  /**
   * 從 JSON 匯入資料
   * @param data - 匯入的資料
   * @param options - 匯入選項
   * @returns Promise<ImportResult> 匯入結果
   */
  importFromJSON(data: ExportData, options: ImportOptions): Promise<ImportResult>;

  /**
   * 清除所有資料
   * @param confirmToken - 確認令牌（防止意外清除）
   * @returns Promise<void>
   * @throws StorageError 當確認令牌不正確時
   */
  clearAllData(confirmToken: string): Promise<void>;

  /**
   * 清除過期資料
   * @param retentionDays - 保留天數
   * @returns Promise<number> 清除的記錄數量
   */
  clearExpiredData(retentionDays: number): Promise<number>;

  /**
   * 獲取儲存使用情況
   * @returns Promise<StorageUsage> 儲存使用統計
   */
  getStorageUsage(): Promise<StorageUsage>;

  /**
   * 驗證資料庫完整性
   * @returns Promise<IntegrityCheck> 完整性檢查結果
   */
  checkIntegrity(): Promise<IntegrityCheck>;
}

/**
 * 儲存錯誤類型
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'QUOTA_EXCEEDED' | 'INVALID_DATA' | 'NOT_FOUND' | 'INVALID_TOKEN' | 'DB_ERROR'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * 資料匯出格式
 */
export interface ExportData {
  version: string;
  exportDate: string;
  activities: ActivityRecord[];
  settings: UserSettings;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
}

/**
 * 匯入選項
 */
export interface ImportOptions {
  overwriteExisting: boolean;   // 是否覆寫現有資料
  mergeSettings: boolean;       // 是否合併設定
  validateData: boolean;        // 是否驗證資料格式
}

/**
 * 匯入結果
 */
export interface ImportResult {
  success: boolean;
  activitiesImported: number;
  settingsImported: boolean;
  statsImported: number;
  errors: string[];
  warnings: string[];
}

/**
 * 儲存使用情況
 */
export interface StorageUsage {
  totalSize: number;           // 總使用空間（位元組）
  activitiesSize: number;      // 活動記錄大小
  statsSize: number;           // 統計資料大小
  settingsSize: number;        // 設定大小
  recordCount: number;         // 總記錄數
  oldestRecord: string;        // 最舊記錄日期
  newestRecord: string;        // 最新記錄日期
}

/**
 * 資料庫完整性檢查結果
 */
export interface IntegrityCheck {
  isValid: boolean;
  issues: IntegrityIssue[];
  recommendations: string[];
}

export interface IntegrityIssue {
  type: 'MISSING_INDEX' | 'CORRUPTED_DATA' | 'ORPHANED_RECORD' | 'INVALID_FORMAT';
  table: string;
  description: string;
  canAutoFix: boolean;
}

/**
 * 資料介面（引用自 data-model.md）
 */
export interface UserSettings {
  waterInterval: number;
  pomodoroFocus: number;
  pomodoroBreak: number;
  volume: number;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-TW' | 'en';
  defaultMode: 'water' | 'pomodoro';
  waterAmount: number;
  dataRetentionDays: number;
  autoStartBreak: boolean;
}

export interface ActivityRecord {
  id: string;
  timestamp: number;
  date: string;
  type: 'water' | 'pomodoro';
  duration: number;
  actualDuration: number;
  completed: boolean;
  interrupted: boolean;
  waterAmount?: number;
  phase?: 'focus' | 'break';
  cycleNumber?: number;
  startTime: string;
  endTime?: string;
  weekday: number;
  manualStop: boolean;
  skipBreak?: boolean;
}

export interface DailyStats {
  date: string;
  waterSessions: number;
  waterAmount: number;
  waterTarget: number;
  waterCompletionRate: number;
  pomodoroSessions: number;
  focusMinutes: number;
  breakMinutes: number;
  pomodoroCompletionRate: number;
  totalSessions: number;
  totalMinutes: number;
  interrupted: number;
  peakHours: number[];
  averageSessionLength: number;
  lastUpdated: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  dailyStats: DailyStats[];
  totalWaterSessions: number;
  totalWaterAmount: number;
  totalPomodoroSessions: number;
  totalFocusMinutes: number;
  waterTrend: 'up' | 'down' | 'stable';
  pomodoroTrend: 'up' | 'down' | 'stable';
  daysWithWaterGoal: number;
  daysWithPomodoroGoal: number;
  lastUpdated: number;
}