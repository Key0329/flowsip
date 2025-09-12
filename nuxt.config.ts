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
    
    // Workbox 配置 (Service Worker)
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api/],
      
      // 快取策略
      runtimeCaching: [
        // 音效檔案 - 快取優先
        {
          urlPattern: /^https:\/\/.*\.(?:mp3|wav|ogg)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'audio-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
            }
          }
        },
        
        // 圖片 - 快取優先
        {
          urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
            }
          }
        },
        
        // API 請求 - 網路優先
        {
          urlPattern: /^https:\/\/.*\/api\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 // 1天
            }
          }
        }
      ],
      
      // 預快取檔案
      globPatterns: [
        '**/*.{js,css,html,png,svg,ico}',
        'sounds/*.{mp3,wav,ogg}',
        'icons/*.png'
      ],
      
      // 排除不需要快取的檔案
      globIgnores: [
        '**/node_modules/**/*',
        'sw.js',
        'workbox-*.js'
      ],
      
      // 清理過期快取
      cleanupOutdatedCaches: true,
      
      // 跳過等待
      skipWaiting: true,
      
      // 立即控制客戶端
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

  // Vite 配置（用於 Web Worker）
  vite: {
    worker: {
      format: 'es'
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
  }
})