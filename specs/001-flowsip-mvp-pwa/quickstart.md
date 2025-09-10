# FlowSip PWA 快速開始指南

本指南幫助開發者快速設定和運行 FlowSip 喝水提醒與番茄鐘 PWA 應用程式的開發環境。

## 前置需求

### 系統需求
- **Node.js**: 20.x 或更高版本
- **npm**: 10.x 或更高版本（或 pnpm 8.x）
- **現代瀏覽器**: Chrome 100+, Safari 15+, Firefox 100+

### 開發工具推薦
- **VS Code**: 搭配 Vue 和 TypeScript 擴展
- **Vue DevTools**: 瀏覽器擴展
- **Nuxt DevTools**: 自動安裝

## 專案初始化

### 1. 建立 Nuxt 4 專案
```bash
# 使用 Nuxt 4 建立專案
npx nuxi@latest init flowsip-pwa
cd flowsip-pwa

# 安裝相依套件
npm install
```

### 2. 安裝核心相依套件
```bash
# 安裝 PWA 和樣式相依套件
npm install @vite-pwa/nuxt @unocss/nuxt unocss

# 安裝儲存和工具程式庫
npm install idb @vueuse/core @vueuse/nuxt

# 安裝開發和測試相依套件
npm install -D @nuxt/test-utils vitest @playwright/test
npm install -D @typescript-eslint/config eslint
```

### 3. 配置 Nuxt 4
建立 `nuxt.config.ts`：

```typescript
export default defineNuxtConfig({
  // 基本配置
  ssr: false,
  devtools: { enabled: true },
  
  // 模組
  modules: [
    '@vite-pwa/nuxt',
    '@unocss/nuxt',
    '@vueuse/nuxt'
  ],
  
  // PWA 配置
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'FlowSip - 喝水提醒與番茄鐘',
      short_name: 'FlowSip',
      description: '極簡計時器，幫你規律喝水、專注工作',
      theme_color: '#06b6d4',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      lang: 'zh-TW',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      type: 'module'
    }
  },
  
  // TypeScript 配置
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  // 實驗性功能
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: false
  }
})
```

### 4. 設定 UnoCSS
建立 `uno.config.ts`：

```typescript
import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle'
      }
    })
  ],
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#06b6d4',
        600: '#0891b2',
        900: '#164e63'
      },
      water: {
        50: '#ecfeff',
        500: '#06b6d4',
        600: '#0891b2'
      },
      pomodoro: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626'
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace']
    }
  },
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-colors',
    'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600',
    'btn-secondary': 'btn bg-gray-200 text-gray-900 hover:bg-gray-300',
    'card': 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700',
    'timer-display': 'text-6xl md:text-8xl font-mono font-bold text-center',
    'page-container': 'max-w-md mx-auto px-4 py-8'
  }
})
```

## 專案結構設定

### 5. 建立目錄結構
```bash
# 建立主要目錄
mkdir -p {composables,utils,types,workers,components/{Timer,Stats,Settings,Common}}
mkdir -p {pages,assets/css,public/{icons,sounds}}
mkdir -p tests/{unit,integration,e2e}

# 建立基本檔案
touch app.vue
touch assets/css/main.css
```

### 6. 建立基本型別定義
建立 `types/index.ts`：

```typescript
// 基本型別定義
export type TimerMode = 'water' | 'pomodoro'
export type TimerPhase = 'focus' | 'break'
export type ThemeMode = 'light' | 'dark' | 'auto'

export interface TimerState {
  mode: TimerMode
  duration: number
  remaining: number
  startTimestamp: number | null
  isRunning: boolean
  isPaused: boolean
  phase: TimerPhase | null
  cycleCount: number
}

export interface UserSettings {
  waterInterval: number
  pomodoroFocus: number
  pomodoroBreak: number
  volume: number
  soundEnabled: boolean
  notificationEnabled: boolean
  theme: ThemeMode
  language: 'zh-TW' | 'en'
}

export interface ActivityRecord {
  id: string
  timestamp: number
  date: string
  type: TimerMode
  duration: number
  completed: boolean
  waterAmount?: number
  phase?: TimerPhase
}
```

## 核心功能實作

### 7. 建立 Timer Composable
建立 `composables/useTimer.ts`：

```typescript
export const useTimer = () => {
  const state = ref<TimerState>({
    mode: 'water',
    duration: 0,
    remaining: 0,
    startTimestamp: null,
    isRunning: false,
    isPaused: false,
    phase: null,
    cycleCount: 0
  })
  
  // 計算屬性
  const isRunning = computed(() => state.value.isRunning)
  const isPaused = computed(() => state.value.isPaused)
  const remaining = computed(() => state.value.remaining)
  
  const formattedTime = computed(() => {
    const totalSeconds = Math.ceil(remaining.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })
  
  const progress = computed(() => {
    if (state.value.duration === 0) return 0
    return ((state.value.duration - remaining.value) / state.value.duration) * 100
  })
  
  // Worker 通信
  let worker: Worker | null = null
  
  const initWorker = () => {
    if (process.client && !worker) {
      worker = new Worker('/workers/timer-worker.ts', { type: 'module' })
      worker.onmessage = handleWorkerMessage
    }
  }
  
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, payload } = event.data
    
    switch (type) {
      case 'TIMER_TICK':
        state.value.remaining = payload.remaining
        break
        
      case 'TIMER_COMPLETE':
        state.value.isRunning = false
        state.value.remaining = 0
        // 觸發完成事件
        break
        
      case 'TIMER_STATE':
        state.value = { ...state.value, ...payload }
        break
    }
  }
  
  // 控制方法
  const start = async (mode: TimerMode, duration?: number) => {
    if (!worker) initWorker()
    
    const timerDuration = duration || getDefaultDuration(mode)
    
    state.value = {
      mode,
      duration: timerDuration,
      remaining: timerDuration,
      startTimestamp: Date.now(),
      isRunning: true,
      isPaused: false,
      phase: mode === 'pomodoro' ? 'focus' : null,
      cycleCount: mode === 'pomodoro' ? 1 : 0
    }
    
    worker?.postMessage({
      type: 'START_TIMER',
      id: 'main-timer',
      payload: {
        mode,
        duration: timerDuration,
        startTime: Date.now(),
        phase: state.value.phase
      }
    })
  }
  
  const pause = async () => {
    if (!isRunning.value || isPaused.value) return
    
    state.value.isPaused = true
    worker?.postMessage({
      type: 'PAUSE_TIMER',
      id: 'main-timer',
      payload: { pauseTime: Date.now() }
    })
  }
  
  const resume = async () => {
    if (!isPaused.value) return
    
    state.value.isPaused = false
    worker?.postMessage({
      type: 'RESUME_TIMER',
      id: 'main-timer',
      payload: { resumeTime: Date.now() }
    })
  }
  
  const stop = async () => {
    state.value.isRunning = false
    state.value.isPaused = false
    
    worker?.postMessage({
      type: 'STOP_TIMER',
      id: 'main-timer',
      payload: { stopTime: Date.now(), manual: true }
    })
  }
  
  const reset = async () => {
    state.value = {
      mode: 'water',
      duration: 0,
      remaining: 0,
      startTimestamp: null,
      isRunning: false,
      isPaused: false,
      phase: null,
      cycleCount: 0
    }
  }
  
  const getDefaultDuration = (mode: TimerMode): number => {
    // 從設定讀取，暫時使用預設值
    return mode === 'water' ? 30 * 60 * 1000 : 25 * 60 * 1000
  }
  
  return {
    state: readonly(state),
    isRunning,
    isPaused,
    remaining,
    formattedTime,
    progress,
    start,
    pause,
    resume,
    stop,
    reset
  }
}
```

### 8. 建立主頁面
建立 `pages/index.vue`：

```vue
<template>
  <div class="page-container">
    <!-- 模式選擇 -->
    <div class="flex justify-center mb-8">
      <div class="btn-group">
        <button 
          :class="[
            'btn',
            timer.state.mode === 'water' ? 'btn-primary' : 'btn-secondary'
          ]"
          @click="switchMode('water')"
          :disabled="timer.isRunning"
        >
          💧 喝水
        </button>
        <button 
          :class="[
            'btn',
            timer.state.mode === 'pomodoro' ? 'btn-primary' : 'btn-secondary'
          ]"
          @click="switchMode('pomodoro')"
          :disabled="timer.isRunning"
        >
          🍅 番茄鐘
        </button>
      </div>
    </div>
    
    <!-- 計時器顯示 -->
    <div class="card p-8 mb-8">
      <div 
        class="timer-display mb-4"
        :class="{
          'text-water-500': timer.state.mode === 'water',
          'text-pomodoro-500': timer.state.mode === 'pomodoro'
        }"
      >
        {{ timer.formattedTime }}
      </div>
      
      <!-- 進度條 -->
      <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          class="h-2 rounded-full transition-all duration-1000"
          :class="{
            'bg-water-500': timer.state.mode === 'water',
            'bg-pomodoro-500': timer.state.mode === 'pomodoro'
          }"
          :style="{ width: `${timer.progress}%` }"
        />
      </div>
      
      <!-- 控制按鈕 -->
      <div class="flex justify-center space-x-4">
        <button
          v-if="!timer.isRunning"
          class="btn-primary px-8 py-3 text-lg"
          @click="startTimer"
        >
          開始
        </button>
        
        <template v-else>
          <button
            v-if="!timer.isPaused"
            class="btn-secondary px-6 py-3"
            @click="timer.pause()"
          >
            暫停
          </button>
          <button
            v-else
            class="btn-primary px-6 py-3"
            @click="timer.resume()"
          >
            繼續
          </button>
          
          <button
            class="btn-secondary px-6 py-3 text-red-600"
            @click="timer.stop()"
          >
            停止
          </button>
        </template>
      </div>
    </div>
    
    <!-- 今日統計 -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">今日進度</h3>
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-water-500">0</div>
          <div class="text-sm text-gray-600">喝水次數</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-pomodoro-500">0</div>
          <div class="text-sm text-gray-600">番茄鐘數</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 使用 composables
const timer = useTimer()

// 方法
const switchMode = (mode: 'water' | 'pomodoro') => {
  if (timer.isRunning.value) return
  timer.reset()
  timer.state.mode = mode
}

const startTimer = () => {
  timer.start(timer.state.mode)
}

// SEO
useSeoMeta({
  title: 'FlowSip - 喝水提醒與番茄鐘',
  description: '極簡計時器，幫你規律喝水、專注工作'
})
</script>
```

## 開發與測試

### 9. 設定開發腳本
更新 `package.json`：

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .vue,.js,.ts",
    "lint:fix": "eslint . --ext .vue,.js,.ts --fix",
    "type-check": "vue-tsc --noEmit"
  }
}
```

### 10. 建立基本測試
建立 `tests/unit/useTimer.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { useTimer } from '../../composables/useTimer'

describe('useTimer', () => {
  it('should initialize with default state', () => {
    const timer = useTimer()
    
    expect(timer.isRunning.value).toBe(false)
    expect(timer.isPaused.value).toBe(false)
    expect(timer.remaining.value).toBe(0)
  })
  
  it('should format time correctly', () => {
    const timer = useTimer()
    timer.state.remaining = 90000 // 1分30秒
    
    expect(timer.formattedTime.value).toBe('01:30')
  })
})
```

## 執行專案

### 11. 啟動開發伺服器
```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev
```

### 12. 驗證功能
開啟瀏覽器到 `http://localhost:3000`，驗證：

- [ ] 頁面正常載入
- [ ] 可以切換計時器模式
- [ ] 計時器顯示正確
- [ ] PWA 安裝提示出現（在支援的瀏覽器中）
- [ ] 離線模式正常運作

## 下一步

完成基本設定後，你可以繼續：

1. **實作 Web Worker 計時邏輯** (`workers/timer-worker.ts`)
2. **新增儲存功能** (`composables/useStorage.ts`)
3. **實作通知系統** (`composables/useNotifications.ts`)
4. **建立統計頁面** (`pages/stats.vue`)
5. **新增設定頁面** (`pages/settings.vue`)
6. **完善 PWA 功能**（圖示、快取策略）

## 故障排除

### 常見問題

**Q: PWA 安裝提示不出現？**
A: 確保在 HTTPS 下執行，且滿足 PWA 安裝條件（manifest.json、service worker）

**Q: Web Worker 無法載入？**
A: 檢查 worker 檔案路徑，確保在 `public/workers/` 目錄下

**Q: UnoCSS 樣式不生效？**
A: 確認 `uno.config.ts` 配置正確，重啟開發伺服器

**Q: 型別錯誤？**
A: 執行 `npm run type-check` 檢查型別，確保所有 import 路徑正確

更多協助請參考 [Nuxt 文件](https://nuxt.com/) 和 [專案 README](./README.md)。