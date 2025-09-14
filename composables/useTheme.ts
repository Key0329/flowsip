/**
 * FlowSip 主題管理 Composable
 * 
 * 提供主題切換、持久化和動態樣式管理功能
 * 支援淺色/深色模式、高對比度、系統偏好自動檢測
 * 
 * @example
 * ```typescript
 * const { 
 *   currentTheme, 
 *   toggleTheme, 
 *   setTheme, 
 *   isDark,
 *   isHighContrast 
 * } = useTheme()
 * 
 * // 切換主題
 * toggleTheme()
 * 
 * // 設定特定主題
 * setTheme('dark')
 * ```
 */

import { computed, ref, watch } from 'vue'

/**
 * 主題類型
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 主題設定介面
 */
export interface ThemeSettings {
  /** 當前主題模式 */
  mode: ThemeMode
  /** 是否啟用高對比度 */
  highContrast: boolean
  /** 是否跟隨系統設定 */
  followSystem: boolean
  /** 自訂色彩主題（未來擴展用） */
  customColors?: Record<string, string>
}

/**
 * 主題資訊介面
 */
export interface ThemeInfo {
  /** 主題唯一標識 */
  key: ThemeMode
  /** 主題顯示名稱 */
  name: string
  /** 主題描述 */
  description: string
  /** 主題圖示 */
  icon: string
  /** 預設狀態 */
  isDefault?: boolean
}

/**
 * 可用主題清單
 */
const AVAILABLE_THEMES: ThemeInfo[] = [
  {
    key: 'light',
    name: '淺色模式',
    description: '清新明亮的介面設計',
    icon: 'mdi:white-balance-sunny'
  },
  {
    key: 'dark',
    name: '深色模式', 
    description: '護眼的深色介面設計',
    icon: 'mdi:moon-waning-crescent'
  },
  {
    key: 'auto',
    name: '跟隨系統',
    description: '根據系統設定自動切換',
    icon: 'mdi:theme-light-dark',
    isDefault: true
  }
]

/**
 * 預設主題設定
 */
const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'auto',
  highContrast: false,
  followSystem: true
}

/**
 * 儲存鍵名
 */
const STORAGE_KEY = 'flowsip-theme-settings'

export const useTheme = () => {
  // 響應式狀態
  const settings = ref<ThemeSettings>({ ...DEFAULT_THEME_SETTINGS })
  const systemPrefersDark = ref(false)
  const isInitialized = ref(false)
  
  // Media Query 監聽器
  let systemThemeQuery: MediaQueryList | null = null
  let contrastQuery: MediaQueryList | null = null

  // 計算屬性
  const currentTheme = computed(() => settings.value.mode)
  
  const isDark = computed(() => {
    if (settings.value.mode === 'auto') {
      return systemPrefersDark.value
    }
    return settings.value.mode === 'dark'
  })
  
  const isLight = computed(() => !isDark.value)
  
  const isHighContrast = computed(() => settings.value.highContrast)
  
  const isAuto = computed(() => settings.value.mode === 'auto')
  
  const effectiveTheme = computed((): 'light' | 'dark' => {
    return isDark.value ? 'dark' : 'light'
  })
  
  const availableThemes = computed(() => AVAILABLE_THEMES)
  
  const currentThemeInfo = computed(() => {
    return AVAILABLE_THEMES.find(theme => theme.key === currentTheme.value) || AVAILABLE_THEMES[2]
  })

  /**
   * 從本地存儲載入設定
   */
  function loadSettings(): void {
    if (!import.meta.client) return
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ThemeSettings>
        settings.value = { ...DEFAULT_THEME_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.warn('載入主題設定失敗:', error)
      settings.value = { ...DEFAULT_THEME_SETTINGS }
    }
  }

  /**
   * 保存設定到本地存儲
   */
  function saveSettings(): void {
    if (!import.meta.client) return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    } catch (error) {
      console.error('保存主題設定失敗:', error)
    }
  }

  /**
   * 檢測系統主題偏好
   */
  function detectSystemTheme(): void {
    if (!import.meta.client) return
    
    try {
      systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemPrefersDark.value = systemThemeQuery.matches
      
      // 監聽系統主題變更
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        systemPrefersDark.value = e.matches
        if (settings.value.followSystem) {
          applyTheme()
        }
      }
      
      systemThemeQuery.addListener?.(handleSystemThemeChange) || 
      systemThemeQuery.addEventListener('change', handleSystemThemeChange)
    } catch (error) {
      console.warn('檢測系統主題偏好失敗:', error)
      systemPrefersDark.value = false
    }
  }

  /**
   * 檢測系統高對比度偏好
   */
  function detectSystemContrast(): void {
    if (!import.meta.client) return
    
    try {
      contrastQuery = window.matchMedia('(prefers-contrast: high)')
      
      // 如果用戶未手動設定，跟隨系統偏好
      if (!localStorage.getItem(STORAGE_KEY)) {
        settings.value.highContrast = contrastQuery.matches
      }
      
      const handleContrastChange = (e: MediaQueryListEvent) => {
        if (settings.value.followSystem) {
          settings.value.highContrast = e.matches
          applyTheme()
          saveSettings()
        }
      }
      
      contrastQuery.addListener?.(handleContrastChange) ||
      contrastQuery.addEventListener('change', handleContrastChange)
    } catch (error) {
      console.warn('檢測系統對比度偏好失敗:', error)
    }
  }

  /**
   * 應用主題到 DOM
   */
  function applyTheme(): void {
    if (!import.meta.client) return
    
    try {
      const html = document.documentElement
      const body = document.body
      
      // 移除所有主題類別
      html.classList.remove('light', 'dark', 'high-contrast')
      body.classList.remove('theme-light', 'theme-dark')
      
      // 應用當前主題
      const theme = effectiveTheme.value
      html.classList.add(theme)
      body.classList.add(`theme-${theme}`)
      
      // 應用高對比度
      if (isHighContrast.value) {
        html.classList.add('high-contrast')
      }
      
      // 設定 CSS 變數
      html.style.setProperty('--theme-mode', theme)
      html.style.setProperty('--high-contrast', isHighContrast.value ? '1' : '0')
      
      // 更新 meta theme-color
      updateMetaThemeColor(theme)
      
    } catch (error) {
      console.error('應用主題失敗:', error)
    }
  }

  /**
   * 更新 meta theme-color
   */
  function updateMetaThemeColor(theme: 'light' | 'dark'): void {
    try {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]')
      
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta')
        metaThemeColor.setAttribute('name', 'theme-color')
        document.head.appendChild(metaThemeColor)
      }
      
      // 根據主題設定顏色
      const colors = {
        light: '#ffffff',
        dark: '#1e293b'
      }
      
      metaThemeColor.setAttribute('content', colors[theme])
    } catch (error) {
      console.warn('更新 meta theme-color 失敗:', error)
    }
  }

  /**
   * 設定主題模式
   */
  function setTheme(mode: ThemeMode): void {
    if (!AVAILABLE_THEMES.some(theme => theme.key === mode)) {
      console.warn(`不支援的主題模式: ${mode}`)
      return
    }
    
    settings.value.mode = mode
    settings.value.followSystem = mode === 'auto'
    
    applyTheme()
    saveSettings()
  }

  /**
   * 切換主題（淺色 <-> 深色）
   */
  function toggleTheme(): void {
    const newMode: ThemeMode = isDark.value ? 'light' : 'dark'
    setTheme(newMode)
  }

  /**
   * 切換高對比度模式
   */
  function toggleHighContrast(): void {
    settings.value.highContrast = !settings.value.highContrast
    settings.value.followSystem = false // 用戶手動設定時不跟隨系統
    
    applyTheme()
    saveSettings()
  }

  /**
   * 重置為系統偏好
   */
  function resetToSystem(): void {
    settings.value.mode = 'auto'
    settings.value.followSystem = true
    settings.value.highContrast = contrastQuery?.matches || false
    
    applyTheme()
    saveSettings()
  }

  /**
   * 獲取主題資訊
   */
  function getThemeInfo(mode?: ThemeMode): ThemeInfo | null {
    const targetMode = mode || currentTheme.value
    return AVAILABLE_THEMES.find(theme => theme.key === targetMode) || null
  }

  /**
   * 檢查是否支援深色模式
   */
  function supportsDarkMode(): boolean {
    if (!import.meta.client) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined
  }

  /**
   * 檢查是否支援高對比度
   */
  function supportsHighContrast(): boolean {
    if (!import.meta.client) return false
    return window.matchMedia('(prefers-contrast: high)').matches !== undefined
  }

  /**
   * 預載入主題樣式（提升切換效能）
   */
  function preloadThemeStyles(): void {
    if (!import.meta.client) return
    
    try {
      // 目前主題樣式內嵌在組件中，無需預載入額外的 CSS 檔案
      // 預載入邏輯可在未來需要時啟用
    } catch (error) {
      console.warn('預載入主題樣式失敗:', error)
    }
  }

  /**
   * 初始化主題系統
   */
  function initializeTheme(): void {
    if (isInitialized.value) return
    
    loadSettings()
    detectSystemTheme()
    detectSystemContrast()
    applyTheme()
    preloadThemeStyles()
    
    isInitialized.value = true
  }

  /**
   * 清理資源
   */
  function cleanup(): void {
    if (systemThemeQuery) {
      systemThemeQuery.removeListener?.(detectSystemTheme) ||
      systemThemeQuery.removeEventListener('change', detectSystemTheme)
    }
    
    if (contrastQuery) {
      contrastQuery.removeListener?.(detectSystemContrast) ||
      contrastQuery.removeEventListener('change', detectSystemContrast)
    }
  }

  // 生命週期處理由調用者控制
  // 避免在 composable 中使用 onMounted/onUnmounted
  // 調用者應該在適當的時機呼叫 initializeTheme() 和 cleanup()

  // 監聽設定變更
  watch(() => settings.value.mode, () => {
    applyTheme()
  })

  watch(() => settings.value.highContrast, () => {
    applyTheme()
  })

  return {
    // 狀態
    settings: readonly(settings),
    isInitialized: readonly(isInitialized),
    
    // 計算屬性
    currentTheme: readonly(currentTheme),
    isDark: readonly(isDark),
    isLight: readonly(isLight),
    isHighContrast: readonly(isHighContrast),
    isAuto: readonly(isAuto),
    effectiveTheme: readonly(effectiveTheme),
    availableThemes: readonly(availableThemes),
    currentThemeInfo: readonly(currentThemeInfo),
    systemPrefersDark: readonly(systemPrefersDark),
    
    // 方法
    setTheme,
    toggleTheme,
    toggleHighContrast,
    resetToSystem,
    getThemeInfo,
    initializeTheme,
    
    // 工具方法
    supportsDarkMode,
    supportsHighContrast,
    preloadThemeStyles,
    
    // 手動控制
    applyTheme,
    loadSettings,
    saveSettings,
    cleanup
  }
}

/**
 * 全域主題實例
 * 用於在整個應用程式中共享主題狀態
 */
export const globalTheme = useTheme()

export default useTheme