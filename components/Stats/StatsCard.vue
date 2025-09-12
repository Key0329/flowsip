<!--
  Statistics Card Component - FlowSip 統計卡片元件
  
  提供美觀的卡片式統計資料展示
  包含數值顯示、變化趨勢、圖示等視覺元素
  遵循響應式設計和正體中文規範
-->

<template>
  <div :class="cardClasses">
    <!-- 卡片頭部 -->
    <div class="card-header">
      <div class="card-icon-wrapper">
        <div :class="iconClasses">
          {{ cardIcon }}
        </div>
      </div>
      
      <div class="card-title-section">
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </div>
      
      <!-- 趨勢指示器 -->
      <div v-if="showTrend && trend !== undefined" class="trend-indicator">
        <div :class="trendClasses">
          <span class="trend-icon">{{ trendIcon }}</span>
          <span class="trend-value">{{ formatTrend(trend) }}</span>
        </div>
      </div>
    </div>

    <!-- 主要數值 -->
    <div class="card-body">
      <div class="main-value-section">
        <div class="main-value">{{ formattedValue }}</div>
        <div v-if="unit" class="value-unit">{{ unit }}</div>
      </div>
      
      <!-- 次要資訊 -->
      <div v-if="secondaryInfo && secondaryInfo.length > 0" class="secondary-info">
        <div
          v-for="info in secondaryInfo"
          :key="info.label"
          class="secondary-item"
        >
          <span class="secondary-label">{{ info.label }}</span>
          <span class="secondary-value">{{ info.value }}</span>
        </div>
      </div>
      
      <!-- 迷你圖表 -->
      <div v-if="showMiniChart && chartData && chartData.length > 0" class="mini-chart">
        <svg
          :width="chartWidth"
          :height="chartHeight"
          class="mini-chart-svg"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        >
          <path
            :d="chartPath"
            :stroke="chartColor"
            stroke-width="2"
            fill="none"
            class="chart-line"
          />
          <path
            :d="chartAreaPath"
            :fill="chartAreaColor"
            class="chart-area"
          />
        </svg>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div v-if="showFooter" class="card-footer">
      <div class="footer-content">
        <span v-if="lastUpdated" class="last-updated">
          更新時間：{{ formatTime(lastUpdated) }}
        </span>
        
        <div v-if="actions && actions.length > 0" class="card-actions">
          <button
            v-for="action in actions"
            :key="action.label"
            :class="actionButtonClasses"
            @click="action.onClick"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================================================
// Types
// ============================================================================

interface SecondaryInfo {
  label: string
  value: string
}

interface Action {
  label: string
  onClick: () => void
}

interface Props {
  /** 卡片標題 */
  title: string
  /** 副標題 */
  subtitle?: string
  /** 主要數值 */
  value: number | string
  /** 數值單位 */
  unit?: string
  /** 卡片圖示 */
  icon?: string
  /** 卡片類型，影響顏色主題 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** 趨勢值（百分比） */
  trend?: number
  /** 是否顯示趨勢 */
  showTrend?: boolean
  /** 次要資訊 */
  secondaryInfo?: SecondaryInfo[]
  /** 是否顯示迷你圖表 */
  showMiniChart?: boolean
  /** 迷你圖表資料 */
  chartData?: number[]
  /** 迷你圖表寬度 */
  chartWidth?: number
  /** 迷你圖表高度 */
  chartHeight?: number
  /** 是否顯示底部 */
  showFooter?: boolean
  /** 最後更新時間 */
  lastUpdated?: Date
  /** 操作按鈕 */
  actions?: Action[]
  /** 卡片大小 */
  size?: 'small' | 'medium' | 'large'
  /** 是否載入中 */
  loading?: boolean
  /** 是否可點擊 */
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  showTrend: false,
  showMiniChart: false,
  chartWidth: 80,
  chartHeight: 30,
  showFooter: false,
  size: 'medium',
  loading: false,
  clickable: false
})

const emit = defineEmits<{
  click: []
}>()

// ============================================================================
// 計算屬性
// ============================================================================

/** 卡片類別 */
const cardClasses = computed(() => [
  'stats-card',
  `stats-card--${props.type}`,
  `stats-card--${props.size}`,
  {
    'stats-card--loading': props.loading,
    'stats-card--clickable': props.clickable
  }
])

/** 圖示類別 */
const iconClasses = computed(() => [
  'card-icon',
  `card-icon--${props.type}`
])

/** 卡片圖示 */
const cardIcon = computed(() => {
  if (props.icon) return props.icon
  
  // 根據類型提供預設圖示
  switch (props.type) {
    case 'primary': return '📊'
    case 'success': return '✅'
    case 'warning': return '⚠️'
    case 'danger': return '🚨'
    case 'info': return 'ℹ️'
    default: return '📈'
  }
})

/** 格式化的主要數值 */
const formattedValue = computed(() => {
  if (props.loading) return '---'
  
  if (typeof props.value === 'number') {
    // 根據數值大小決定格式
    if (props.value >= 1000) {
      return (props.value / 1000).toFixed(1) + 'K'
    }
    if (props.value % 1 === 0) {
      return props.value.toString()
    }
    return props.value.toFixed(1)
  }
  
  return props.value
})

/** 趨勢類別 */
const trendClasses = computed(() => [
  'trend',
  {
    'trend--positive': props.trend !== undefined && props.trend > 0,
    'trend--negative': props.trend !== undefined && props.trend < 0,
    'trend--neutral': props.trend === 0
  }
])

/** 趨勢圖示 */
const trendIcon = computed(() => {
  if (props.trend === undefined) return ''
  if (props.trend > 0) return '📈'
  if (props.trend < 0) return '📉'
  return '➡️'
})

/** 操作按鈕類別 */
const actionButtonClasses = computed(() => [
  'action-button',
  `action-button--${props.type}`
])

/** 迷你圖表路徑 */
const chartPath = computed(() => {
  if (!props.chartData || props.chartData.length === 0) return ''
  
  const data = props.chartData
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const range = maxValue - minValue || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * props.chartWidth
    const y = props.chartHeight - ((value - minValue) / range) * props.chartHeight
    return `${x},${y}`
  })
  
  return `M ${points.join(' L ')}`
})

/** 迷你圖表區域路徑 */
const chartAreaPath = computed(() => {
  if (!props.chartData || props.chartData.length === 0) return ''
  
  const linePath = chartPath.value.replace('M ', '')
  const firstPoint = linePath.split(' L ')[0]
  const lastPoint = linePath.split(' L ').pop()
  
  if (!firstPoint || !lastPoint) return ''
  
  const firstX = firstPoint.split(',')[0]
  const lastX = lastPoint.split(',')[0]
  
  return `M ${firstX},${props.chartHeight} L ${linePath} L ${lastX},${props.chartHeight} Z`
})

/** 圖表顏色 */
const chartColor = computed(() => {
  switch (props.type) {
    case 'primary': return '#3B82F6'
    case 'success': return '#10B981'
    case 'warning': return '#F59E0B'
    case 'danger': return '#EF4444'
    case 'info': return '#06B6D4'
    default: return '#6B7280'
  }
})

/** 圖表區域顏色 */
const chartAreaColor = computed(() => {
  switch (props.type) {
    case 'primary': return 'rgba(59, 130, 246, 0.1)'
    case 'success': return 'rgba(16, 185, 129, 0.1)'
    case 'warning': return 'rgba(245, 158, 11, 0.1)'
    case 'danger': return 'rgba(239, 68, 68, 0.1)'
    case 'info': return 'rgba(6, 182, 212, 0.1)'
    default: return 'rgba(107, 114, 128, 0.1)'
  }
})

// ============================================================================
// 方法
// ============================================================================

/** 格式化趨勢值 */
function formatTrend(trend: number): string {
  const abs = Math.abs(trend)
  return `${abs.toFixed(1)}%`
}

/** 格式化時間 */
function formatTime(date: Date): string {
  return date.toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** 處理卡片點擊 */
function handleCardClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.stats-card {
  @apply bg-white rounded-xl shadow-sm border border-gray-200;
  @apply transition-all duration-200;
  @apply dark:bg-gray-800 dark:border-gray-700;
}

.stats-card--clickable {
  @apply cursor-pointer hover:shadow-md hover:scale-[1.02];
  @apply active:scale-[0.98];
}

.stats-card--loading {
  @apply opacity-60 pointer-events-none;
}

/* 卡片大小變體 */
.stats-card--small {
  @apply p-4;
}

.stats-card--medium {
  @apply p-5;
}

.stats-card--large {
  @apply p-6;
}

/* 卡片類型顏色變體 */
.stats-card--primary {
  @apply border-l-4 border-l-blue-500;
}

.stats-card--success {
  @apply border-l-4 border-l-green-500;
}

.stats-card--warning {
  @apply border-l-4 border-l-yellow-500;
}

.stats-card--danger {
  @apply border-l-4 border-l-red-500;
}

.stats-card--info {
  @apply border-l-4 border-l-cyan-500;
}

/* 頭部區域 */
.card-header {
  @apply flex items-start justify-between mb-4;
}

.card-icon-wrapper {
  @apply flex-shrink-0 mr-3;
}

.card-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-lg;
}

.card-icon--primary {
  @apply bg-blue-100 text-blue-600;
  @apply dark:bg-blue-900 dark:text-blue-300;
}

.card-icon--success {
  @apply bg-green-100 text-green-600;
  @apply dark:bg-green-900 dark:text-green-300;
}

.card-icon--warning {
  @apply bg-yellow-100 text-yellow-600;
  @apply dark:bg-yellow-900 dark:text-yellow-300;
}

.card-icon--danger {
  @apply bg-red-100 text-red-600;
  @apply dark:bg-red-900 dark:text-red-300;
}

.card-icon--info {
  @apply bg-cyan-100 text-cyan-600;
  @apply dark:bg-cyan-900 dark:text-cyan-300;
}

.card-title-section {
  @apply flex-grow min-w-0;
}

.card-title {
  @apply text-sm font-medium text-gray-600 truncate;
  @apply dark:text-gray-300;
}

.card-subtitle {
  @apply text-xs text-gray-500 mt-1;
  @apply dark:text-gray-400;
}

/* 趨勢指示器 */
.trend-indicator {
  @apply flex-shrink-0;
}

.trend {
  @apply flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium;
}

.trend--positive {
  @apply bg-green-100 text-green-700;
  @apply dark:bg-green-900 dark:text-green-300;
}

.trend--negative {
  @apply bg-red-100 text-red-700;
  @apply dark:bg-red-900 dark:text-red-300;
}

.trend--neutral {
  @apply bg-gray-100 text-gray-700;
  @apply dark:bg-gray-700 dark:text-gray-300;
}

.trend-icon {
  @apply text-xs;
}

.trend-value {
  @apply font-semibold;
}

/* 主體區域 */
.card-body {
  @apply space-y-3;
}

.main-value-section {
  @apply flex items-end gap-2;
}

.main-value {
  @apply text-2xl font-bold text-gray-900;
  @apply dark:text-gray-100;
}

.stats-card--small .main-value {
  @apply text-xl;
}

.stats-card--large .main-value {
  @apply text-3xl;
}

.value-unit {
  @apply text-sm text-gray-500 pb-1;
  @apply dark:text-gray-400;
}

/* 次要資訊 */
.secondary-info {
  @apply space-y-2;
}

.secondary-item {
  @apply flex justify-between items-center;
}

.secondary-label {
  @apply text-xs text-gray-500;
  @apply dark:text-gray-400;
}

.secondary-value {
  @apply text-sm font-medium text-gray-900;
  @apply dark:text-gray-100;
}

/* 迷你圖表 */
.mini-chart {
  @apply flex justify-end;
}

.mini-chart-svg {
  @apply overflow-visible;
}

.chart-line {
  @apply drop-shadow-sm;
}

.chart-area {
  @apply opacity-20;
}

/* 底部區域 */
.card-footer {
  @apply mt-4 pt-4 border-t border-gray-100;
  @apply dark:border-gray-700;
}

.footer-content {
  @apply flex justify-between items-center;
}

.last-updated {
  @apply text-xs text-gray-400;
  @apply dark:text-gray-500;
}

.card-actions {
  @apply flex gap-2;
}

.action-button {
  @apply px-3 py-1 text-xs font-medium rounded-md;
  @apply transition-colors duration-200;
}

.action-button--primary {
  @apply bg-blue-50 text-blue-600 hover:bg-blue-100;
  @apply dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800;
}

.action-button--success {
  @apply bg-green-50 text-green-600 hover:bg-green-100;
  @apply dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800;
}

.action-button--warning {
  @apply bg-yellow-50 text-yellow-600 hover:bg-yellow-100;
  @apply dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800;
}

.action-button--danger {
  @apply bg-red-50 text-red-600 hover:bg-red-100;
  @apply dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800;
}

.action-button--info {
  @apply bg-cyan-50 text-cyan-600 hover:bg-cyan-100;
  @apply dark:bg-cyan-900 dark:text-cyan-300 dark:hover:bg-cyan-800;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .card-header {
    @apply flex-col gap-3;
  }
  
  .card-icon-wrapper {
    @apply mr-0;
  }
  
  .trend-indicator {
    @apply self-start;
  }
  
  .main-value {
    @apply text-xl;
  }
  
  .stats-card--large .main-value {
    @apply text-2xl;
  }
}

/* 載入動畫 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stats-card--loading .main-value {
  animation: pulse 2s infinite;
}
</style>