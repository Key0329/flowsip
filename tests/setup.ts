// Vitest 全域設定檔案
import { vi } from 'vitest'

// 模擬瀏覽器 API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // 已棄用
    removeListener: vi.fn(), // 已棄用
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模擬 Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: class MockNotification {
    static permission = 'default'
    static requestPermission = vi.fn().mockResolvedValue('granted')
    
    constructor(_title: string, _options?: NotificationOptions) {
      // 模擬通知建構子
    }
    
    close = vi.fn()
  },
})

// 模擬 localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// 模擬 IndexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  },
  writable: true,
})

// 模擬 Web Worker
Object.defineProperty(window, 'Worker', {
  writable: true,
  value: class MockWorker {
    constructor(_url: string | URL) {
      // 模擬 Worker 建構子
    }
    
    postMessage = vi.fn()
    terminate = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn()
  },
})

// 模擬音效播放
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
})