<!--
  Statistics Charts Component - FlowSip 統計圖表元件
  
  提供多種圖表類型來視覺化統計資料
  包含線形圖、柱狀圖、圓餅圖等多種顯示模式
  遵循響應式設計和正體中文規範
-->

<template>
  <div class="stats-charts">
    <!-- 圖表類型選擇器 -->
    <div class="chart-type-selector mb-6">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="chartType in chartTypes"
          :key="chartType.id"
          :class="[
            'chart-type-btn',
            activeChartType === chartType.id ? 'active' : ''
          ]"
          @click="setActiveChartType(chartType.id)"
        >
          <span class="chart-type-icon">{{ chartType.icon }}</span>
          <span class="chart-type-label">{{ chartType.label }}</span>
        </button>
      </div>
    </div>

    <!-- 圖表容器 -->
    <div class="chart-container">
      <!-- 載入中狀態 -->
      <div v-if="isLoading" class="chart-loading">
        <div class="loading-spinner"/>
        <p>載入統計資料中...</p>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="error" class="chart-error">
        <div class="error-icon">⚠️</div>
        <p>載入圖表資料失敗</p>
        <button class="retry-btn" @click="retryLoad">重試</button>
      </div>

      <!-- 無資料狀態 -->
      <div v-else-if="!hasData" class="chart-no-data">
        <div class="no-data-icon">📊</div>
        <p>暫無統計資料</p>
        <p class="text-sm text-gray-600">開始使用計時器來建立您的統計資料</p>
      </div>

      <!-- 圖表顯示 -->
      <div v-else class="chart-display">
        <!-- 趨勢線圖 -->
        <div v-if="activeChartType === 'trends'" class="chart-wrapper">
          <Line
            :data="trendsChartData"
            :options="trendsChartOptions"
            :style="chartStyles"
          />
        </div>

        <!-- 活動分布圓餅圖 -->
        <div v-else-if="activeChartType === 'distribution'" class="chart-wrapper">
          <Doughnut
            :data="distributionChartData"
            :options="distributionChartOptions"
            :style="chartStyles"
          />
        </div>

        <!-- 每週統計柱狀圖 -->
        <div v-else-if="activeChartType === 'weekly'" class="chart-wrapper">
          <Bar
            :data="weeklyChartData"
            :options="weeklyChartOptions"
            :style="chartStyles"
          />
        </div>

        <!-- 時數統計區域圖 -->
        <div v-else-if="activeChartType === 'hours'" class="chart-wrapper">
          <Line
            :data="hoursChartData"
            :options="hoursChartOptions"
            :style="chartStyles"
          />
        </div>
      </div>
    </div>

    <!-- 圖表說明 -->
    <div v-if="hasData && !isLoading && !error" class="chart-description mt-4">
      <div class="description-card">
        <h4 class="description-title">{{ activeChartDescription.title }}</h4>
        <p class="description-text">{{ activeChartDescription.description }}</p>
        <div class="description-stats">
          <div
            v-for="stat in activeChartDescription.stats"
            :key="stat.label"
            class="stat-item"
          >
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value">{{ stat.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import { useStats } from '~/composables/useStats'

// 註冊 Chart.js 元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// ============================================================================
// Props 和 Emits
// ============================================================================

interface Props {
  /** 初始圖表類型 */
  initialChartType?: string
  /** 圖表高度 */
  height?: number
  /** 是否顯示圖例 */
  showLegend?: boolean
  /** 是否響應式 */
  responsive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialChartType: 'trends',
  height: 300,
  showLegend: true,
  responsive: true
})

// ============================================================================
// Composables
// ============================================================================

const {
  isLoading,
  error,
  trends,
  summary,
  recalculateStats
} = useStats()

// ============================================================================
// 響應式資料
// ============================================================================

/** 當前活動的圖表類型 */
const activeChartType = ref(props.initialChartType)

/** 圖表類型定義 */
const chartTypes = [
  { id: 'trends', label: '趨勢分析', icon: '📈' },
  { id: 'distribution', label: '活動分布', icon: '🥧' },
  { id: 'weekly', label: '週統計', icon: '📊' },
  { id: 'hours', label: '時數統計', icon: '⏰' }
]

/** 圖表樣式 */
const chartStyles = computed(() => ({
  height: `${props.height}px`,
  position: 'relative' as const
}))

/** 是否有資料 */
const hasData = computed(() => {
  return trends.value.length > 0 && summary.value !== null
})

// ============================================================================
// 圖表資料計算
// ============================================================================

/** 趨勢線圖資料 */
const trendsChartData = computed(() => {
  if (!hasData.value) return { labels: [], datasets: [] }

  const labels = trends.value.map(point => {
    const date = new Date(point.date)
    return date.toLocaleDateString('zh-TW', { 
      month: 'numeric', 
      day: 'numeric' 
    })
  })

  return {
    labels,
    datasets: [
      {
        label: '喝水次數',
        data: trends.value.map(point => point.waterCount),
        borderColor: '#3B82F6', // 藍色
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: '番茄鐘次數',
        data: trends.value.map(point => point.pomodoroCount),
        borderColor: '#EF4444', // 紅色
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

/** 活動分布圓餅圖資料 */
const distributionChartData = computed(() => {
  if (!summary.value) return { labels: [], datasets: [] }

  const waterSessions = summary.value.water.completedSessions
  const pomodoroSessions = summary.value.pomodoro.completedSessions

  return {
    labels: ['喝水', '番茄鐘'],
    datasets: [
      {
        data: [waterSessions, pomodoroSessions],
        backgroundColor: [
          '#3B82F6', // 藍色
          '#EF4444'  // 紅色
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }
})

/** 每週統計柱狀圖資料 */
const weeklyChartData = computed(() => {
  if (!hasData.value) return { labels: [], datasets: [] }

  // 取最近7天的資料
  const recentTrends = trends.value.slice(-7)
  const labels = recentTrends.map(point => {
    const date = new Date(point.date)
    return date.toLocaleDateString('zh-TW', { weekday: 'short' })
  })

  return {
    labels,
    datasets: [
      {
        label: '喝水次數',
        data: recentTrends.map(point => point.waterCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3B82F6',
        borderWidth: 2
      },
      {
        label: '番茄鐘次數',
        data: recentTrends.map(point => point.pomodoroCount),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#EF4444',
        borderWidth: 2
      }
    ]
  }
})

/** 時數統計區域圖資料 */
const hoursChartData = computed(() => {
  if (!hasData.value) return { labels: [], datasets: [] }

  const labels = trends.value.map(point => {
    const date = new Date(point.date)
    return date.toLocaleDateString('zh-TW', { 
      month: 'numeric', 
      day: 'numeric' 
    })
  })

  return {
    labels,
    datasets: [
      {
        label: '專注時數',
        data: trends.value.map(point => point.totalHours),
        borderColor: '#10B981', // 綠色
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// ============================================================================
// 圖表選項配置
// ============================================================================

/** 趨勢線圖選項 */
const trendsChartOptions = computed(() => ({
  responsive: props.responsive,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: '活動趨勢分析',
      font: { size: 16, weight: 'bold' }
    },
    legend: {
      display: props.showLegend,
      position: 'top' as const
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        title: (context: any) => {
          const index = context[0].dataIndex
          const date = trends.value[index]?.date
          if (date) {
            return new Date(date).toLocaleDateString('zh-TW')
          }
          return ''
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: '日期'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: '次數'
      },
      beginAtZero: true
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
}))

/** 活動分布圓餅圖選項 */
const distributionChartOptions = computed(() => ({
  responsive: props.responsive,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: '活動類型分布',
      font: { size: 16, weight: 'bold' }
    },
    legend: {
      display: props.showLegend,
      position: 'bottom' as const
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = Math.round((context.raw / total) * 100)
          return `${context.label}: ${context.raw} 次 (${percentage}%)`
        }
      }
    }
  }
}))

/** 每週統計柱狀圖選項 */
const weeklyChartOptions = computed(() => ({
  responsive: props.responsive,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: '最近一週統計',
      font: { size: 16, weight: 'bold' }
    },
    legend: {
      display: props.showLegend,
      position: 'top' as const
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: '星期'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: '次數'
      },
      beginAtZero: true
    }
  }
}))

/** 時數統計區域圖選項 */
const hoursChartOptions = computed(() => ({
  responsive: props.responsive,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: '每日專注時數',
      font: { size: 16, weight: 'bold' }
    },
    legend: {
      display: props.showLegend,
      position: 'top' as const
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.raw.toFixed(2)} 小時`
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: '日期'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: '時數'
      },
      beginAtZero: true
    }
  }
}))

// ============================================================================
// 圖表描述資料
// ============================================================================

/** 當前圖表描述 */
const activeChartDescription = computed(() => {
  if (!summary.value) return { title: '', description: '', stats: [] }

  switch (activeChartType.value) {
    case 'trends':
      return {
        title: '趨勢分析說明',
        description: '顯示您的喝水和番茄鐘活動隨時間的變化趨勢',
        stats: [
          { 
            label: '總活動數', 
            value: `${summary.value.water.completedSessions + summary.value.pomodoro.completedSessions} 次` 
          },
          { 
            label: '平均每日', 
            value: `${((summary.value.water.completedSessions + summary.value.pomodoro.completedSessions) / Math.max(summary.value.totalDays, 1)).toFixed(1)} 次` 
          }
        ]
      }

    case 'distribution':
      return {
        title: '活動分布說明',
        description: '顯示喝水和番茄鐘活動的比例分布',
        stats: [
          { label: '喝水比例', value: `${summary.value.water.completedSessions} 次` },
          { label: '番茄鐘比例', value: `${summary.value.pomodoro.completedSessions} 次` }
        ]
      }

    case 'weekly':
      return {
        title: '週統計說明',
        description: '顯示最近一週每日的活動統計',
        stats: [
          { label: '最活躍日', value: summary.value.total.mostActiveDay },
          { label: '週平均', value: `${((summary.value.water.completedSessions + summary.value.pomodoro.completedSessions) / 7).toFixed(1)} 次/日` }
        ]
      }

    case 'hours':
      return {
        title: '時數統計說明',
        description: '顯示每日的專注時數變化',
        stats: [
          { 
            label: '總專注時數', 
            value: `${(summary.value.total.activeTime / (60 * 60 * 1000)).toFixed(1)} 小時` 
          },
          { 
            label: '日平均時數', 
            value: `${(summary.value.total.activeTime / Math.max(summary.value.totalDays, 1) / (60 * 60 * 1000)).toFixed(1)} 小時` 
          }
        ]
      }

    default:
      return { title: '', description: '', stats: [] }
  }
})

// ============================================================================
// 方法
// ============================================================================

/** 設定活動圖表類型 */
function setActiveChartType(chartType: string) {
  activeChartType.value = chartType
}

/** 重試載入 */
async function retryLoad() {
  await recalculateStats()
}

// ============================================================================
// 生命週期
// ============================================================================

onMounted(() => {
  // 初始載入統計資料
  if (!hasData.value && !isLoading.value) {
    recalculateStats()
  }
})

// 監聽統計資料變化，自動刷新圖表
watch([trends, summary], () => {
  // 資料更新時，圖表會自動重新渲染
})
</script>

<style scoped>
.stats-charts {
  @apply w-full;
}

.chart-type-selector {
  @apply border-b border-gray-200 dark:border-gray-700;
}

.chart-type-btn {
  @apply flex flex-col items-center gap-1 px-4 py-3 min-w-fit;
  @apply rounded-lg border-2 border-gray-200 bg-white;
  @apply text-gray-600 text-sm font-medium;
  @apply transition-all duration-200;
  @apply hover:border-blue-300 hover:bg-blue-50;
  @apply dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300;
  @apply dark:hover:border-blue-600 dark:hover:bg-blue-900;
}

.chart-type-btn.active {
  @apply border-blue-500 bg-blue-50 text-blue-700;
  @apply dark:border-blue-400 dark:bg-blue-900 dark:text-blue-300;
}

.chart-type-icon {
  @apply text-lg;
}

.chart-type-label {
  @apply whitespace-nowrap;
}

.chart-container {
  @apply min-h-[300px] flex items-center justify-center;
}

.chart-loading,
.chart-error,
.chart-no-data {
  @apply flex flex-col items-center justify-center gap-4 p-8;
  @apply text-center;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.no-data-icon {
  @apply text-4xl;
}

.retry-btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-lg;
  @apply hover:bg-blue-600 transition-colors;
  @apply dark:bg-blue-600 dark:hover:bg-blue-700;
}

.chart-wrapper {
  @apply w-full;
}

.chart-description {
  @apply mt-6;
}

.description-card {
  @apply bg-gray-50 rounded-lg p-4;
  @apply dark:bg-gray-800;
}

.description-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
  @apply dark:text-gray-100;
}

.description-text {
  @apply text-gray-600 mb-4;
  @apply dark:text-gray-300;
}

.description-stats {
  @apply grid grid-cols-2 gap-4;
}

.stat-item {
  @apply flex justify-between items-center;
}

.stat-label {
  @apply text-sm text-gray-500;
  @apply dark:text-gray-400;
}

.stat-value {
  @apply text-sm font-medium text-gray-900;
  @apply dark:text-gray-100;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .chart-type-btn {
    @apply px-3 py-2 text-xs;
  }
  
  .chart-type-icon {
    @apply text-base;
  }
  
  .description-stats {
    @apply grid-cols-1 gap-2;
  }
}
</style>