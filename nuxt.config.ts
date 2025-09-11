// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false, // PWA 單頁應用模式
  devtools: { enabled: true },
  
  // 模組配置
  modules: [
    '@nuxt/eslint',
    '@vite-pwa/nuxt',
    // '@unocss/nuxt', // 暫時註解，等後續修復相容性問題
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
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
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

  // TypeScript 配置（MVP 階段簡化）
  typescript: {
    strict: false,
    typeCheck: false
  }
})