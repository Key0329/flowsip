<template>
  <div 
    class="loading-spinner"
    :class="[
      `loading-spinner--${variant}`,
      `loading-spinner--${size}`,
      { 'loading-spinner--overlay': overlay }
    ]"
    :style="customStyles"
  >
    <!-- 圓形載入動畫 -->
    <div v-if="variant === 'circle'" class="spinner-circle">
      <svg class="spinner-svg" viewBox="0 0 50 50">
        <circle
          class="spinner-path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <!-- 點點載入動畫 -->
    <div v-else-if="variant === 'dots'" class="spinner-dots">
      <div class="dot" />
      <div class="dot" />
      <div class="dot" />
    </div>

    <!-- 脈動載入動畫 -->
    <div v-else-if="variant === 'pulse'" class="spinner-pulse">
      <div class="pulse-dot" />
    </div>

    <!-- 波浪載入動畫 -->
    <div v-else-if="variant === 'wave'" class="spinner-wave">
      <div class="wave-bar" />
      <div class="wave-bar" />
      <div class="wave-bar" />
      <div class="wave-bar" />
      <div class="wave-bar" />
    </div>

    <!-- 旋轉方塊動畫 -->
    <div v-else-if="variant === 'square'" class="spinner-square">
      <div class="square-item" />
      <div class="square-item" />
      <div class="square-item" />
      <div class="square-item" />
    </div>

    <!-- 水滴主題動畫 -->
    <div v-else-if="variant === 'water'" class="spinner-water">
      <div class="water-drop">
        <Icon name="mdi:water" />
      </div>
    </div>

    <!-- 番茄鐘主題動畫 -->
    <div v-else-if="variant === 'timer'" class="spinner-timer">
      <div class="timer-icon">
        <Icon name="mdi:timer-outline" />
      </div>
    </div>

    <!-- 載入文字 -->
    <div v-if="text" class="loading-text">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 載入狀態動畫元件
 * 支援多種動畫樣式和主題化
 */

export interface Props {
  /** 動畫變體 */
  variant?: 'circle' | 'dots' | 'pulse' | 'wave' | 'square' | 'water' | 'timer'
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 載入文字 */
  text?: string
  /** 是否顯示為遮罩層 */
  overlay?: boolean
  /** 自定義顏色 */
  color?: string
  /** 動畫速度 (毫秒) */
  speed?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'circle',
  size: 'md',
  text: '',
  overlay: false,
  color: '',
  speed: 1200
})

// 自定義樣式
const customStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.color) {
    styles.color = props.color
  }
  
  if (props.speed !== 1200) {
    styles['--spinner-duration'] = `${props.speed}ms`
  }
  
  return styles
})
</script>

<style scoped>
/* 載入器基礎樣式 */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: currentColor;
  --spinner-duration: 1200ms;
}

/* 遮罩層樣式 */
.loading-spinner--overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

/* 尺寸變體 */
.loading-spinner--xs {
  --spinner-size: 16px;
  --text-size: 0.75rem;
}

.loading-spinner--sm {
  --spinner-size: 24px;
  --text-size: 0.875rem;
}

.loading-spinner--md {
  --spinner-size: 32px;
  --text-size: 1rem;
}

.loading-spinner--lg {
  --spinner-size: 48px;
  --text-size: 1.125rem;
}

.loading-spinner--xl {
  --spinner-size: 64px;
  --text-size: 1.25rem;
}

/* ==========================================================================
   圓形載入動畫 (Circle Spinner)
   ========================================================================== */

.spinner-circle {
  width: var(--spinner-size);
  height: var(--spinner-size);
  animation: rotate var(--spinner-duration) linear infinite;
}

.spinner-svg {
  width: 100%;
  height: 100%;
}

.spinner-path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* ==========================================================================
   點點載入動畫 (Dots Spinner)
   ========================================================================== */

.spinner-dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  width: calc(var(--spinner-size) / 4);
  height: calc(var(--spinner-size) / 4);
  background: currentColor;
  border-radius: 50%;
  animation: dotPulse var(--spinner-duration) ease-in-out infinite;
}

.dot:nth-child(1) { animation-delay: 0ms; }
.dot:nth-child(2) { animation-delay: 160ms; }
.dot:nth-child(3) { animation-delay: 320ms; }

@keyframes dotPulse {
  0%, 60%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}

/* ==========================================================================
   脈動載入動畫 (Pulse Spinner)
   ========================================================================== */

.spinner-pulse {
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.pulse-dot {
  width: 100%;
  height: 100%;
  background: currentColor;
  border-radius: 50%;
  animation: pulse var(--spinner-duration) ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* ==========================================================================
   波浪載入動畫 (Wave Spinner)
   ========================================================================== */

.spinner-wave {
  display: flex;
  gap: 0.125rem;
  align-items: flex-end;
  height: var(--spinner-size);
}

.wave-bar {
  width: calc(var(--spinner-size) / 8);
  height: 100%;
  background: currentColor;
  border-radius: calc(var(--spinner-size) / 16);
  animation: waveStretch var(--spinner-duration) ease-in-out infinite;
}

.wave-bar:nth-child(1) { animation-delay: 0ms; }
.wave-bar:nth-child(2) { animation-delay: 100ms; }
.wave-bar:nth-child(3) { animation-delay: 200ms; }
.wave-bar:nth-child(4) { animation-delay: 300ms; }
.wave-bar:nth-child(5) { animation-delay: 400ms; }

@keyframes waveStretch {
  0%, 40%, 100% {
    transform: scaleY(0.3);
  }
  20% {
    transform: scaleY(1);
  }
}

/* ==========================================================================
   旋轉方塊動畫 (Square Spinner)
   ========================================================================== */

.spinner-square {
  position: relative;
  width: var(--spinner-size);
  height: var(--spinner-size);
}

.square-item {
  position: absolute;
  width: calc(var(--spinner-size) / 3);
  height: calc(var(--spinner-size) / 3);
  background: currentColor;
  border-radius: 0.125rem;
  animation: squareRotate var(--spinner-duration) cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}

.square-item:nth-child(1) {
  top: 0;
  left: 0;
  animation-delay: 0ms;
}

.square-item:nth-child(2) {
  top: 0;
  right: 0;
  animation-delay: 150ms;
}

.square-item:nth-child(3) {
  bottom: 0;
  right: 0;
  animation-delay: 300ms;
}

.square-item:nth-child(4) {
  bottom: 0;
  left: 0;
  animation-delay: 450ms;
}

@keyframes squareRotate {
  0%, 10%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.5);
  }
}

/* ==========================================================================
   水滴主題動畫 (Water Theme Spinner)
   ========================================================================== */

.spinner-water {
  width: var(--spinner-size);
  height: var(--spinner-size);
  color: rgb(14, 165, 233); /* 水藍色 */
}

.water-drop {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--spinner-size);
  animation: waterDrop 2s ease-in-out infinite;
}

@keyframes waterDrop {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    filter: drop-shadow(0 0 8px currentColor);
  }
  25% {
    transform: scale(1.1) rotate(90deg);
    filter: drop-shadow(0 0 16px currentColor);
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    filter: drop-shadow(0 0 24px currentColor);
  }
  75% {
    transform: scale(1.1) rotate(270deg);
    filter: drop-shadow(0 0 16px currentColor);
  }
}

/* ==========================================================================
   番茄鐘主題動畫 (Timer Theme Spinner)
   ========================================================================== */

.spinner-timer {
  width: var(--spinner-size);
  height: var(--spinner-size);
  color: rgb(239, 68, 68); /* 番茄紅色 */
}

.timer-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--spinner-size);
  animation: timerTick 1s linear infinite;
}

@keyframes timerTick {
  0% {
    transform: rotate(0deg);
    filter: drop-shadow(0 0 4px currentColor);
  }
  25% {
    transform: rotate(90deg);
    filter: drop-shadow(0 0 8px currentColor);
  }
  50% {
    transform: rotate(180deg);
    filter: drop-shadow(0 0 12px currentColor);
  }
  75% {
    transform: rotate(270deg);
    filter: drop-shadow(0 0 8px currentColor);
  }
  100% {
    transform: rotate(360deg);
    filter: drop-shadow(0 0 4px currentColor);
  }
}

/* ==========================================================================
   載入文字樣式
   ========================================================================== */

.loading-text {
  font-size: var(--text-size);
  font-weight: 500;
  text-align: center;
  color: currentColor;
  opacity: 0.8;
  animation: textFade 2s ease-in-out infinite;
}

@keyframes textFade {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0.4; }
}

/* ==========================================================================
   響應式設計
   ========================================================================== */

@media (max-width: 640px) {
  .loading-spinner {
    gap: 0.75rem;
  }
  
  .loading-spinner--overlay {
    backdrop-filter: blur(2px);
  }
}

/* ==========================================================================
   無障礙和效能優化
   ========================================================================== */

/* 減少動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner *,
  .loading-spinner *::before,
  .loading-spinner *::after {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
  
  .loading-text {
    animation: none;
    opacity: 1;
  }
  
  /* 保留最簡單的旋轉指示 */
  .spinner-circle,
  .water-drop,
  .timer-icon {
    animation: simpleRotate 2s linear infinite;
  }
  
  @keyframes simpleRotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .loading-spinner {
    color: currentColor;
  }
  
  .spinner-water .water-drop {
    color: currentColor;
  }
  
  .spinner-timer .timer-icon {
    color: currentColor;
  }
}

/* GPU 加速優化 */
.spinner-circle,
.pulse-dot,
.water-drop,
.timer-icon {
  will-change: transform;
}

.dot,
.wave-bar,
.square-item {
  will-change: transform, opacity;
}
</style>