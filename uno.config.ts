import { defineConfig, presetUno, presetIcons, presetTypography } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetTypography(),
  ],
  
  // 自訂主題配置
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#06b6d4', // 主要顏色
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
      },
      secondary: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    }
  },
  
  // 自訂規則
  rules: [
    // 計時器專用的大數字樣式
    ['timer-display', {
      'font-family': 'JetBrains Mono, monospace',
      'font-variant-numeric': 'tabular-nums',
      'letter-spacing': '-0.05em'
    }],
    
    // 玻璃形態效果
    ['glass', {
      'backdrop-filter': 'blur(16px) saturate(180%)',
      'background-color': 'rgba(255, 255, 255, 0.75)',
      'border': '1px solid rgba(255, 255, 255, 0.125)'
    }],
    
    // 深色模式玻璃效果
    ['glass-dark', {
      'backdrop-filter': 'blur(16px) saturate(180%)',
      'background-color': 'rgba(17, 25, 40, 0.75)',
      'border': '1px solid rgba(255, 255, 255, 0.125)'
    }]
  ],
  
  // 快捷方式
  shortcuts: {
    'btn-primary': 'bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
    'btn-secondary': 'bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
    'card': 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6',
    'timer-button': 'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95'
  },
  
  // 安全清單
  safelist: [
    'timer-display',
    'glass',
    'glass-dark',
    'btn-primary',
    'btn-secondary',
    'card',
    'timer-button'
  ]
})