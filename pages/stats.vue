<!--
  Statistics Page - FlowSip 統計頁面
  
  整合統計功能的完整頁面
  包含統計卡片、圖表、時間範圍選擇、報表功能等
  遵循響應式設計和正體中文規範
-->

<template>
  <div class="stats-page">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <button class="back-btn" @click="goBack">
            ← 返回
          </button>
          <div>
            <h1 class="page-title">📊 統計分析</h1>
            <p class="page-subtitle">追蹤您的專注時間和習慣養成進度</p>
          </div>
        </div>
      </div>
      
      <!-- 操作按鈕 -->
      <div class="header-actions">
        <div class="time-range-selector">
          <select
            v-model="selectedTimeRange"
            class="range-select"
            @change="handleTimeRangeChange"
          >
            <option value="today">
              今日
            </option>
            <option value="week">
              本週
            </option>
            <option value="month">
              本月
            </option>
            <option value="all">
              全部
            </option>
          </select>
        </div>
        
        <div class="action-buttons">
          <button 
            class="refresh-btn"
            :disabled="isLoading"
            @click="handleRefresh"
          >
            <span class="btn-icon">🔄</span>
            <span class="btn-text">刷新</span>
          </button>
          
          <div ref="exportDropdown" class="export-dropdown">
            <button
              class="export-btn"
              @click="toggleExportMenu"
            >
              <span class="btn-icon">📊</span>
              <span class="btn-text">匯出</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            
            <div v-show="showExportMenu" class="export-menu">
              <button class="export-option" @click="handleExport('json')">
                JSON 格式
              </button>
              <button class="export-option" @click="handleExport('csv')">
                CSV 格式
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner" />
      <p class="loading-text">
        載入統計資料中...
      </p>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <div class="error-icon">
          ⚠️
        </div>
        <h3 class="error-title">
          載入失敗
        </h3>
        <p class="error-message">
          {{ error.message }}
        </p>
        <button class="retry-button" @click="handleRefresh">
          重新載入
        </button>
      </div>
    </div>

    <!-- 主要內容 -->
    <div v-else class="stats-content">
      <!-- 摘要卡片區域 -->
      <section class="summary-section">
        <h2 class="section-title">
          統計摘要
        </h2>
        
        <div class="stats-cards-grid">
          <!-- 總活動數卡片 -->
          <StatsCard
            v-if="summary"
            title="總活動數"
            subtitle="已完成的計時活動"
            :value="totalActivities"
            unit="次"
            icon="🎯"
            type="primary"
            :trend="activitiesTrend"
            :show-trend="true"
            :secondary-info="[
              { label: '喝水', value: `${summary.water.completedSessions} 次` },
              { label: '番茄鐘', value: `${summary.pomodoro.completedSessions} 次` }
            ]"
            :chart-data="recentActivitiesData"
            :show-mini-chart="true"
            :last-updated="summary.lastUpdated"
            :show-footer="true"
          />
          
          <!-- 專注時數卡片 -->
          <StatsCard
            v-if="summary"
            title="專注時數"
            subtitle="累計專注時間"
            :value="totalHours"
            unit="小時"
            icon="⏰"
            type="success"
            :trend="hoursTrend"
            :show-trend="true"
            :secondary-info="[
              { label: '日平均', value: `${averageHoursPerDay} 小時` },
              { label: '最長連續', value: `${Math.max(summary.water.streak, summary.pomodoro.streak)} 天` }
            ]"
            :chart-data="recentHoursData"
            :show-mini-chart="true"
            :last-updated="summary.lastUpdated"
            :show-footer="true"
          />
          
          <!-- 完成率卡片 -->
          <StatsCard
            v-if="summary"
            title="完成率"
            subtitle="任務完成百分比"
            :value="completionRatePercent"
            unit="%"
            icon="✅"
            type="info"
            :trend="completionTrend"
            :show-trend="true"
            :secondary-info="[
              { label: '最佳日期', value: summary.total.bestDay || '暫無' },
              { label: '最活躍日', value: summary.total.mostActiveDay }
            ]"
            :last-updated="summary.lastUpdated"
            :show-footer="true"
          />
          
          <!-- 連續天數卡片 -->
          <StatsCard
            v-if="summary"
            title="最長連續"
            subtitle="連續使用天數"
            :value="maxStreak"
            unit="天"
            icon="🔥"
            type="warning"
            :secondary-info="[
              { label: '喝水連續', value: `${summary.water.streak} 天` },
              { label: '番茄鐘連續', value: `${summary.pomodoro.streak} 天` }
            ]"
            :last-updated="summary.lastUpdated"
            :show-footer="true"
          />
        </div>
      </section>

      <!-- 圖表區域 -->
      <section class="charts-section">
        <h2 class="section-title">
          詳細統計
        </h2>
        
        <div class="charts-container">
          <StatsCharts
            :height="400"
            :show-legend="true"
            :responsive="true"
          />
        </div>
      </section>

      <!-- 詳細資料區域 -->
      <section class="details-section">
        <h2 class="section-title">統計詳情</h2>
        
        <div class="details-content">
          <!-- 今日詳情 -->
          <div class="detail-card">
            <h3 class="detail-card-title">今日統計</h3>
            <div v-if="todayStats" class="detail-card-content">
              <div class="detail-row">
                <span class="detail-label">喝水提醒</span>
                <span class="detail-value">{{ todayStats.waterCompletedCount }} 次</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">番茄鐘</span>
                <span class="detail-value">{{ todayStats.pomodoroCompletedCount }} 次</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">總計時間</span>
                <span class="detail-value">{{ formatDuration(todayStats.totalActiveTime) }}</span>
              </div>
            </div>
            <div v-else class="no-data-message">
              今日尚無統計資料
            </div>
          </div>
          
          <!-- 本週詳情 -->
          <div class="detail-card">
            <h3 class="detail-card-title">本週統計</h3>
            <div v-if="weekStats" class="detail-card-content">
              <div class="detail-row">
                <span class="detail-label">活動天數</span>
                <span class="detail-value">{{ activeDaysThisWeek }} / 7 天</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">週總時間</span>
                <span class="detail-value">{{ formatDuration(weekStats.weeklyTotals.totalActiveTime) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">日均活動</span>
                <span class="detail-value">{{ weeklyAverageActivities.toFixed(1) }} 次</span>
              </div>
            </div>
            <div v-else class="no-data-message">
              本週尚無統計資料
            </div>
          </div>
          
          <!-- 習慣分析 -->
          <div class="detail-card">
            <h3 class="detail-card-title">習慣分析</h3>
            <div v-if="summary" class="detail-card-content">
              <div class="detail-row">
                <span class="detail-label">偏好活動</span>
                <span class="detail-value">{{ preferredActivity }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">平均會話</span>
                <span class="detail-value">{{ formatDuration(summary.total.averageSessionLength) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">活躍時段</span>
                <span class="detail-value">{{ summary.total.mostActiveDay }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStats } from '~/composables/useStats'
import type { StatsTimeRange } from '~/composables/useStats'
import StatsCard from '~/components/Stats/StatsCard.vue'
import StatsCharts from '~/components/Stats/Charts.vue'

// SEO 設定
useSeoMeta({
  title: '統計分析 - FlowSip',
  description: '查看您的專注時間統計和習慣養成進度',
  ogTitle: '統計分析 - FlowSip',
  ogDescription: '追蹤您的喝水提醒和番茄鐘使用統計'
})

// Composables
const {
  isLoading,
  error,
  timeRange,
  summary,
  trends,
  todayStats,
  weekStats,
  setTimeRange,
  recalculateStats,
  generateReport
} = useStats()

// 響應式資料
const selectedTimeRange = ref<StatsTimeRange>('today')
const showExportMenu = ref(false)
const exportDropdown = ref<HTMLElement>()

// 計算屬性
const totalActivities = computed(() => {
  if (!summary.value) return 0
  return summary.value.water.completedSessions + summary.value.pomodoro.completedSessions
})

const totalHours = computed(() => {
  if (!summary.value) return 0
  return (summary.value.total.activeTime / (60 * 60 * 1000)).toFixed(1)
})

const completionRatePercent = computed(() => {
  if (!summary.value) return 0
  return Math.round(summary.value.total.completionRate * 100)
})

const maxStreak = computed(() => {
  if (!summary.value) return 0
  return Math.max(summary.value.water.streak, summary.value.pomodoro.streak)
})

const averageHoursPerDay = computed(() => {
  if (!summary.value || summary.value.totalDays === 0) return '0.0'
  const avgMs = summary.value.total.activeTime / summary.value.totalDays
  return (avgMs / (60 * 60 * 1000)).toFixed(1)
})

const activitiesTrend = computed(() => {
  if (trends.value.length < 2) return 0
  
  const recent = trends.value.slice(-7)
  const earlier = trends.value.slice(-14, -7)
  
  if (earlier.length === 0) return 0
  
  const recentAvg = recent.reduce((sum, t) => sum + t.waterCount + t.pomodoroCount, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, t) => sum + t.waterCount + t.pomodoroCount, 0) / earlier.length
  
  if (earlierAvg === 0) return 0
  return ((recentAvg - earlierAvg) / earlierAvg) * 100
})

const hoursTrend = computed(() => {
  if (trends.value.length < 2) return 0
  
  const recent = trends.value.slice(-7)
  const earlier = trends.value.slice(-14, -7)
  
  if (earlier.length === 0) return 0
  
  const recentAvg = recent.reduce((sum, t) => sum + t.totalHours, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, t) => sum + t.totalHours, 0) / earlier.length
  
  if (earlierAvg === 0) return 0
  return ((recentAvg - earlierAvg) / earlierAvg) * 100
})

const completionTrend = computed(() => {
  return 0 // 簡化實作
})

const recentActivitiesData = computed(() => {
  return trends.value.slice(-7).map(t => t.waterCount + t.pomodoroCount)
})

const recentHoursData = computed(() => {
  return trends.value.slice(-7).map(t => t.totalHours)
})

const activeDaysThisWeek = computed(() => {
  if (!weekStats.value) return 0
  return weekStats.value.dailyStats.filter(day => 
    day.waterCompletedCount > 0 || day.pomodoroCompletedCount > 0
  ).length
})

const weeklyAverageActivities = computed(() => {
  if (!weekStats.value) return 0
  const total = weekStats.value.weeklyTotals.waterCompletedCount + 
                weekStats.value.weeklyTotals.pomodoroCompletedCount
  return total / 7
})

const preferredActivity = computed(() => {
  if (!summary.value) return '暫無資料'
  
  const waterSessions = summary.value.water.completedSessions
  const pomodoroSessions = summary.value.pomodoro.completedSessions
  
  if (waterSessions === pomodoroSessions) return '均衡使用'
  return waterSessions > pomodoroSessions ? '喝水提醒' : '番茄鐘'
})

// 方法
function handleTimeRangeChange() {
  setTimeRange(selectedTimeRange.value)
}

async function handleRefresh() {
  await recalculateStats()
}

function toggleExportMenu() {
  showExportMenu.value = !showExportMenu.value
}

async function handleExport(format: 'json' | 'csv') {
  try {
    const reportData = await generateReport(format)
    
    const blob = new Blob([reportData], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flowsip-stats-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showExportMenu.value = false
  } catch (err) {
    console.error('匯出失敗:', err)
    alert('匯出失敗，請稍後再試')
  }
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  
  if (hours > 0) {
    return `${hours} 小時 ${minutes} 分鐘`
  }
  return `${minutes} 分鐘`
}

function handleClickOutside(event: Event) {
  if (exportDropdown.value && !exportDropdown.value.contains(event.target as Node)) {
    showExportMenu.value = false
  }
}

function goBack() {
  navigateTo('/')
}

// 生命週期
onMounted(() => {
  selectedTimeRange.value = timeRange.value
  
  document.addEventListener('click', handleClickOutside)
  
  if (!isLoading.value && !summary.value) {
    recalculateStats()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>


<style scoped>
.stats-page {
  min-height: 100vh;
  background-color: rgb(var(--color-background));
  color: rgb(var(--color-text-primary));
  padding-bottom: var(--spacing-8);
  font-family: var(--font-family-primary);
}

.page-header {
  background-color: rgb(var(--color-white));
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid rgb(var(--color-border));
  padding: var(--spacing-6) var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.dark .page-header {
  background-color: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-700));
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

@media (min-width: 640px) {
  .header-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.back-btn {
  padding: var(--spacing-3);
  color: rgb(var(--color-primary));
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
}

.back-btn:hover {
  background-color: rgb(var(--color-primary) / 0.1);
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: rgb(var(--color-text-primary));
  line-height: var(--leading-heading);
  margin: 0;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: rgb(var(--color-text-secondary));
  margin-top: var(--spacing-1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.range-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid rgb(var(--color-border));
  border-radius: var(--radius-lg);
  background-color: rgb(var(--color-white));
  font-size: var(--text-sm);
  color: rgb(var(--color-text-primary));
}

.range-select:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: var(--shadow-focus);
}

.dark .range-select {
  background-color: rgb(var(--color-gray-700));
  border-color: rgb(var(--color-gray-600));
  color: rgb(var(--color-gray-200));
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.refresh-btn,
.export-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-white));
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled),
.export-btn:hover:not(:disabled) {
  background-color: rgb(var(--color-primary-dark));
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-dropdown {
  position: relative;
}

.export-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: var(--spacing-2);
  width: 10rem;
  background-color: rgb(var(--color-white));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid rgb(var(--color-border));
  z-index: 50;
  overflow: hidden;
}

.dark .export-menu {
  background-color: rgb(var(--color-gray-700));
  border-color: rgb(var(--color-gray-600));
}

.export-option {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-4);
  background: none;
  border: none;
  text-align: left;
  font-size: var(--text-sm);
  color: rgb(var(--color-text-primary));
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.export-option:hover {
  background-color: rgb(var(--color-background-secondary));
}

.dark .export-option {
  color: rgb(var(--color-gray-200));
}

.dark .export-option:hover {
  background-color: rgb(var(--color-gray-600));
}

.dropdown-arrow {
  font-size: var(--text-xs);
  transition: transform 0.2s ease;
}

/* 載入和錯誤狀態 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) var(--spacing-4);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 4px solid rgb(var(--color-primary) / 0.2);
  border-top-color: rgb(var(--color-primary));
  border-radius: 50%;
  margin-bottom: var(--spacing-4);
  animation: spin 1s linear infinite;
}

.loading-text {
  color: rgb(var(--color-text-secondary));
}

.error-container {
  text-align: center;
  max-width: 28rem;
  margin: 0 auto;
  padding: var(--spacing-16) var(--spacing-4);
}

.error-icon {
  font-size: var(--text-6xl);
  margin-bottom: var(--spacing-4);
}

.error-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: rgb(var(--color-text-primary));
  margin-bottom: var(--spacing-2);
}

.error-message {
  color: rgb(var(--color-text-secondary));
  margin-bottom: var(--spacing-6);
}

.retry-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-white));
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background-color: rgb(var(--color-primary-dark));
}

/* 主要內容區 */
.stats-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: rgb(var(--color-text-primary));
  margin-bottom: var(--spacing-6);
}

.overview-grid {
  display: grid;
  gap: var(--spacing-6);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .overview-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 卡片樣式 */
.stats-card,
.detail-card {
  background-color: rgb(var(--color-white));
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  border: 1px solid rgb(var(--color-border));
  padding: var(--spacing-6);
  transition: all 0.2s ease;
}

.stats-card:hover,
.detail-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.dark .stats-card,
.dark .detail-card {
  background-color: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-700));
}

.empty-state {
  text-align: center;
  padding: var(--spacing-12) 0;
  color: rgb(var(--color-text-secondary));
}

.details-grid {
  display: grid;
  gap: var(--spacing-6);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .details-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.detail-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: rgb(var(--color-text-primary));
  margin-bottom: var(--spacing-4);
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid rgb(var(--color-border));
}

.detail-item:last-child {
  border-bottom: none;
}

.dark .detail-item {
  border-color: rgb(var(--color-gray-700));
}

.detail-label {
  font-size: var(--text-sm);
  color: rgb(var(--color-text-secondary));
}

.detail-value {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: rgb(var(--color-text-primary));
}

.no-data-message {
  text-align: center;
  color: rgb(var(--color-text-secondary));
  padding: var(--spacing-4) 0;
}

/* 動畫 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 640px) {
  .header-content {
    padding: var(--spacing-4);
  }
  
  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .btn-text {
    display: none;
  }
  
  .overview-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
