// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // 全域設定
    languageOptions: {
      globals: {
        // Web Worker 全域變數
        Worker: 'readonly',
        // IndexedDB 全域變數
        indexedDB: 'readonly',
        // 瀏覽器 API
        Notification: 'readonly',
      }
    },
    
    // 專案特定規則
    rules: {
      // Vue/Nuxt 相關
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      
      // TypeScript 相關
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 通用程式碼品質
      'no-console': 'warn',
      'no-debugger': 'warn',
      
      // 註解規則（支援正體中文）
      'spaced-comment': ['error', 'always', { 
        markers: ['/'],
        exceptions: ['-', '+', '*']
      }],
      
      // 匯入排序
      'sort-imports': 'off', // 關閉內建的，使用外掛版本
    },
    
    // 忽略特定檔案
    ignores: [
      'dist/**',
      '.nuxt/**',
      '.output/**',
      'node_modules/**',
      '*.d.ts',
      'public/**',
    ]
  }
)
