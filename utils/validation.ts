/**
 * FlowSip MVP 資料驗證工具
 * 
 * 提供輸入驗證和邊界檢查功能
 * 遵循正體中文註解規範和 MVP 精簡原則
 */

import type {
  TimerMode,
  TimerState,
  UserSettings,
  ActivityRecord,
  ValidationResult
} from '~/types/index'
import { 
  TIME_CONSTANTS,
  TimerError,
  SettingsError,
  StorageError
} from '~/types/index'

// =============================================================================
// 基礎驗證函數
// =============================================================================

/**
 * 驗證是否為有效的計時器模式
 */
export function isValidTimerMode(mode: unknown): mode is TimerMode {
  return typeof mode === 'string' && ['water', 'pomodoro'].includes(mode)
}

/**
 * 驗證是否為有效的持續時間（毫秒）
 * @param duration 持續時間
 * @param allowZero 是否允許零值
 */
export function isValidDuration(duration: unknown, allowZero = false): boolean {
  if (typeof duration !== 'number') return false
  if (!allowZero && duration <= 0) return false
  if (allowZero && duration < 0) return false
  if (!Number.isFinite(duration)) return false
  
  // 檢查是否超過最大限制（24 小時）
  return duration <= TIME_CONSTANTS.MAX_DURATION
}

/**
 * 驗證是否為有效的日期字串 (YYYY-MM-DD)
 */
export function isValidDateString(dateString: unknown): boolean {
  if (typeof dateString !== 'string') return false
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * 驗證是否為有效的時間戳
 */
export function isValidTimestamp(timestamp: unknown): boolean {
  if (typeof timestamp !== 'number') return false
  if (!Number.isFinite(timestamp)) return false
  
  // 合理的時間範圍檢查（2000年到2100年）
  const minTimestamp = new Date('2000-01-01').getTime()
  const maxTimestamp = new Date('2100-12-31').getTime()
  
  return timestamp >= minTimestamp && timestamp <= maxTimestamp
}

/**
 * 驗證是否為有效的音量值 (0-1)
 */
export function isValidVolume(volume: unknown): boolean {
  return typeof volume === 'number' && 
         Number.isFinite(volume) && 
         volume >= 0 && 
         volume <= 1
}

/**
 * 驗證是否為有效的 UUID
 */
export function isValidUUID(id: unknown): boolean {
  if (typeof id !== 'string') return false
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// =============================================================================
// 計時器狀態驗證
// =============================================================================

/**
 * 驗證計時器狀態物件
 */
export function validateTimerState(state: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!state || typeof state !== 'object') {
    errors.push('計時器狀態必須是物件')
    return { isValid: false, errors, warnings }
  }
  
  const s = state as Partial<TimerState>
  
  // 驗證必填欄位
  if (!s.status || !['stopped', 'running', 'paused'].includes(s.status)) {
    errors.push('計時器狀態必須是 stopped, running, 或 paused')
  }
  
  if (s.mode !== null && !isValidTimerMode(s.mode)) {
    errors.push('計時器模式必須是 water, pomodoro, 或 null')
  }
  
  if (typeof s.duration !== 'number' || !isValidDuration(s.duration, true)) {
    errors.push('持續時間必須是有效的非負數值')
  }
  
  if (typeof s.remaining !== 'number' || !isValidDuration(s.remaining, true)) {
    errors.push('剩餘時間必須是有效的非負數值')
  }
  
  if (typeof s.progress !== 'number' || s.progress < 0 || s.progress > 1) {
    errors.push('進度值必須在 0 到 1 之間')
  }
  
  // 驗證時間一致性
  if (s.duration && s.remaining && s.remaining > s.duration) {
    errors.push('剩餘時間不能大於總持續時間')
  }
  
  // 驗證狀態一致性
  if (s.status === 'running' || s.status === 'paused') {
    if (!s.startTime) {
      errors.push('運行或暫停狀態必須有開始時間')
    }
    if (!s.mode) {
      errors.push('運行或暫停狀態必須有計時器模式')
    }
  }
  
  if (s.status === 'stopped') {
    if (s.remaining && s.remaining > 0) {
      warnings.push('停止狀態下剩餘時間應為 0')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================================================
// 使用者設定驗證
// =============================================================================

/**
 * 驗證使用者設定物件
 */
export function validateUserSettings(settings: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!settings || typeof settings !== 'object') {
    errors.push('設定必須是物件')
    return { isValid: false, errors, warnings }
  }
  
  const s = settings as Partial<UserSettings>
  
  // 驗證時間間隔
  if (!isValidDuration(s.waterInterval)) {
    errors.push('喝水間隔必須是正數且不超過 24 小時')
  }
  
  if (!isValidDuration(s.pomodoroInterval)) {
    errors.push('番茄鐘間隔必須是正數且不超過 24 小時')
  }
  
  if (!isValidDuration(s.breakInterval)) {
    errors.push('休息間隔必須是正數且不超過 24 小時')
  }
  
  // 驗證布林值
  if (typeof s.soundEnabled !== 'boolean') {
    errors.push('音效啟用狀態必須是布林值')
  }
  
  if (typeof s.notificationsEnabled !== 'boolean') {
    errors.push('通知啟用狀態必須是布林值')
  }
  
  // 驗證音量
  if (!isValidVolume(s.volume)) {
    errors.push('音量必須在 0 到 1 之間')
  }
  
  // 驗證主題
  if (s.theme && !['light', 'dark', 'system'].includes(s.theme)) {
    errors.push('主題必須是 light, dark, 或 system')
  }
  
  // 驗證替代提醒設定
  if (s.fallbackAlerts) {
    const fallbackValidation = validateFallbackAlertSettings(s.fallbackAlerts)
    errors.push(...fallbackValidation.errors)
    if (fallbackValidation.warnings) {
      warnings.push(...fallbackValidation.warnings)
    }
  }
  
  // 合理性檢查
  if (s.waterInterval && s.waterInterval < 60000) { // 小於 1 分鐘
    warnings.push('喝水間隔小於 1 分鐘可能過於頻繁')
  }
  
  if (s.pomodoroInterval && s.pomodoroInterval > 3600000) { // 大於 1 小時
    warnings.push('番茄鐘間隔大於 1 小時可能過長')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 驗證替代提醒設定
 */
export function validateFallbackAlertSettings(settings: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!settings || typeof settings !== 'object') {
    errors.push('替代提醒設定必須是物件')
    return { isValid: false, errors, warnings }
  }
  
  const s = settings as any
  
  if (typeof s.visualAlertsEnabled !== 'boolean') {
    errors.push('視覺提醒啟用狀態必須是布林值')
  }
  
  if (typeof s.soundAlertsEnabled !== 'boolean') {
    errors.push('音效提醒啟用狀態必須是布林值')
  }
  
  if (typeof s.tabTitleAlertsEnabled !== 'boolean') {
    errors.push('分頁標題提醒啟用狀態必須是布林值')
  }
  
  if (typeof s.flashDuration !== 'number' || s.flashDuration <= 0) {
    errors.push('閃爍持續時間必須是正數')
  }
  
  if (!['chime', 'bell', 'notification', 'beep'].includes(s.alertSoundType)) {
    errors.push('提醒音效類型必須是有效選項')
  }
  
  if (typeof s.repeatSound !== 'boolean') {
    errors.push('重複播放音效設定必須是布林值')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================================================
// 活動記錄驗證
// =============================================================================

/**
 * 驗證活動記錄物件
 */
export function validateActivityRecord(record: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!record || typeof record !== 'object') {
    errors.push('活動記錄必須是物件')
    return { isValid: false, errors, warnings }
  }
  
  const r = record as Partial<ActivityRecord>
  
  // 驗證必填欄位
  if (!r.id || typeof r.id !== 'string') {
    errors.push('活動記錄 ID 必須是非空字串')
  }
  
  if (!isValidTimerMode(r.type)) {
    errors.push('活動類型必須是有效的計時器模式')
  }
  
  if (!r.startTime || !(r.startTime instanceof Date)) {
    errors.push('開始時間必須是有效的 Date 物件')
  }
  
  if (!r.endTime || !(r.endTime instanceof Date)) {
    errors.push('結束時間必須是有效的 Date 物件')
  }
  
  if (typeof r.duration !== 'number' || !isValidDuration(r.duration)) {
    errors.push('持續時間必須是有效的正數')
  }
  
  if (typeof r.completed !== 'boolean') {
    errors.push('完成狀態必須是布林值')
  }
  
  if (!isValidDateString(r.date)) {
    errors.push('日期必須是有效的 YYYY-MM-DD 格式字串')
  }
  
  // 驗證時間邏輯
  if (r.startTime && r.endTime) {
    if (r.startTime >= r.endTime) {
      errors.push('開始時間必須早於結束時間')
    }
    
    if (r.duration) {
      const calculatedDuration = r.endTime.getTime() - r.startTime.getTime()
      const timeDiff = Math.abs(calculatedDuration - r.duration)
      
      if (timeDiff > 1000) { // 允許 1 秒誤差
        warnings.push('記錄的持續時間與計算的時間差異較大')
      }
    }
  }
  
  // 驗證日期一致性
  if (r.date && r.startTime) {
    const recordDate = r.startTime.toISOString().split('T')[0]
    if (recordDate !== r.date) {
      errors.push('記錄日期與開始時間不一致')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================================================
// 批次驗證函數
// =============================================================================

/**
 * 批次驗證活動記錄陣列
 */
export function validateActivityRecords(records: unknown[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!Array.isArray(records)) {
    return {
      isValid: false,
      errors: ['必須提供活動記錄陣列'],
      warnings
    }
  }
  
  const ids = new Set<string>()
  
  records.forEach((record, index) => {
    const validation = validateActivityRecord(record)
    
    // 添加索引資訊到錯誤訊息
    validation.errors.forEach(error => {
      errors.push(`記錄 ${index}: ${error}`)
    })
    
    if (validation.warnings) {
      validation.warnings.forEach(warning => {
        warnings.push(`記錄 ${index}: ${warning}`)
      })
    }
    
    // 檢查重複 ID
    if (validation.isValid && typeof record === 'object' && record) {
      const r = record as ActivityRecord
      if (ids.has(r.id)) {
        errors.push(`記錄 ${index}: 重複的 ID ${r.id}`)
      } else {
        ids.add(r.id)
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 驗證每日統計資料
 */
export function validateDailyStats(stats: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!stats || typeof stats !== 'object') {
    errors.push('每日統計必須是物件')
    return { isValid: false, errors, warnings }
  }
  
  const s = stats as any
  
  // 驗證日期
  if (!s.date || typeof s.date !== 'string') {
    errors.push('日期必須是字串')
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) {
    errors.push('日期格式必須是 YYYY-MM-DD')
  }
  
  // 驗證統計數據
  const requiredNumbers = [
    'waterCompletedCount',
    'pomodoroCompletedCount', 
    'totalWaterTime',
    'totalPomodoroTime',
    'totalActiveTime'
  ]
  
  requiredNumbers.forEach(field => {
    if (typeof s[field] !== 'number' || s[field] < 0) {
      errors.push(`${field} 必須是非負數`)
    }
  })
  
  // 驗證最後更新時間
  if (s.lastUpdated && !(s.lastUpdated instanceof Date) && typeof s.lastUpdated !== 'string') {
    errors.push('最後更新時間必須是 Date 或字串')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================================================
// 清理和正規化函數
// =============================================================================

/**
 * 清理和正規化使用者設定
 */
export function sanitizeUserSettings(settings: Partial<UserSettings>): UserSettings {
  const cleaned: UserSettings = {
    waterInterval: Math.max(60000, Math.min(settings.waterInterval || 1800000, TIME_CONSTANTS.MAX_DURATION)),
    pomodoroInterval: Math.max(60000, Math.min(settings.pomodoroInterval || 1500000, TIME_CONSTANTS.MAX_DURATION)),
    breakInterval: Math.max(60000, Math.min(settings.breakInterval || 300000, TIME_CONSTANTS.MAX_DURATION)),
    soundEnabled: Boolean(settings.soundEnabled ?? true),
    volume: Math.max(0, Math.min(settings.volume || 0.5, 1)),
    theme: ['light', 'dark', 'system'].includes(settings.theme || '') ? settings.theme! : 'light',
    notificationsEnabled: Boolean(settings.notificationsEnabled ?? true),
  }
  
  // 處理替代提醒設定
  if (settings.fallbackAlerts) {
    cleaned.fallbackAlerts = {
      visualAlertsEnabled: Boolean(settings.fallbackAlerts.visualAlertsEnabled ?? true),
      soundAlertsEnabled: Boolean(settings.fallbackAlerts.soundAlertsEnabled ?? true),
      tabTitleAlertsEnabled: Boolean(settings.fallbackAlerts.tabTitleAlertsEnabled ?? true),
      flashDuration: Math.max(1, Math.min(settings.fallbackAlerts.flashDuration || 3, 10)),
      alertSoundType: ['chime', 'bell', 'notification', 'beep'].includes(settings.fallbackAlerts.alertSoundType || '') 
        ? settings.fallbackAlerts.alertSoundType! 
        : 'chime',
      repeatSound: Boolean(settings.fallbackAlerts.repeatSound ?? false)
    }
  }
  
  return cleaned
}

/**
 * 正規化日期字串為 YYYY-MM-DD 格式
 */
export function normalizeDateString(date: Date | string | number): string {
  let dateObj: Date
  
  if (date instanceof Date) {
    dateObj = date
  } else if (typeof date === 'string') {
    dateObj = new Date(date)
  } else if (typeof date === 'number') {
    dateObj = new Date(date)
  } else {
    throw new Error('無效的日期格式')
  }
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('無效的日期值')
  }
  
  return dateObj.toISOString().split('T')[0]
}

// =============================================================================
// 錯誤拋出函數
// =============================================================================

/**
 * 拋出計時器錯誤
 */
export function throwTimerError(message: string, code: any, details?: unknown): never {
  throw new TimerError(message, code, details)
}

/**
 * 拋出設定錯誤
 */
export function throwSettingsError(message: string, field: keyof UserSettings, value: unknown): never {
  throw new SettingsError(message, field, value)
}

/**
 * 拋出儲存錯誤
 */
export function throwStorageError(message: string, operation: any, key?: string, originalError?: Error): never {
  throw new StorageError(message, operation, key, originalError)
}

// =============================================================================
// 工具函數
// =============================================================================

/**
 * 生成簡單的 UUID (用於測試和開發)
 */
export function generateSimpleUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 安全地解析 JSON 字串
 */
export function safeParseJSON<T>(jsonString: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonString)
    return parsed
  } catch {
    return fallback
  }
}