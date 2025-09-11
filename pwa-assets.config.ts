/**
 * PWA 資產配置檔案
 * 
 * 用於自動生成 PWA 所需的各種尺寸圖示和啟動畫面
 * 遵循 PWA 最佳實務和 Web App Manifest 規範
 */

import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  // 預設設定集
  preset,
  
  // 來源圖片路徑
  images: [
    // 主要應用程式圖示 (建議至少 512x512)
    'public/logo.svg'
  ],
  
  // 自定義圖示配置
  headLinkOptions: {
    preset: '2023'
  },
  
  // 自定義圖示尺寸和用途
  images: {
    // Apple Touch Icon (iOS 桌面圖示)
    appleTouchIcon: {
      sizes: [180],
      resizeOptions: {
        background: '#3b82f6' // FlowSip 主題色
      }
    },
    
    // 遮罩圖示 (Adaptive Icons)
    maskIcon: {
      resizeOptions: {
        background: '#3b82f6'
      }
    },
    
    // Favicon
    favicon: {
      sizes: [16, 32, 48],
      resizeOptions: {
        background: '#ffffff'
      }
    },
    
    // PWA 圖示
    pwaIcon: {
      sizes: [72, 96, 128, 144, 152, 192, 384, 512],
      purposes: ['maskable', 'any'],
      resizeOptions: {
        background: '#ffffff',
        fit: 'contain',
        position: 'center'
      }
    }
  },
  
  // 自定義 HTML head 連結
  integration: {
    htmlHeadOptions: {
      preset: '2023'
    },
    
    // 基礎圖示路徑
    baseHref: '/',
    
    // 自定義 meta 標籤
    metaTags: {
      // Apple 特定 meta 標籤
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'FlowSip',
      
      // Microsoft 磚片
      'msapplication-TileColor': '#3b82f6',
      'msapplication-tap-highlight': 'no',
      
      // 主題色彩
      'theme-color': [
        {
          media: '(prefers-color-scheme: light)',
          content: '#3b82f6'
        },
        {
          media: '(prefers-color-scheme: dark)', 
          content: '#1e40af'
        }
      ]
    }
  }
})

/**
 * 注意事項：
 * 
 * 1. 需要在 public/ 目錄下準備高解析度的 logo.svg 檔案
 * 2. 建議來源圖片至少 512x512 像素以確保最佳品質
 * 3. 圖示應該是方形且在各種背景色下都能清楚顯示
 * 4. 執行 `pnpm build` 時會自動生成所有需要的圖示
 * 5. 生成的圖示會儲存在 public/icons/ 目錄下
 */