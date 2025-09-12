import { ref, computed, watch, onUnmounted, readonly, type Ref } from 'vue'
import type { 
  UserSettings, 
  ThemeMode, 
  TimerPreset, 
  NotificationSettings,
  SoundSettings 
} from '~/types'

interface UseSettingsReturn {
  // 設定狀態
  settings: Ref<UserSettings>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  isDirty: Ref<boolean>

  // 主題設定
  theme: Ref<ThemeMode>
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void

  // 計時器設定
  timerPresets: Ref<TimerPreset[]>
  defaultPreset: Ref<TimerPreset | null>
  addTimerPreset: (preset: Omit<TimerPreset, 'id'>) => void
  updateTimerPreset: (id: string, preset: Partial<TimerPreset>) => void
  removeTimerPreset: (id: string) => void
  setDefaultPreset: (id: string) => void

  // 通知設定
  notifications: Ref<NotificationSettings>
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  testNotification: () => Promise<void>

  // 音效設定
  sounds: Ref<SoundSettings>
  updateSoundSettings: (settings: Partial<SoundSettings>) => void
  testSound: (soundType: keyof SoundSettings['sounds']) => Promise<void>

  // 設定管理
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
  resetSettings: () => Promise<void>
  exportSettings: () => string
  importSettings: (settingsJson: string) => Promise<boolean>

  // 實用工具
  getSettingValue: <K extends keyof UserSettings>(key: K) => UserSettings[K]
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
}

const DEFAULT_TIMER_PRESETS: TimerPreset[] = [
  {
    id: 'water-30',
    name: '喝水提醒',
    duration: 30 * 60, // 30 分鐘
    description: '每 30 分鐘提醒喝水',
    color: '#06b6d4', // cyan-500
    icon: 'mdi:water',
    isDefault: true,
    category: 'health'
  },
  {
    id: 'pomodoro-25',
    name: '番茄鐘',
    duration: 25 * 60, // 25 分鐘
    description: '專注工作 25 分鐘',
    color: '#ef4444', // red-500
    icon: 'mdi:timer',
    isDefault: false,
    category: 'productivity'
  },
  {
    id: 'break-5',
    name: '短休息',
    duration: 5 * 60, // 5 分鐘
    description: '短暫休息 5 分鐘',
    color: '#10b981', // emerald-500
    icon: 'mdi:coffee',
    isDefault: false,
    category: 'break'
  },
  {
    id: 'break-15',
    name: '長休息',
    duration: 15 * 60, // 15 分鐘
    description: '較長休息 15 分鐘',
    color: '#8b5cf6', // violet-500
    icon: 'mdi:sleep',
    isDefault: false,
    category: 'break'
  }
]

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'auto',
  timerPresets: DEFAULT_TIMER_PRESETS,
  defaultPresetId: 'water-30',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    desktop: true,
    badge: true,
    persistentNotification: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  },
  sounds: {
    enabled: true,
    volume: 0.7,
    sounds: {
      complete: '/sounds/complete.mp3',
      warning: '/sounds/warning.mp3',
      tick: '/sounds/tick.mp3',
      start: '/sounds/start.mp3',
      pause: '/sounds/pause.mp3'
    }
  },
  advanced: {
    enableAnalytics: false,
    autoSave: true,
    backgroundSync: true,
    debugMode: false,
    experimentalFeatures: false
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReader: false
  }
}

// 全域設定狀態
const settings = ref<UserSettings>(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))
const isLoading = ref(false)
const error = ref<Error | null>(null)
const isDirty = ref(false)
const lastSaved = ref<Date | null>(null)

export function useSettings(): UseSettingsReturn {
  // 計算屬性
  const theme = computed({
    get: () => settings.value.theme,
    set: (value) => {
      settings.value.theme = value
      isDirty.value = true
      applyTheme(value)
    }
  })

  const timerPresets = computed(() => settings.value.timerPresets)
  
  const defaultPreset = computed(() => 
    settings.value.timerPresets.find(p => p.id === settings.value.defaultPresetId) || null
  )

  const notifications = computed({
    get: () => settings.value.notifications,
    set: (value) => {
      settings.value.notifications = { ...settings.value.notifications, ...value }
      isDirty.value = true
    }
  })

  const sounds = computed({
    get: () => settings.value.sounds,
    set: (value) => {
      settings.value.sounds = { ...settings.value.sounds, ...value }
      isDirty.value = true
    }
  })

  // 主題管理
  function setTheme(newTheme: ThemeMode): void {
    theme.value = newTheme
  }

  function toggleTheme(): void {
    const currentTheme = theme.value
    if (currentTheme === 'light') {
      setTheme('dark')
    } else if (currentTheme === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  function applyTheme(themeMode: ThemeMode): void {
    if (process.client) {
      const root = document.documentElement
      
      if (themeMode === 'auto') {
        // 跟隨系統主題
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
      } else {
        root.classList.toggle('dark', themeMode === 'dark')
      }

      // 儲存到 localStorage
      localStorage.setItem('theme', themeMode)
    }
  }

  // 計時器預設值管理
  function addTimerPreset(preset: Omit<TimerPreset, 'id'>): void {
    const id = `custom-${Date.now()}`
    const newPreset: TimerPreset = {
      ...preset,
      id,
      isDefault: false
    }
    
    settings.value.timerPresets.push(newPreset)
    isDirty.value = true
  }

  function updateTimerPreset(id: string, updates: Partial<TimerPreset>): void {
    const index = settings.value.timerPresets.findIndex(p => p.id === id)
    if (index !== -1) {
      settings.value.timerPresets[index] = {
        ...settings.value.timerPresets[index],
        ...updates
      }
      isDirty.value = true
    }
  }

  function removeTimerPreset(id: string): void {
    // 不允許刪除預設預設值
    const preset = settings.value.timerPresets.find(p => p.id === id)
    if (preset && !preset.isDefault) {
      settings.value.timerPresets = settings.value.timerPresets.filter(p => p.id !== id)
      
      // 如果刪除的是當前預設值，切換到第一個預設值
      if (settings.value.defaultPresetId === id) {
        const firstPreset = settings.value.timerPresets.find(p => p.isDefault)
        if (firstPreset) {
          settings.value.defaultPresetId = firstPreset.id
        }
      }
      
      isDirty.value = true
    }
  }

  function setDefaultPreset(id: string): void {
    if (settings.value.timerPresets.find(p => p.id === id)) {
      settings.value.defaultPresetId = id
      isDirty.value = true
    }
  }

  // 通知設定管理
  function updateNotificationSettings(updates: Partial<NotificationSettings>): void {
    settings.value.notifications = {
      ...settings.value.notifications,
      ...updates
    }
    isDirty.value = true
  }

  async function testNotification(): Promise<void> {
    if (!settings.value.notifications.enabled) {
      throw new Error('通知功能已停用')
    }

    try {
      if (settings.value.notifications.desktop && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('FlowSip 測試通知', {
            body: '這是一個測試通知，確保通知功能正常運作',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png'
          })
        } else if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            await testNotification()
          }
        }
      }

      // 測試音效
      if (settings.value.notifications.sound && settings.value.sounds.enabled) {
        await testSound('complete')
      }

      // 測試震動
      if (settings.value.notifications.vibration && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
    } catch (err) {
      console.error('測試通知失敗:', err)
      throw new Error('測試通知失敗')
    }
  }

  // 音效設定管理
  function updateSoundSettings(updates: Partial<SoundSettings>): void {
    settings.value.sounds = {
      ...settings.value.sounds,
      ...updates
    }
    isDirty.value = true
  }

  async function testSound(soundType: keyof SoundSettings['sounds']): Promise<void> {
    if (!settings.value.sounds.enabled) {
      throw new Error('音效功能已停用')
    }

    try {
      const soundPath = settings.value.sounds.sounds[soundType]
      if (soundPath) {
        const audio = new Audio(soundPath)
        audio.volume = settings.value.sounds.volume
        await audio.play()
      }
    } catch (err) {
      console.error(`測試音效 ${soundType} 失敗:`, err)
      throw new Error(`測試音效失敗: ${soundType}`)
    }
  }

  // 設定管理
  async function loadSettings(): Promise<void> {
    if (!process.client) return

    try {
      isLoading.value = true
      error.value = null

      // 從 localStorage 載入設定
      const savedSettings = localStorage.getItem('flowsip-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        
        // 合併預設設定和儲存的設定，確保新增的屬性有預設值
        settings.value = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          // 確保預設計時器預設值存在
          timerPresets: [
            ...DEFAULT_TIMER_PRESETS,
            ...(parsed.timerPresets || []).filter((p: TimerPreset) => 
              !DEFAULT_TIMER_PRESETS.find(dp => dp.id === p.id)
            )
          ]
        }
      }

      // 應用主題
      applyTheme(settings.value.theme)
      
      isDirty.value = false
      lastSaved.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('載入設定失敗')
      console.error('載入設定失敗:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function saveSettings(): Promise<void> {
    if (!process.client) return

    try {
      isLoading.value = true
      error.value = null

      // 儲存到 localStorage
      localStorage.setItem('flowsip-settings', JSON.stringify(settings.value))
      
      isDirty.value = false
      lastSaved.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('儲存設定失敗')
      console.error('儲存設定失敗:', err)
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  async function resetSettings(): Promise<void> {
    try {
      isLoading.value = true
      
      // 重置為預設設定
      settings.value = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
      
      // 應用主題
      applyTheme(settings.value.theme)
      
      // 儲存重置後的設定
      await saveSettings()
      
      isDirty.value = false
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('重置設定失敗')
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  function exportSettings(): string {
    return JSON.stringify({
      ...settings.value,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2)
  }

  async function importSettings(settingsJson: string): Promise<boolean> {
    try {
      const imported = JSON.parse(settingsJson)
      
      // 驗證匯入的設定格式
      if (!imported || typeof imported !== 'object') {
        throw new Error('無效的設定格式')
      }

      // 合併匯入的設定
      settings.value = {
        ...DEFAULT_SETTINGS,
        ...imported,
        timerPresets: [
          ...DEFAULT_TIMER_PRESETS,
          ...(imported.timerPresets || []).filter((p: TimerPreset) => 
            !DEFAULT_TIMER_PRESETS.find(dp => dp.id === p.id)
          )
        ]
      }

      // 應用主題
      applyTheme(settings.value.theme)
      
      // 儲存設定
      await saveSettings()
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('匯入設定失敗')
      console.error('匯入設定失敗:', err)
      return false
    }
  }

  // 實用工具
  function getSettingValue<K extends keyof UserSettings>(key: K): UserSettings[K] {
    return settings.value[key]
  }

  function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    settings.value[key] = value
    isDirty.value = true
  }

  // 監聽系統主題變化
  if (process.client) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = () => {
      if (settings.value.theme === 'auto') {
        applyTheme('auto')
      }
    }
    
    mediaQuery.addEventListener('change', handleThemeChange)
    
    // 清理函數
    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handleThemeChange)
    })
  }

  // 自動儲存
  watch(
    () => settings.value,
    () => {
      if (settings.value.advanced.autoSave && isDirty.value) {
        // 延遲儲存，避免頻繁寫入
        setTimeout(() => {
          if (isDirty.value) {
            saveSettings().catch(console.error)
          }
        }, 1000)
      }
    },
    { deep: true }
  )

  return {
    // 設定狀態
    settings: readonly(settings),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isDirty: readonly(isDirty),

    // 主題設定
    theme,
    setTheme,
    toggleTheme,

    // 計時器設定
    timerPresets,
    defaultPreset,
    addTimerPreset,
    updateTimerPreset,
    removeTimerPreset,
    setDefaultPreset,

    // 通知設定
    notifications,
    updateNotificationSettings,
    testNotification,

    // 音效設定
    sounds,
    updateSoundSettings,
    testSound,

    // 設定管理
    loadSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,

    // 實用工具
    getSettingValue,
    updateSetting
  }
}

// 全域設定載入
if (process.client) {
  const { loadSettings } = useSettings()
  loadSettings().catch(console.error)
}