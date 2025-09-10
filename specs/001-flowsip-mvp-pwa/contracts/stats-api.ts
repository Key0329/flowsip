/**
 * 統計 API 契約定義
 * 負責資料統計、分析和報告生成
 */

export interface StatsAPI {
  /**
   * 獲取今日統計
   * @returns Promise<DailyStats> 今日統計資料
   */
  getTodayStats(): Promise<DailyStats>;

  /**
   * 獲取指定日期統計
   * @param date - 日期字串 (YYYY-MM-DD)
   * @returns Promise<DailyStats | null> 該日統計，若無資料則返回 null
   */
  getDailyStats(date: string): Promise<DailyStats | null>;

  /**
   * 獲取本週統計
   * @returns Promise<WeeklyStats> 本週統計資料（週一到週日）
   */
  getThisWeekStats(): Promise<WeeklyStats>;

  /**
   * 獲取指定週統計
   * @param weekStart - 週開始日期 (YYYY-MM-DD，週一)
   * @returns Promise<WeeklyStats | null> 該週統計，若無資料則返回 null
   */
  getWeeklyStats(weekStart: string): Promise<WeeklyStats | null>;

  /**
   * 獲取月統計
   * @param year - 年份
   * @param month - 月份 (1-12)
   * @returns Promise<MonthlyStats> 該月統計資料
   */
  getMonthlyStats(year: number, month: number): Promise<MonthlyStats>;

  /**
   * 重新計算並更新統計資料
   * @param date - 指定日期，若不提供則更新今日
   * @returns Promise<void>
   */
  recalculateStats(date?: string): Promise<void>;

  /**
   * 批次重新計算統計資料
   * @param startDate - 開始日期 (YYYY-MM-DD)
   * @param endDate - 結束日期 (YYYY-MM-DD)
   * @returns Promise<number> 重新計算的天數
   */
  recalculateStatsRange(startDate: string, endDate: string): Promise<number>;

  /**
   * 獲取成就和里程碑
   * @returns Promise<Achievement[]> 已達成的成就列表
   */
  getAchievements(): Promise<Achievement[]>;

  /**
   * 獲取趨勢分析
   * @param period - 分析期間 (7, 14, 30 天)
   * @returns Promise<TrendAnalysis> 趨勢分析結果
   */
  getTrendAnalysis(period: 7 | 14 | 30): Promise<TrendAnalysis>;

  /**
   * 獲取使用模式分析
   * @param period - 分析期間 (7, 14, 30 天)
   * @returns Promise<UsagePattern> 使用模式分析
   */
  getUsagePattern(period: 7 | 14 | 30): Promise<UsagePattern>;

  /**
   * 生成統計報告
   * @param options - 報告選項
   * @returns Promise<StatisticsReport> 統計報告
   */
  generateReport(options: ReportOptions): Promise<StatisticsReport>;

  /**
   * 獲取目標達成情況
   * @param date - 指定日期，若不提供則為今日
   * @returns Promise<GoalProgress> 目標進度
   */
  getGoalProgress(date?: string): Promise<GoalProgress>;

  /**
   * 設定個人目標
   * @param goals - 目標設定
   * @returns Promise<void>
   */
  setGoals(goals: PersonalGoals): Promise<void>;

  /**
   * 獲取個人目標設定
   * @returns Promise<PersonalGoals> 目前目標設定
   */
  getGoals(): Promise<PersonalGoals>;

  /**
   * 獲取統計摘要（用於儀表板）
   * @returns Promise<StatsSummary> 統計摘要
   */
  getSummary(): Promise<StatsSummary>;

  /**
   * 訂閱統計更新事件
   * @param callback - 更新回調函式
   * @returns 取消訂閱函式
   */
  onStatsUpdated(callback: (updatedDate: string) => void): () => void;
}

/**
 * 統計錯誤類型
 */
export class StatsError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_DATE' | 'NO_DATA' | 'CALCULATION_ERROR' | 'INVALID_PERIOD'
  ) {
    super(message);
    this.name = 'StatsError';
  }
}

/**
 * 月統計資料
 */
export interface MonthlyStats {
  year: number;
  month: number;               // 1-12
  monthName: string;           // e.g., "2025年9月"
  
  // 基本統計
  totalWaterSessions: number;
  totalWaterAmount: number;
  totalPomodoroSessions: number;
  totalFocusMinutes: number;
  
  // 每日平均
  avgWaterSessions: number;
  avgWaterAmount: number;
  avgPomodoroSessions: number;
  avgFocusMinutes: number;
  
  // 目標達成
  daysWithWaterGoal: number;
  daysWithPomodoroGoal: number;
  goalAchievementRate: number; // 0-1
  
  // 週統計陣列（最多5週）
  weeklyStats: WeeklyStats[];
  
  // 最佳表現
  bestDay: {
    date: string;
    waterSessions: number;
    pomodoroSessions: number;
  };
  
  lastUpdated: number;
}

/**
 * 成就系統
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'water' | 'pomodoro' | 'consistency' | 'milestone';
  
  // 成就條件
  condition: AchievementCondition;
  
  // 成就狀態
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;        // 0-1，當前進度
  
  // 獎勵
  points: number;          // 成就點數
  badge?: string;          // 徽章圖示
}

export interface AchievementCondition {
  type: 'consecutive_days' | 'total_sessions' | 'single_day' | 'weekly_goal';
  target: number;
  timeframe?: number;      // 天數，若適用
  activityType?: 'water' | 'pomodoro';
}

/**
 * 趨勢分析
 */
export interface TrendAnalysis {
  period: number;          // 分析天數
  startDate: string;
  endDate: string;
  
  // 喝水趨勢
  waterTrend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;      // 0-1，趨勢強度
    averageChange: number; // 平均每日變化
    confidence: number;    // 0-1，趨勢可信度
  };
  
  // 番茄鐘趨勢
  pomodoroTrend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
    averageChange: number;
    confidence: number;
  };
  
  // 整體表現趨勢
  overallTrend: 'improving' | 'declining' | 'stable';
  
  // 預測（下週預期表現）
  prediction: {
    expectedWaterSessions: number;
    expectedPomodoroSessions: number;
    confidence: number;
  };
  
  // 建議
  recommendations: string[];
}

/**
 * 使用模式分析
 */
export interface UsagePattern {
  period: number;
  
  // 時間模式
  peakHours: {
    hour: number;          // 0-23
    sessions: number;
    percentage: number;    // 該時段佔總使用的百分比
  }[];
  
  // 星期模式
  weekdayPattern: {
    dayOfWeek: number;     // 0=週日, 1=週一...
    dayName: string;
    sessions: number;
    avgSessions: number;
  }[];
  
  // 計時器偏好
  preferredMode: 'water' | 'pomodoro';
  modeDistribution: {
    water: number;         // 百分比
    pomodoro: number;      // 百分比
  };
  
  // 會話模式
  sessionDuration: {
    average: number;       // 平均時長（分鐘）
    median: number;        // 中位數時長
    mode: number;          // 最常見時長
    distribution: {
      short: number;       // <15分鐘的百分比
      medium: number;      // 15-45分鐘的百分比
      long: number;        // >45分鐘的百分比
    };
  };
  
  // 完成率模式
  completionRate: {
    overall: number;       // 整體完成率
    byHour: { hour: number; rate: number; }[];
    byDay: { day: number; rate: number; }[];
    byMode: { water: number; pomodoro: number; };
  };
  
  // 一致性指標
  consistency: {
    score: number;         // 0-100，一致性分數
    streaks: {
      current: number;     // 目前連續天數
      longest: number;     // 最長連續天數
    };
    regularityIndex: number; // 0-1，規律性指數
  };
}

/**
 * 報告選項
 */
export interface ReportOptions {
  startDate: string;
  endDate: string;
  includeCharts: boolean;
  includeTrends: boolean;
  includeAchievements: boolean;
  format: 'json' | 'csv' | 'pdf';
  language: 'zh-TW' | 'en';
}

/**
 * 統計報告
 */
export interface StatisticsReport {
  metadata: {
    generatedAt: string;
    period: string;
    format: string;
    language: string;
  };
  
  summary: StatsSummary;
  dailyBreakdown: DailyStats[];
  trends: TrendAnalysis;
  patterns: UsagePattern;
  achievements: Achievement[];
  
  // 圖表資料（若請求）
  charts?: {
    dailyActivity: ChartData;
    weeklyTrend: ChartData;
    hourlyDistribution: ChartData;
    completionRates: ChartData;
  };
  
  // 匯出格式特定資料
  exportData?: string;    // CSV/PDF 內容
}

/**
 * 圖表資料格式
 */
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

/**
 * 目標進度
 */
export interface GoalProgress {
  date: string;
  
  // 每日目標進度
  waterGoal: {
    target: number;        // 目標次數/毫升
    current: number;       // 目前進度
    percentage: number;    // 完成百分比
    achieved: boolean;     // 是否達成
  };
  
  pomodoroGoal: {
    target: number;        // 目標番茄數
    current: number;       // 目前進度
    percentage: number;    // 完成百分比
    achieved: boolean;     // 是否達成
  };
  
  // 週目標進度
  weeklyProgress: {
    daysCompleted: number; // 已完成目標的天數
    totalDays: number;     // 總天數
    onTrack: boolean;      // 是否按計畫進行
  };
  
  // 建議和激勵
  suggestions: string[];
  motivationalMessage: string;
}

/**
 * 個人目標設定
 */
export interface PersonalGoals {
  // 每日目標
  dailyWaterSessions: number;    // 每日喝水次數目標
  dailyWaterAmount: number;      // 每日喝水量目標（毫升）
  dailyPomodoroSessions: number; // 每日番茄鐘目標
  
  // 週目標
  weeklyGoalDays: number;        // 每週達成目標的天數
  
  // 長期目標
  streakTarget: number;          // 目標連續天數
  
  // 目標設定時間
  setDate: string;
  lastModified: string;
}

/**
 * 統計摘要（儀表板用）
 */
export interface StatsSummary {
  today: {
    waterSessions: number;
    waterAmount: number;
    pomodoroSessions: number;
    focusMinutes: number;
    goalsAchieved: string[];     // 已達成的目標類型
  };
  
  thisWeek: {
    totalSessions: number;
    averageDaily: number;
    bestDay: string;
    consistency: number;         // 0-1
  };
  
  allTime: {
    totalSessions: number;
    totalMinutes: number;
    longestStreak: number;
    achievements: number;        // 已解鎖成就數
  };
  
  // 快速洞察
  insights: string[];           // 資料洞察和建議
  nextMilestone: string;        // 下個里程碑
}

/**
 * 資料介面（引用自 data-model.md 和 storage-api.ts）
 */
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