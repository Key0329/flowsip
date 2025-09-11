import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '~/types': resolve(__dirname, 'types'),
      '~/utils': resolve(__dirname, 'utils'),
      '~/composables': resolve(__dirname, 'composables')
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    typecheck: {
      enabled: false // 暫時關閉類型檢查
    }
  }
})