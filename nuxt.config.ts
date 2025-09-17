// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false, // PWA 單頁應用模式
  devtools: { enabled: true },
  
  // 模組配置
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@vite-pwa/nuxt',
    // '@unocss/nuxt', // 暫時註解，等後續修復相容性問題
    '@vueuse/nuxt'
  ],

  // PWA 配置
  pwa: {
    mode: 'production',
    registerType: 'autoUpdate',
    base: '/',
    scope: '/',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    
    // Manifest 配置
    manifest: {
      name: 'FlowSip - 喝水提醒與番茄鐘',
      short_name: 'FlowSip',
      description: '極簡計時器 PWA，幫你規律喝水、專注工作，支援背景計時和離線使用',
      theme_color: '#3b82f6', // 主題藍色
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      lang: 'zh-TW',
      dir: 'ltr',
      categories: ['productivity', 'health', 'lifestyle'],
      
      // 圖示配置 (MVP 階段使用 SVG，後續可生成 PNG)
      icons: [
        {
          src: '/icons/icon-72x72.svg',
          sizes: '72x72',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/icons/icon-144x144.svg',
          sizes: '144x144',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/icons/icon-192x192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/icons/icon-512x512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/logo.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'maskable'
        }
      ],
      
      // 快捷方式 (MVP 階段暫時使用主圖示)
      shortcuts: [
        {
          name: '30分鐘喝水提醒',
          short_name: '喝水',
          description: '開始30分鐘喝水計時',
          url: '/?mode=water',
          icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }]
        },
        {
          name: '25分鐘番茄鐘',
          short_name: '番茄鐘',
          description: '開始25分鐘專注時間',
          url: '/?mode=pomodoro',
          icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }]
        }
      ],
      
      // 螢幕截圖（用於應用商店）
      screenshots: [
        {
          src: '/screenshots/desktop-1.png',
          type: 'image/png',
          sizes: '1280x720',
          form_factor: 'wide',
          label: '主計時器介面'
        },
        {
          src: '/screenshots/mobile-1.png',
          type: 'image/png',
          sizes: '390x844',
          form_factor: 'narrow',
          label: '行動版計時器'
        }
      ]
    },
    
    // Workbox 配置 (Service Worker) - 簡化版本
    workbox: {
      navigateFallback: '/',
      
      // 基本快取策略
      runtimeCaching: [
        // 音效檔案
        {
          urlPattern: /\.(mp3|wav|ogg)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'audio-cache',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 30
            }
          }
        },
        
        // 圖片檔案
        {
          urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30
            }
          }
        },
        
        // 字型檔案
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365
            }
          }
        }
      ],
      
      // 預快取檔案
      globPatterns: [
        '**/*.{js,css,html}',
        'sounds/*.{mp3,ogg}',
        'icons/*.{svg,png}'
      ],
      
      // 清理設定
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true
    },
    
    // 開發模式配置
    devOptions: {
      enabled: false, // 開發時不啟用 PWA
      type: 'module'
    },
    
    // 自動更新設定
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 20 // 20秒檢查一次更新
    }
  },

  // UnoCSS 配置
  unocss: {
    // 配置將在單獨的檔案中設定
  },

  // Vite 配置（用於 Web Worker 和程式碼分割優化）
  vite: {
    worker: {
      format: 'es'
    },
    build: {
      rollupOptions: {
        output: {
          // 手動程式碼分割 (基於模組 ID)
          manualChunks(id) {
            // Vue 核心庫
            if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
              return 'vue-vendor'
            }
            // 統計相關模組
            if (id.includes('composables/useStats') || id.includes('components/Stats/')) {
              return 'stats'
            }
            // 設定和主題相關
            if (id.includes('composables/useSettings') || id.includes('composables/useTheme') || id.includes('components/Settings/')) {
              return 'settings'
            }
            // 音效和通知相關
            if (id.includes('composables/useSounds') || id.includes('composables/useNotifications')) {
              return 'media'
            }
            // PWA 相關元件
            if (id.includes('components/PWA/') || id.includes('components/Common/OfflineIndicator')) {
              return 'pwa'
            }
            // 第三方庫
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          }
        }
      },
      // 啟用程式碼分割
      cssCodeSplit: true,
      // 資源內聯限制 (小於 4KB 的資源內聯)
      assetsInlineLimit: 4096,
      // 移除 console 和 debugger
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  },

  // CSS 配置
  css: [
    '~/assets/styles/global.css'
  ],

  // TypeScript 配置（MVP 階段簡化）
  typescript: {
    strict: false,
    typeCheck: false
  },

  // 實驗性功能和效能優化
  experimental: {
    // 啟用負載平衡
    payloadExtraction: false,
    // 啟用內聯根元件樣式
    inlineSSRStyles: false
  },

  // Nitro 配置 (針對 SSG 模式優化)
  nitro: {
    // 預渲染路由
    prerender: {
      routes: ['/stats', '/settings', '/about']
    },
    // 壓縮設定
    compressPublicAssets: true,
    // 實驗性功能
    experimental: {
      wasm: false
    }
  },

  // 路由配置
  router: {
    // 啟用路由預取
    prefetchLinks: true,
    // 懶載入頁面
    options: {
      strict: false
    }
  },

  // 效能相關配置
  app: {
    // 頭部配置
    head: {
      // 預載入關鍵資源
      link: [
        { rel: 'preload', href: '/sounds/notification.mp3', as: 'audio' },
        { rel: 'preload', href: '/sounds/tick.mp3', as: 'audio' }
      ]
    }
  }
})