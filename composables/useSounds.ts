/**
 * FlowSip 音效管理 Composable
 * 
 * 提供音效播放、管理和設定功能
 * 支援多種音效類型、音量控制和瀏覽器兼容性處理
 * 
 * @example
 * ```typescript
 * const { 
 *   playSound, 
 *   setVolume, 
 *   sounds,
 *   preloadSounds,
 *   isSupported 
 * } = useSounds()
 * 
 * // 播放音效
 * await playSound('water-reminder', 0.8)
 * 
 * // 設定全域音量
 * setVolume(0.5)
 * ```
 */

import type { SoundType, SoundConfig, SoundPreloadResult } from '~/types'

/**
 * 音效設定介面
 */
export interface SoundSettings {
  /** 全域音量 (0-1) */
  masterVolume: number
  /** 是否啟用音效 */
  enabled: boolean
  /** 各種音效的音量設定 */
  soundVolumes: Record<SoundType, number>
  /** 選定的音效主題 */
  theme: 'default' | 'nature' | 'electronic' | 'minimal'
}

/**
 * 音效檔案映射
 */
const SOUND_FILES: Record<SoundType, SoundConfig> = {
  'water-reminder': {
    file: '/sounds/water-drop.mp3',
    fallback: '/sounds/water-drop.ogg',
    duration: 1500,
    description: '水滴提醒音效'
  },
  'pomodoro-complete': {
    file: '/sounds/bell-chime.mp3',
    fallback: '/sounds/bell-chime.ogg',
    duration: 2000,
    description: '番茄鐘完成音效'
  },
  'break-start': {
    file: '/sounds/nature-bell.mp3',
    fallback: '/sounds/nature-bell.ogg',
    duration: 1800,
    description: '休息時間音效'
  },
  'button-click': {
    file: '/sounds/click.mp3',
    fallback: '/sounds/click.ogg',
    duration: 200,
    description: '按鈕點擊音效'
  },
  'notification-pop': {
    file: '/sounds/pop.mp3',
    fallback: '/sounds/pop.ogg',
    duration: 300,
    description: '通知音效'
  },
  'timer-tick': {
    file: '/sounds/tick.mp3',
    fallback: '/sounds/tick.ogg',
    duration: 100,
    description: '計時器滴答音效'
  },
  'success-chime': {
    file: '/sounds/success.mp3',
    fallback: '/sounds/success.ogg',
    duration: 1200,
    description: '成功提示音效'
  },
  'error-beep': {
    file: '/sounds/error.mp3',
    fallback: '/sounds/error.ogg',
    duration: 800,
    description: '錯誤提示音效'
  }
}

/**
 * 音效主題設定
 */
const SOUND_THEMES = {
  default: {
    name: '預設',
    description: '平衡的音效組合',
    sounds: SOUND_FILES
  },
  nature: {
    name: '自然',
    description: '自然環境音效',
    sounds: {
      ...SOUND_FILES,
      'water-reminder': {
        ...SOUND_FILES['water-reminder'],
        file: '/sounds/themes/nature/water-stream.mp3'
      },
      'pomodoro-complete': {
        ...SOUND_FILES['pomodoro-complete'],
        file: '/sounds/themes/nature/bird-chirp.mp3'
      }
    }
  },
  electronic: {
    name: '電子',
    description: '科技感音效',
    sounds: {
      ...SOUND_FILES,
      'water-reminder': {
        ...SOUND_FILES['water-reminder'],
        file: '/sounds/themes/electronic/synth-drop.mp3'
      },
      'pomodoro-complete': {
        ...SOUND_FILES['pomodoro-complete'],
        file: '/sounds/themes/electronic/digital-chime.mp3'
      }
    }
  },
  minimal: {
    name: '簡約',
    description: '簡潔低調音效',
    sounds: {
      ...SOUND_FILES,
      'water-reminder': {
        ...SOUND_FILES['water-reminder'],
        file: '/sounds/themes/minimal/soft-ping.mp3'
      },
      'pomodoro-complete': {
        ...SOUND_FILES['pomodoro-complete'],
        file: '/sounds/themes/minimal/gentle-tone.mp3'
      }
    }
  }
}

export const useSounds = () => {
  // 響應式狀態
  const isSupported = ref(typeof Audio !== 'undefined')
  const isLoading = ref(false)
  const loadedSounds = ref<Map<string, HTMLAudioElement>>(new Map())
  
  // 音效設定
  const settings = ref<SoundSettings>({
    masterVolume: 0.7,
    enabled: true,
    soundVolumes: {
      'water-reminder': 0.8,
      'pomodoro-complete': 0.9,
      'break-start': 0.7,
      'button-click': 0.3,
      'notification-pop': 0.5,
      'timer-tick': 0.2,
      'success-chime': 0.8,
      'error-beep': 0.6
    },
    theme: 'default'
  })

  // 當前音效主題
  const currentTheme = computed(() => SOUND_THEMES[settings.value.theme])
  
  // 可用音效列表
  const availableSounds = computed(() => 
    Object.entries(currentTheme.value.sounds).map(([type, config]) => ({
      type: type as SoundType,
      ...config
    }))
  )
  
  // 載入狀態
  const loadingStatus = ref<Record<SoundType, 'idle' | 'loading' | 'loaded' | 'error'>>({
    'water-reminder': 'idle',
    'pomodoro-complete': 'idle',
    'break-start': 'idle',
    'button-click': 'idle',
    'notification-pop': 'idle',
    'timer-tick': 'idle',
    'success-chime': 'idle',
    'error-beep': 'idle'
  })

  /**
   * 從本地存儲載入設定
   */
  function loadSettings() {
    if (!import.meta.client) return
    
    try {
      const stored = localStorage.getItem('flowsip-sound-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        settings.value = { ...settings.value, ...parsed }
      }
    } catch (error) {
      console.warn('無法載入音效設定:', error)
    }
  }

  /**
   * 保存設定到本地存儲
   */
  function saveSettings() {
    if (!import.meta.client) return
    
    try {
      localStorage.setItem('flowsip-sound-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('無法保存音效設定:', error)
    }
  }

  /**
   * 建立音效實例
   */
  function createAudioElement(config: SoundConfig): HTMLAudioElement | null {
    if (!isSupported.value) return null

    try {
      const audio = new Audio()
      
      // 嘗試載入主要格式
      audio.src = config.file
      
      // 設定音效屬性
      audio.preload = 'auto'
      audio.volume = 0.7
      
      // 如果主要格式失敗，嘗試備用格式
      audio.onerror = () => {
        if (config.fallback && audio.src !== config.fallback) {
          audio.src = config.fallback
        }
      }
      
      return audio
    } catch (error) {
      console.warn(`無法建立音效實例: ${config.file}`, error)
      return null
    }
  }

  /**
   * 預載入音效檔案
   */
  async function preloadSound(type: SoundType): Promise<SoundPreloadResult> {
    if (!isSupported.value) {
      return { type, success: false, error: '不支援音效播放' }
    }

    const config = currentTheme.value.sounds[type]
    if (!config) {
      return { type, success: false, error: '音效配置不存在' }
    }

    loadingStatus.value[type] = 'loading'

    try {
      const audio = createAudioElement(config)
      if (!audio) {
        throw new Error('無法建立音效實例')
      }

      // 等待音效載入完成
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('音效載入超時'))
        }, 5000) // 5 秒超時

        audio.oncanplaythrough = () => {
          clearTimeout(timeout)
          resolve()
        }

        audio.onerror = () => {
          clearTimeout(timeout)
          // 嘗試載入備用格式
          if (config.fallback && audio.src !== config.fallback) {
            audio.src = config.fallback
            audio.load()
          } else {
            reject(new Error('音效載入失敗'))
          }
        }

        // 處理空檔案或無效檔案
        audio.onabort = () => {
          clearTimeout(timeout)
          reject(new Error('音效檔案無效或為空'))
        }

        // 開始載入
        try {
          audio.load()
        } catch (error) {
          clearTimeout(timeout)
          reject(new Error('無法載入音效檔案'))
        }
      })

      loadedSounds.value.set(type, audio)
      loadingStatus.value[type] = 'loaded'
      
      return { type, success: true }
    } catch (error) {
      loadingStatus.value[type] = 'error'
      console.error(`預載入音效失敗: ${type}`, error)
      
      return { 
        type, 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤' 
      }
    }
  }

  /**
   * 預載入所有音效
   */
  async function preloadAllSounds(): Promise<SoundPreloadResult[]> {
    if (!isSupported.value) return []

    isLoading.value = true
    
    try {
      const soundTypes = Object.keys(currentTheme.value.sounds) as SoundType[]
      const results = await Promise.all(
        soundTypes.map(type => preloadSound(type))
      )
      
      return results
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 播放音效
   */
  async function playSound(
    type: SoundType, 
    volume?: number,
    options: { loop?: boolean; fade?: boolean } = {}
  ): Promise<boolean> {
    if (!isSupported.value || !settings.value.enabled) {
      return false
    }

    try {
      let audio = loadedSounds.value.get(type)
      
      // 如果音效未預載入，嘗試即時載入
      if (!audio) {
        const result = await preloadSound(type)
        if (!result.success) return false
        audio = loadedSounds.value.get(type)
      }

      if (!audio) return false

      // 重置播放位置
      audio.currentTime = 0
      
      // 設定音量
      const finalVolume = (volume ?? settings.value.soundVolumes[type]) * settings.value.masterVolume
      audio.volume = Math.max(0, Math.min(1, finalVolume))
      
      // 設定循環播放
      audio.loop = options.loop ?? false
      
      // 播放音效
      await audio.play()
      
      return true
    } catch (error) {
      console.error(`播放音效失敗: ${type}`, error)
      return false
    }
  }

  /**
   * 停止音效
   */
  function stopSound(type: SoundType): boolean {
    const audio = loadedSounds.value.get(type)
    if (!audio) return false

    try {
      audio.pause()
      audio.currentTime = 0
      return true
    } catch (error) {
      console.error(`停止音效失敗: ${type}`, error)
      return false
    }
  }

  /**
   * 停止所有音效
   */
  function stopAllSounds(): void {
    loadedSounds.value.forEach((audio, type) => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (error) {
        console.error(`停止音效失敗: ${type}`, error)
      }
    })
  }

  /**
   * 設定全域音量
   */
  function setMasterVolume(volume: number): void {
    settings.value.masterVolume = Math.max(0, Math.min(1, volume))
    saveSettings()
  }

  /**
   * 設定特定音效音量
   */
  function setSoundVolume(type: SoundType, volume: number): void {
    settings.value.soundVolumes[type] = Math.max(0, Math.min(1, volume))
    saveSettings()
  }

  /**
   * 切換音效啟用狀態
   */
  function toggleSounds(): void {
    settings.value.enabled = !settings.value.enabled
    
    if (!settings.value.enabled) {
      stopAllSounds()
    }
    
    saveSettings()
  }

  /**
   * 切換音效主題
   */
  async function setTheme(theme: SoundSettings['theme']): Promise<void> {
    if (settings.value.theme === theme) return

    // 停止當前播放的音效
    stopAllSounds()
    
    // 清空已載入的音效
    loadedSounds.value.clear()
    
    // 重置載入狀態
    Object.keys(loadingStatus.value).forEach(type => {
      loadingStatus.value[type as SoundType] = 'idle'
    })
    
    // 更新主題
    settings.value.theme = theme
    saveSettings()
    
    // 重新預載入音效
    await preloadAllSounds()
  }

  /**
   * 測試音效播放
   */
  async function testSound(type: SoundType): Promise<boolean> {
    return await playSound(type, 0.5)
  }

  /**
   * 取得音效資訊
   */
  function getSoundInfo(type: SoundType) {
    const config = currentTheme.value.sounds[type]
    const status = loadingStatus.value[type]
    const volume = settings.value.soundVolumes[type]
    
    return {
      type,
      config,
      status,
      volume,
      isLoaded: status === 'loaded',
      isLoading: status === 'loading',
      hasError: status === 'error'
    }
  }

  /**
   * 音效預設快速設定
   */
  const quickPresets = {
    silent: () => {
      settings.value.masterVolume = 0
      saveSettings()
    },
    quiet: () => {
      settings.value.masterVolume = 0.3
      saveSettings()
    },
    normal: () => {
      settings.value.masterVolume = 0.7
      saveSettings()
    },
    loud: () => {
      settings.value.masterVolume = 1.0
      saveSettings()
    }
  }

  // 生命週期處理由調用者控制
  // 避免在 composable 中使用 onMounted/onUnmounted
  // 調用者應該在適當的時機呼叫初始化和清理方法

  // 監聽設定變更
  watch(() => settings.value.theme, (newTheme) => {
    setTheme(newTheme)
  })

  return {
    // 狀態
    isSupported: readonly(isSupported),
    isLoading: readonly(isLoading),
    settings: readonly(settings),
    loadingStatus: readonly(loadingStatus),
    
    // 計算屬性
    currentTheme: readonly(currentTheme),
    availableSounds: readonly(availableSounds),
    
    // 播放控制
    playSound,
    stopSound,
    stopAllSounds,
    testSound,
    
    // 設定管理
    setMasterVolume,
    setSoundVolume,
    toggleSounds,
    setTheme,
    
    // 載入管理
    preloadSound,
    preloadAllSounds,
    
    // 工具方法
    getSoundInfo,
    quickPresets,
    
    // 常用音效快捷方法
    playWaterReminder: () => playSound('water-reminder'),
    playPomodoroComplete: () => playSound('pomodoro-complete'),
    playButtonClick: () => playSound('button-click'),
    playNotificationPop: () => playSound('notification-pop'),
    playSuccessChime: () => playSound('success-chime'),
    playErrorBeep: () => playSound('error-beep')
  }
}

/**
 * 全域音效實例
 * 用於在整個應用程式中共享音效狀態
 */
export const globalSounds = useSounds()

export default useSounds