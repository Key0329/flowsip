/**
 * useStats Composable - FlowSip 統計功能
 * 
 * 提供統計資料計算和管理功能的 Vue composable
 * 包含今日/週統計、趨勢分析、報表生成等功能
 * 遵循正體中文註解規範和響應式設計原則
 */

import { ref, computed, reactive, watch, onMounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { 
  ActivityRecord,
  DailyStats,
  WeeklyStats,
  TimerMode,
  DateString
} from '~/types'
import { useGlobalStorage } from './useStorage'
import { normalizeDateString } from '~/utils/validation'

/**
 * 統計時間範圍
 */
export type StatsTimeRange = 'today' | 'week' | 'month' | 'all'

/**
 * 統計趨勢資料點
 */
export interface StatsTrendPoint {
  /** 日期字串 */
  date: DateString
  /** 喝水完成次數 */
  waterCount: number
  /** 番茄鐘完成次數 */
  pomodoroCount: number
  /** 總計時時間（小時） */
  totalHours: number
}

/**
 * 統計摘要
 */
export interface StatsSummary {
  /** 時間範圍 */
  timeRange: StatsTimeRange
  
  /** 總計時天數 */
  totalDays: number
  
  /** 喝水統計 */
  water: {
    completedSessions: number
    totalTime: number // 毫秒
    averagePerDay: number
    streak: number // 連續天數
  }
  
  /** 番茄鐘統計 */
  pomodoro: {
    completedSessions: number
    totalTime: number // 毫秒
    averagePerDay: number
    streak: number // 連續天數
  }
  
  /** 總體統計 */
  total: {
    activeTime: number // 毫秒
    averageSessionLength: number // 毫秒
    completionRate: number // 0-1
    mostActiveDay: string // 星期
    bestDay: DateString | null
  }
  
  /** 更新時間 */
  lastUpdated: Date
}

/**
 * useStats composable 回傳型別
 */
export interface UseStatsReturn {
  /** 是否載入中 */
  isLoading: Ref<boolean>
  
  /** 錯誤狀態 */
  error: Ref<Error | null>
  
  /** 當前統計時間範圍 */
  timeRange: Ref<StatsTimeRange>
  
  /** 統計摘要 */
  summary: ComputedRef<StatsSummary | null>
  
  /** 趨勢資料 */
  trends: ComputedRef<StatsTrendPoint[]>
  
  /** 今日統計 */
  todayStats: ComputedRef<DailyStats | null>
  
  /** 本週統計 */
  weekStats: ComputedRef<WeeklyStats | null>
  
  /** 設定統計時間範圍 */
  setTimeRange(range: StatsTimeRange): void
  
  /** 重新計算統計 */
  recalculateStats(): Promise<void>
  
  /** 生成報表 */
  generateReport(format: 'json' | 'csv'): Promise<string>
  
  /** 獲取指定日期的詳細統計 */
  getDayDetails(date: DateString): Promise<DailyStats | null>
  
  /** 獲取週詳細統計 */
  getWeekDetails(weekStart: DateString): Promise<WeeklyStats | null>
}

/**
 * useStats - 統計資料管理 composable
 * 
 * @returns 統計功能 API
 */
export function useStats(): UseStatsReturn {
  // =========================================================================
  // 響應式狀態
  // =========================================================================
  
  /** 是否載入中 */
  const isLoading = ref(false)
  
  /** 錯誤狀態 */
  const error = ref<Error | null>(null)
  
  /** 當前統計時間範圍 */
  const timeRange = ref<StatsTimeRange>('today')
  
  /** 統計資料快取 */
  const statsCache = reactive<{
    dailyStats: Map<DateString, DailyStats>
    weeklyStats: Map<DateString, WeeklyStats>
    activities: Map<DateString, ActivityRecord[]>
  }>({
    dailyStats: new Map(),
    weeklyStats: new Map(),
    activities: new Map()
  })
  
  /** 儲存 API 實例 */
  const storage = useGlobalStorage()
  
  // =========================================================================
  // 工具函數
  // =========================================================================
  
  /**
   * 獲取週開始日期（星期一）
   */
  function getWeekStart(date: Date): DateString {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 調整為星期一開始
    d.setDate(diff)
    return normalizeDateString(d)
  }
  
  /**
   * 獲取時間範圍的開始和結束日期
   */
  function getDateRange(range: StatsTimeRange): { start: DateString, end: DateString } {
    const today = new Date()
    const todayStr = normalizeDateString(today)
    
    switch (range) {
      case 'today':
        return { start: todayStr, end: todayStr }
        
      case 'week': {
        const weekStart = getWeekStart(today)
        return { start: weekStart, end: todayStr }
      }
      
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return { 
          start: normalizeDateString(monthStart), 
          end: todayStr 
        }
      }
      
      case 'all': {
        // 過去一年
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
        return { 
          start: normalizeDateString(yearAgo), 
          end: todayStr 
        }
      }
    }
  }
  
  /**
   * 計算每日統計
   */
  function calculateDailyStats(date: DateString, activities: ActivityRecord[]): DailyStats {
    const dayActivities = activities.filter(a => a.date === date)
    
    let waterCompletedCount = 0
    let pomodoroCompletedCount = 0
    let totalWaterTime = 0
    let totalPomodoroTime = 0
    
    dayActivities.forEach(activity => {
      if (activity.completed) {
        if (activity.type === 'water') {
          waterCompletedCount++
          totalWaterTime += activity.duration
        } else if (activity.type === 'pomodoro') {
          pomodoroCompletedCount++
          totalPomodoroTime += activity.duration
        }
      }
    })
    
    return {
      date,
      waterCompletedCount,
      pomodoroCompletedCount,
      totalWaterTime,
      totalPomodoroTime,
      totalActiveTime: totalWaterTime + totalPomodoroTime,
      lastUpdated: new Date()
    }
  }
  
  /**
   * 計算週統計
   */
  function calculateWeeklyStats(weekStart: DateString, dailyStats: DailyStats[]): WeeklyStats {
    const weeklyTotals = dailyStats.reduce(
      (acc, day) => ({
        waterCompletedCount: acc.waterCompletedCount + day.waterCompletedCount,
        pomodoroCompletedCount: acc.pomodoroCompletedCount + day.pomodoroCompletedCount,
        totalWaterTime: acc.totalWaterTime + day.totalWaterTime,
        totalPomodoroTime: acc.totalPomodoroTime + day.totalPomodoroTime,
        totalActiveTime: acc.totalActiveTime + day.totalActiveTime
      }),
      {
        waterCompletedCount: 0,
        pomodoroCompletedCount: 0,
        totalWaterTime: 0,
        totalPomodoroTime: 0,
        totalActiveTime: 0
      }
    )
    
    return {
      weekStart,
      dailyStats,
      weeklyTotals,
      lastUpdated: new Date()
    }
  }
  
  /**
   * 計算連續天數
   */
  function calculateStreak(activities: ActivityRecord[], mode: TimerMode): number {
    const today = new Date()
    let streak = 0
    const currentDate = new Date(today)
    
    while (true) {
      const dateStr = normalizeDateString(currentDate)
      const dayActivities = activities.filter(a => 
        a.date === dateStr && 
        a.type === mode && 
        a.completed
      )
      
      if (dayActivities.length > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
      
      // 防止無限循環，最多檢查365天
      if (streak > 365) break
    }
    
    return streak
  }
  
  /**
   * 計算最活躍的星期幾
   */
  function getMostActiveDay(activities: ActivityRecord[]): string {
    const dayActivityCount = new Map<string, number>()
    
    activities.forEach(activity => {
      if (activity.completed) {
        const date = new Date(activity.startTime)
        const dayName = date.toLocaleDateString('zh-TW', { weekday: 'long' })
        dayActivityCount.set(dayName, (dayActivityCount.get(dayName) || 0) + 1)
      }
    })
    
    let mostActiveDay = '星期一'
    let maxCount = 0
    
    dayActivityCount.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count
        mostActiveDay = day
      }
    })
    
    return mostActiveDay
  }
  
  /**
   * 獲取最佳表現日
   */
  function getBestDay(activities: ActivityRecord[]): DateString | null {
    const dailyActivityCount = new Map<DateString, number>()
    
    activities.forEach(activity => {
      if (activity.completed) {
        const date = activity.date
        dailyActivityCount.set(date, (dailyActivityCount.get(date) || 0) + 1)
      }
    })
    
    let bestDay: DateString | null = null
    let maxCount = 0
    
    dailyActivityCount.forEach((count, date) => {
      if (count > maxCount) {
        maxCount = count
        bestDay = date
      }
    })
    
    return bestDay
  }
  
  // =========================================================================
  // 計算屬性
  // =========================================================================
  
  /** 統計摘要 */
  const summary = computed<StatsSummary | null>(() => {
    try {
      const { start, end } = getDateRange(timeRange.value)
      
      // 收集活動資料
      const allActivities: ActivityRecord[] = []
      for (const [date, activities] of statsCache.activities) {
        if (date >= start && date <= end) {
          allActivities.push(...activities)
        }
      }
      
      if (allActivities.length === 0) {
        return null
      }
      
      const completedActivities = allActivities.filter(a => a.completed)
      
      // 計算基本統計
      const waterActivities = completedActivities.filter(a => a.type === 'water')
      const pomodoroActivities = completedActivities.filter(a => a.type === 'pomodoro')
      
      const totalWaterTime = waterActivities.reduce((sum, a) => sum + a.duration, 0)
      const totalPomodoroTime = pomodoroActivities.reduce((sum, a) => sum + a.duration, 0)
      
      // 計算天數
      const uniqueDates = new Set(allActivities.map(a => a.date))
      const totalDays = uniqueDates.size
      
      // 計算連續天數
      const waterStreak = calculateStreak(allActivities, 'water')
      const pomodoroStreak = calculateStreak(allActivities, 'pomodoro')
      
      // 計算完成率
      const totalSessions = allActivities.length
      const completedSessions = completedActivities.length
      const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0
      
      // 計算平均會話長度
      const averageSessionLength = completedSessions > 0 
        ? (totalWaterTime + totalPomodoroTime) / completedSessions 
        : 0
      
      return {
        timeRange: timeRange.value,
        totalDays,
        water: {
          completedSessions: waterActivities.length,
          totalTime: totalWaterTime,
          averagePerDay: totalDays > 0 ? waterActivities.length / totalDays : 0,
          streak: waterStreak
        },
        pomodoro: {
          completedSessions: pomodoroActivities.length,
          totalTime: totalPomodoroTime,
          averagePerDay: totalDays > 0 ? pomodoroActivities.length / totalDays : 0,
          streak: pomodoroStreak
        },
        total: {
          activeTime: totalWaterTime + totalPomodoroTime,
          averageSessionLength,
          completionRate,
          mostActiveDay: getMostActiveDay(completedActivities),
          bestDay: getBestDay(completedActivities)
        },
        lastUpdated: new Date()
      }
    } catch (err) {
      console.error('計算統計摘要失敗:', err)
      return null
    }
  })
  
  /** 趨勢資料 */
  const trends = computed<StatsTrendPoint[]>(() => {
    try {
      const { start, end } = getDateRange(timeRange.value)
      const trendPoints: StatsTrendPoint[] = []
      
      // 生成日期範圍內的所有日期
      const startDate = new Date(start)
      const endDate = new Date(end)
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = normalizeDateString(currentDate)
        const activities = statsCache.activities.get(dateStr) || []
        const completedActivities = activities.filter(a => a.completed)
        
        const waterCount = completedActivities.filter(a => a.type === 'water').length
        const pomodoroCount = completedActivities.filter(a => a.type === 'pomodoro').length
        const totalTime = completedActivities.reduce((sum, a) => sum + a.duration, 0)
        const totalHours = totalTime / (60 * 60 * 1000) // 轉換為小時
        
        trendPoints.push({
          date: dateStr,
          waterCount,
          pomodoroCount,
          totalHours
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      return trendPoints
    } catch (err) {
      console.error('計算趨勢資料失敗:', err)
      return []
    }
  })
  
  /** 今日統計 */
  const todayStats = computed<DailyStats | null>(() => {
    const today = normalizeDateString(new Date())
    return statsCache.dailyStats.get(today) || null
  })
  
  /** 本週統計 */
  const weekStats = computed<WeeklyStats | null>(() => {
    const weekStart = getWeekStart(new Date())
    return statsCache.weeklyStats.get(weekStart) || null
  })
  
  // =========================================================================
  // 方法
  // =========================================================================
  
  /**
   * 設定統計時間範圍
   */
  function setTimeRange(range: StatsTimeRange): void {
    timeRange.value = range
  }
  
  /**
   * 載入活動資料
   */
  async function loadActivities(startDate: DateString, endDate: DateString): Promise<void> {
    try {
      const activities = await storage.getActivitiesByDateRange(startDate, endDate)
      
      // 按日期分組
      const activitiesByDate = new Map<DateString, ActivityRecord[]>()
      activities.forEach(activity => {
        if (!activitiesByDate.has(activity.date)) {
          activitiesByDate.set(activity.date, [])
        }
        activitiesByDate.get(activity.date)!.push(activity)
      })
      
      // 更新快取
      activitiesByDate.forEach((dateActivities, date) => {
        statsCache.activities.set(date, dateActivities)
      })
      
    } catch (err) {
      console.error('載入活動資料失敗:', err)
      throw err
    }
  }
  
  /**
   * 重新計算統計
   */
  async function recalculateStats(): Promise<void> {
    try {
      isLoading.value = true
      error.value = null
      
      const { start, end } = getDateRange(timeRange.value)
      
      // 載入活動資料
      await loadActivities(start, end)
      
      // 計算每日統計
      const startDate = new Date(start)
      const endDate = new Date(end)
      const currentDate = new Date(startDate)
      
      const dailyStatsList: DailyStats[] = []
      
      while (currentDate <= endDate) {
        const dateStr = normalizeDateString(currentDate)
        const activities = statsCache.activities.get(dateStr) || []
        
        const dayStats = calculateDailyStats(dateStr, activities)
        statsCache.dailyStats.set(dateStr, dayStats)
        dailyStatsList.push(dayStats)
        
        // 儲存每日統計
        await storage.saveDailyStats(dayStats)
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // 如果是週範圍，計算週統計
      if (timeRange.value === 'week') {
        const weekStart = getWeekStart(new Date())
        const weeklyStats = calculateWeeklyStats(weekStart, dailyStatsList)
        statsCache.weeklyStats.set(weekStart, weeklyStats)
        
        // 儲存週統計
        await storage.saveWeeklyStats(weeklyStats)
      }
      
    } catch (err) {
      console.error('重新計算統計失敗:', err)
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 生成報表
   */
  async function generateReport(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        summary: summary.value,
        trends: trends.value,
        generatedAt: new Date().toISOString()
      }, null, 2)
    } else if (format === 'csv') {
      const headers = ['日期', '喝水次數', '番茄鐘次數', '總時數']
      const rows = trends.value.map(point => [
        point.date,
        point.waterCount.toString(),
        point.pomodoroCount.toString(),
        point.totalHours.toFixed(2)
      ])
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    }
    
    throw new Error('不支援的報表格式')
  }
  
  /**
   * 獲取指定日期的詳細統計
   */
  async function getDayDetails(date: DateString): Promise<DailyStats | null> {
    // 先檢查快取
    if (statsCache.dailyStats.has(date)) {
      return statsCache.dailyStats.get(date)!
    }
    
    // 從儲存載入
    const stored = await storage.loadDailyStats(date)
    if (stored) {
      statsCache.dailyStats.set(date, stored)
      return stored
    }
    
    // 如果沒有儲存的統計，從活動重新計算
    const activities = await storage.getActivitiesByDate(date)
    const dayStats = calculateDailyStats(date, activities)
    statsCache.dailyStats.set(date, dayStats)
    
    // 儲存計算結果
    await storage.saveDailyStats(dayStats)
    
    return dayStats
  }
  
  /**
   * 獲取週詳細統計
   */
  async function getWeekDetails(weekStart: DateString): Promise<WeeklyStats | null> {
    // 先檢查快取
    if (statsCache.weeklyStats.has(weekStart)) {
      return statsCache.weeklyStats.get(weekStart)!
    }
    
    // 從儲存載入
    const stored = await storage.loadWeeklyStats(weekStart)
    if (stored) {
      statsCache.weeklyStats.set(weekStart, stored)
      return stored
    }
    
    // 重新計算週統計
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const activities = await storage.getActivitiesByDateRange(
      weekStart,
      normalizeDateString(weekEnd)
    )
    
    // 計算每日統計
    const dailyStatsList: DailyStats[] = []
    const currentDate = new Date(weekStart)
    
    for (let i = 0; i < 7; i++) {
      const dateStr = normalizeDateString(currentDate)
      const dayActivities = activities.filter(a => a.date === dateStr)
      const dayStats = calculateDailyStats(dateStr, dayActivities)
      
      dailyStatsList.push(dayStats)
      statsCache.dailyStats.set(dateStr, dayStats)
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    const weeklyStats = calculateWeeklyStats(weekStart, dailyStatsList)
    statsCache.weeklyStats.set(weekStart, weeklyStats)
    
    // 儲存計算結果
    await storage.saveWeeklyStats(weeklyStats)
    
    return weeklyStats
  }
  
  // =========================================================================
  // 監聽器
  // =========================================================================
  
  /** 監聽時間範圍變化 */
  watch(timeRange, () => {
    recalculateStats()
  })
  
  // =========================================================================
  // 生命週期
  // =========================================================================
  
  /** 初始化 */
  onMounted(() => {
    recalculateStats()
  })
  
  // =========================================================================
  // 回傳 API
  // =========================================================================
  
  return {
    isLoading,
    error,
    timeRange,
    summary,
    trends,
    todayStats,
    weekStats,
    setTimeRange,
    recalculateStats,
    generateReport,
    getDayDetails,
    getWeekDetails
  }
}