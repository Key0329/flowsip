<template>
  <div class="timer-display" :class="displayClasses">
    <!-- 模式顯示 -->
    <div class="timer-mode">
      <div class="mode-icon">
        <Icon v-if="mode === 'water'" name="mdi:water" />
        <Icon v-else-if="mode === 'pomodoro'" name="mdi:timer" />
        <Icon v-else name="mdi:timer-outline" />
      </div>
      <span class="mode-text">{{ modeText }}</span>
      <span v-if="phase" class="phase-text">- {{ phaseText }}</span>
    </div>

    <!-- 進度環形顯示 -->
    <div class="timer-circle">
      <svg class="circle-svg" viewBox="0 0 120 120">
        <!-- 背景圓環 -->
        <circle
          cx="60"
          cy="60"
          r="54"
          class="circle-bg"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          opacity="0.1"
        />
        <!-- 進度圓環 -->
        <circle
          cx="60"
          cy="60"
          r="54"
          class="circle-progress"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
          :class="{ 'pulsing': isRunning && !isPaused }"
        />
      </svg>
      
      <!-- 時間顯示 -->
      <div class="time-display">
        <div class="time-main" :class="{ 'time-pulsing': isRunning && remaining <= 60000 }">
          {{ formattedTime }}
        </div>
        <div class="time-sub">
          <span v-if="isRunning">{{ statusText }}</span>
          <span v-else-if="remaining === 0 && duration > 0">已完成</span>
          <span v-else>準備開始</span>
        </div>
      </div>
    </div>

    <!-- 詳細資訊 -->
    <div v-if="showDetails" class="timer-details">
      <div class="detail-row">
        <span class="detail-label">總時長</span>
        <span class="detail-value">{{ formatDuration(duration) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">已過時間</span>
        <span class="detail-value">{{ formatDuration(elapsed) }}</span>
      </div>
      <div v-if="pauseCount > 0" class="detail-row">
        <span class="detail-label">暫停次數</span>
        <span class="detail-value">{{ pauseCount }} 次</span>
      </div>
    </div>

    <!-- 狀態指示器 -->
    <div class="status-indicators">
      <div v-if="isRunning" class="status-indicator running">
        <Icon name="mdi:play" />
        <span>運行中</span>
      </div>
      <div v-else-if="isPaused" class="status-indicator paused">
        <Icon name="mdi:pause" />
        <span>已暫停</span>
      </div>
      <div v-else-if="remaining === 0 && duration > 0" class="status-indicator completed">
        <Icon name="mdi:check-circle" />
        <span>已完成</span>
      </div>
      <div v-else class="status-indicator stopped">
        <Icon name="mdi:stop" />
        <span>已停止</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TimerMode, TimerStatus } from '~/types/index'

/**
 * 計時器顯示元件屬性
 */
interface Props {
  /** 計時器模式 */
  mode: TimerMode | null
  
  /** 計時器階段（番茄鐘專用） */
  phase?: 'focus' | 'break'
  
  /** 計時器狀態 */
  status: TimerStatus
  
  /** 總時長（毫秒） */
  duration: number
  
  /** 剩餘時間（毫秒） */
  remaining: number
  
  /** 已過時間（毫秒） */
  elapsed: number
  
  /** 進度百分比 (0-1) */
  progress: number
  
  /** 暫停次數 */
  pauseCount?: number
  
  /** 是否顯示詳細資訊 */
  showDetails?: boolean
  
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  
  /** 主題色彩 */
  variant?: 'water' | 'pomodoro' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  pauseCount: 0,
  showDetails: false,
  size: 'md',
  variant: 'default'
})

// 計算屬性
const isRunning = computed(() => props.status === 'running')
const isPaused = computed(() => props.status === 'paused')

const modeText = computed(() => {
  if (!props.mode) return '計時器'
  return props.mode === 'water' ? '喝水提醒' : '番茄鐘'
})

const phaseText = computed(() => {
  if (!props.phase) return ''
  return props.phase === 'focus' ? '專注時間' : '休息時間'
})

const statusText = computed(() => {
  if (isPaused.value) return '已暫停'
  if (isRunning.value) return '進行中'
  return '準備中'
})

// 時間格式化
const formattedTime = computed(() => {
  return formatTime(props.remaining)
})

// 圓環進度計算
const circumference = 2 * Math.PI * 54 // r = 54
const progressOffset = computed(() => {
  return circumference * (1 - props.progress)
})

// 顯示樣式類別
const displayClasses = computed(() => {
  return {
    [`timer-display--${props.size}`]: true,
    [`timer-display--${props.variant}`]: true,
    'timer-display--running': isRunning.value,
    'timer-display--paused': isPaused.value,
    'timer-display--completed': props.remaining === 0 && props.duration > 0
  }
})

/**
 * 格式化時間顯示（MM:SS 或 HH:MM:SS）
 */
function formatTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 格式化持續時間（用於詳細資訊）
 */
function formatDuration(milliseconds: number): string {
  if (milliseconds === 0) return '0 分鐘'
  
  const totalMinutes = Math.round(milliseconds / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours > 0) {
    return `${hours} 小時 ${minutes} 分鐘`
  }
  
  return `${minutes} 分鐘`
}
</script>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.05);
  border: 1px solid rgb(255 255 255 / 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* 尺寸變體 */
.timer-display--sm {
  padding: 1rem;
  gap: 1rem;
}

.timer-display--lg {
  padding: 3rem;
  gap: 2rem;
}

/* 主題色彩變體 */
.timer-display--water {
  background: rgb(59 130 246 / 0.1);
  border-color: rgb(59 130 246 / 0.2);
  color: rgb(59 130 246);
}

.timer-display--pomodoro {
  background: rgb(239 68 68 / 0.1);
  border-color: rgb(239 68 68 / 0.2);
  color: rgb(239 68 68);
}

/* 狀態變體 */
.timer-display--running {
  box-shadow: 
    0 0 20px rgb(34 197 94 / 0.3),
    0 8px 32px rgb(34 197 94 / 0.1);
  animation: runningGlow 4s ease-in-out infinite;
}

.timer-display--paused {
  box-shadow: 
    0 0 20px rgb(234 179 8 / 0.3),
    0 8px 32px rgb(234 179 8 / 0.1);
  animation: pausedPulse 2s ease-in-out infinite;
}

.timer-display--completed {
  box-shadow: 
    0 0 30px rgb(168 85 247 / 0.4),
    0 12px 48px rgb(168 85 247 / 0.2);
  animation: completedCelebration 1.5s ease-out;
}

@keyframes runningGlow {
  0%, 100% { 
    box-shadow: 
      0 0 20px rgb(34 197 94 / 0.3),
      0 8px 32px rgb(34 197 94 / 0.1);
  }
  50% { 
    box-shadow: 
      0 0 30px rgb(34 197 94 / 0.5),
      0 12px 48px rgb(34 197 94 / 0.2);
  }
}

@keyframes pausedPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes completedCelebration {
  0% { 
    transform: scale(1);
    box-shadow: 
      0 0 30px rgb(168 85 247 / 0.4),
      0 12px 48px rgb(168 85 247 / 0.2);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 
      0 0 50px rgb(168 85 247 / 0.6),
      0 20px 60px rgb(168 85 247 / 0.3);
  }
  100% { 
    transform: scale(1);
    box-shadow: 
      0 0 30px rgb(168 85 247 / 0.4),
      0 12px 48px rgb(168 85 247 / 0.2);
  }
}

/* 模式顯示 */
.timer-mode {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.mode-icon {
  font-size: 1.5rem;
}

.phase-text {
  font-size: 0.875rem;
  opacity: 0.7;
  font-weight: 400;
}

/* 圓環計時器 */
.timer-circle {
  position: relative;
  width: 200px;
  height: 200px;
}

.timer-display--sm .timer-circle {
  width: 150px;
  height: 150px;
}

.timer-display--lg .timer-circle {
  width: 250px;
  height: 250px;
}

.circle-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.circle-progress {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 8px currentColor);
}

.circle-progress.pulsing {
  animation: circleProgress 3s ease-in-out infinite;
}

@keyframes circleProgress {
  0%, 100% { 
    opacity: 1;
    filter: drop-shadow(0 0 8px currentColor);
  }
  25% { 
    opacity: 0.8;
    filter: drop-shadow(0 0 12px currentColor);
  }
  50% { 
    opacity: 0.6;
    filter: drop-shadow(0 0 16px currentColor);
  }
  75% { 
    opacity: 0.8;
    filter: drop-shadow(0 0 12px currentColor);
  }
}

/* 時間顯示 */
.time-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.time-main {
  font-size: 2.5rem;
  font-weight: 700;
  font-family: 'SF Mono', Consolas, monospace;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.timer-display--sm .time-main {
  font-size: 1.875rem;
}

.timer-display--lg .time-main {
  font-size: 3rem;
}

.time-main.time-pulsing {
  animation: timePulse 1s ease-in-out infinite;
  color: rgb(239 68 68);
}

@keyframes timePulse {
  0%, 100% { 
    transform: scale(1);
    color: inherit;
  }
  50% { 
    transform: scale(1.05);
    color: rgb(239 68 68);
  }
}

.time-sub {
  font-size: 0.875rem;
  opacity: 0.7;
  font-weight: 500;
}

/* 詳細資訊 */
.timer-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.detail-label {
  opacity: 0.7;
}

.detail-value {
  font-weight: 600;
  font-family: 'SF Mono', Consolas, monospace;
}

/* 狀態指示器 */
.status-indicators {
  display: flex;
  justify-content: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgb(0 0 0 / 0.1);
  border: 1px solid rgb(255 255 255 / 0.1);
}

.status-indicator.running {
  background: rgb(34 197 94 / 0.1);
  border-color: rgb(34 197 94 / 0.3);
  color: rgb(34 197 94);
}

.status-indicator.paused {
  background: rgb(234 179 8 / 0.1);
  border-color: rgb(234 179 8 / 0.3);
  color: rgb(234 179 8);
}

.status-indicator.completed {
  background: rgb(168 85 247 / 0.1);
  border-color: rgb(168 85 247 / 0.3);
  color: rgb(168 85 247);
}

.status-indicator.stopped {
  background: rgb(148 163 184 / 0.1);
  border-color: rgb(148 163 184 / 0.3);
  color: rgb(148 163 184);
}

/* 響應式設計 */
@media (max-width: 640px) {
  .timer-display {
    padding: 1.5rem 1rem;
  }
  
  .timer-circle {
    width: 180px;
    height: 180px;
  }
  
  .time-main {
    font-size: 2rem;
  }
}
</style>