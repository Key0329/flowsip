<template>
  <div class="settings-page">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <button
            class="back-btn"
            @click="navigateBack"
          >
            <Icon name="mdi:arrow-left" />
            <span>返回</span>
          </button>
          <div>
            <h1 class="page-title">設定</h1>
            <p class="page-subtitle">個人化您的 FlowSip 體驗</p>
          </div>
        </div>
        
        <div class="header-actions">
          <!-- 儲存狀態指示器 -->
          <div v-if="isDirty" class="save-indicator">
            <Icon 
              :name="isLoading ? 'mdi:loading' : 'mdi:content-save-outline'"
              :class="{ 'animate-spin': isLoading }"
            />
            <span>{{ isLoading ? '儲存中...' : '有未儲存變更' }}</span>
          </div>
          
          <!-- 操作按鈕 -->
          <div class="action-buttons">
            <button
              v-if="isDirty"
              class="save-btn"
              :disabled="isLoading"
              @click="saveSettings"
            >
              <Icon name="mdi:content-save" />
              <span>儲存</span>
            </button>
            
            <div class="dropdown-container">
              <button
                class="more-btn"
                @click="showMoreMenu = !showMoreMenu"
              >
                <Icon name="mdi:dots-vertical" />
              </button>
              
              <div v-if="showMoreMenu" class="more-menu">
                <button
                  class="menu-item"
                  @click="exportSettings"
                >
                  <Icon name="mdi:export" />
                  <span>匯出設定</span>
                </button>
                
                <button
                  class="menu-item"
                  @click="showImportDialog = true"
                >
                  <Icon name="mdi:import" />
                  <span>匯入設定</span>
                </button>
                
                <div class="menu-divider"></div>
                
                <button
                  class="menu-item menu-item--danger"
                  @click="showResetDialog = true"
                >
                  <Icon name="mdi:restore" />
                  <span>重置所有設定</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 設定內容 -->
    <div class="settings-content">
      <div class="settings-container">
        <!-- 導航選單 -->
        <div class="settings-nav">
          <nav class="nav-menu">
            <button
              v-for="section in settingSections"
              :key="section.id"
              class="nav-item"
              :class="{ 'nav-item--active': activeSection === section.id }"
              @click="activeSection = section.id"
            >
              <Icon :name="section.icon" />
              <span>{{ section.name }}</span>
              <div v-if="section.badge" class="nav-badge">
                {{ section.badge }}
              </div>
            </button>
          </nav>
        </div>

        <!-- 設定面板 -->
        <div class="settings-panel">
          <!-- 主題設定 -->
          <div
            v-if="activeSection === 'theme'"
            class="settings-section"
          >
            <ThemeSelector
              v-model="currentTheme"
              :disabled="isLoading"
              @change="onThemeChange"
            />
          </div>

          <!-- 音效設定 -->
          <div
            v-else-if="activeSection === 'sound'"
            class="settings-section"
          >
            <SoundSettings
              :disabled="isLoading"
              @test-sound="onSoundTest"
              @settings-changed="onSoundSettingsChange"
            />
          </div>

          <!-- 時間設定 -->
          <div
            v-else-if="activeSection === 'time'"
            class="settings-section"
          >
            <TimeSettings
              :disabled="isLoading"
              @preset-added="onPresetAdded"
              @preset-updated="onPresetUpdated"
              @preset-deleted="onPresetDeleted"
              @default-changed="onDefaultChanged"
            />
          </div>

          <!-- 通知設定 -->
          <div
            v-else-if="activeSection === 'notifications'"
            class="settings-section"
          >
            <div class="notification-settings">
              <div class="settings-header">
                <div class="header-content">
                  <div class="header-icon">
                    <Icon name="mdi:bell-outline" />
                  </div>
                  <div class="header-text">
                    <h3 class="header-title">通知設定</h3>
                    <p class="header-description">管理提醒通知的方式和時機</p>
                  </div>
                </div>
              </div>

              <div class="notification-options">
                <div class="option-group">
                  <h4 class="group-title">通知類型</h4>
                  
                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="notificationSettings.desktop"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">桌面通知</span>
                        <span class="option-description">在桌面顯示提醒通知</span>
                      </div>
                    </label>
                  </div>

                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="notificationSettings.sound"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">音效提醒</span>
                        <span class="option-description">播放提醒音效</span>
                      </div>
                    </label>
                  </div>

                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="notificationSettings.vibration"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">震動提醒</span>
                        <span class="option-description">在支援的裝置上震動</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="option-group">
                  <h4 class="group-title">免打擾時間</h4>
                  
                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="quietHoursEnabled"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">啟用免打擾時間</span>
                        <span class="option-description">在指定時間內暫停通知</span>
                      </div>
                    </label>
                  </div>

                  <div v-if="quietHoursEnabled" class="quiet-hours-settings">
                    <div class="time-range">
                      <div class="time-input-group">
                        <label class="time-label">開始時間</label>
                        <input
                          v-model="quietHoursStart"
                          type="time"
                          class="time-input"
                        >
                      </div>
                      <div class="time-input-group">
                        <label class="time-label">結束時間</label>
                        <input
                          v-model="quietHoursEnd"
                          type="time"
                          class="time-input"
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <div class="test-section">
                  <button
                    class="test-notification-btn"
                    :disabled="!notificationSettings.enabled || testingNotification"
                    @click="testNotification"
                  >
                    <Icon
                      :name="testingNotification ? 'mdi:loading' : 'mdi:bell-ring'"
                      :class="{ 'animate-spin': testingNotification }"
                    />
                    <span>{{ testingNotification ? '測試中...' : '測試通知' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 進階設定 -->
          <div
            v-else-if="activeSection === 'advanced'"
            class="settings-section"
          >
            <div class="advanced-settings">
              <div class="settings-header">
                <div class="header-content">
                  <div class="header-icon">
                    <Icon name="mdi:cog-outline" />
                  </div>
                  <div class="header-text">
                    <h3 class="header-title">進階設定</h3>
                    <p class="header-description">開發者和進階用戶選項</p>
                  </div>
                </div>
              </div>

              <div class="advanced-options">
                <div class="option-group">
                  <h4 class="group-title">資料和隱私</h4>
                  
                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="advancedSettings.enableAnalytics"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">使用統計分析</span>
                        <span class="option-description">協助改善應用程式（匿名資料）</span>
                      </div>
                    </label>
                  </div>

                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="advancedSettings.autoSave"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">自動儲存</span>
                        <span class="option-description">變更設定後自動儲存</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="option-group">
                  <h4 class="group-title">開發者選項</h4>
                  
                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="advancedSettings.debugMode"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">除錯模式</span>
                        <span class="option-description">顯示詳細的除錯資訊</span>
                      </div>
                    </label>
                  </div>

                  <div class="option-item">
                    <label class="option-label">
                      <input
                        v-model="advancedSettings.experimentalFeatures"
                        type="checkbox"
                        class="option-checkbox"
                      >
                      <div class="checkbox-custom">
                        <Icon name="mdi:check" />
                      </div>
                      <div class="option-content">
                        <span class="option-name">實驗性功能</span>
                        <span class="option-description">啟用測試中的新功能</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 關於頁面 -->
          <div
            v-else-if="activeSection === 'about'"
            class="settings-section"
          >
            <div class="about-section">
              <div class="app-info">
                <div class="app-icon">
                  <Icon name="mdi:water" />
                </div>
                <div class="app-details">
                  <h3 class="app-name">FlowSip</h3>
                  <p class="app-version">版本 1.0.0</p>
                  <p class="app-description">
                    簡潔優雅的計時提醒應用程式，幫助您養成良好的習慣。
                  </p>
                </div>
              </div>

              <div class="app-links">
                <a href="#" class="link-item">
                  <Icon name="mdi:github" />
                  <span>GitHub</span>
                </a>
                <a href="#" class="link-item">
                  <Icon name="mdi:bug-outline" />
                  <span>回報問題</span>
                </a>
                <a href="#" class="link-item">
                  <Icon name="mdi:help-circle-outline" />
                  <span>使用說明</span>
                </a>
              </div>

              <div class="copyright">
                <p>&copy; 2025 FlowSip. 保留所有權利。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 匯入對話框 -->
    <div v-if="showImportDialog" class="dialog-overlay">
      <div class="import-dialog">
        <div class="dialog-header">
          <h3 class="dialog-title">匯入設定</h3>
          <button class="close-btn" @click="showImportDialog = false">
            <Icon name="mdi:close" />
          </button>
        </div>
        
        <div class="dialog-content">
          <p class="import-description">
            請貼上之前匯出的設定 JSON 資料：
          </p>
          <textarea
            v-model="importData"
            class="import-textarea"
            placeholder="貼上設定資料..."
            rows="10"
          ></textarea>
        </div>
        
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showImportDialog = false">
            取消
          </button>
          <button
            class="import-btn"
            :disabled="!importData.trim() || importing"
            @click="performImport"
          >
            <Icon v-if="importing" name="mdi:loading" class="animate-spin" />
            <span>{{ importing ? '匯入中...' : '匯入' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 重置確認對話框 -->
    <div v-if="showResetDialog" class="dialog-overlay">
      <div class="reset-dialog">
        <div class="dialog-header">
          <Icon name="mdi:alert-circle" class="warning-icon" />
          <h3 class="dialog-title">確認重置</h3>
        </div>
        
        <div class="dialog-content">
          <p class="reset-warning">
            這將會重置所有設定到初始狀態，包括：
          </p>
          <ul class="reset-list">
            <li>主題設定</li>
            <li>音效設定</li>
            <li>自訂計時器</li>
            <li>通知偏好</li>
            <li>進階選項</li>
          </ul>
          <p class="reset-confirm">此操作無法復原，確定要繼續嗎？</p>
        </div>
        
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showResetDialog = false">
            取消
          </button>
          <button
            class="reset-confirm-btn"
            :disabled="resetting"
            @click="performReset"
          >
            <Icon v-if="resetting" name="mdi:loading" class="animate-spin" />
            <span>{{ resetting ? '重置中...' : '確認重置' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'
import ThemeSelector from '~/components/Settings/ThemeSelector.vue'
import SoundSettings from '~/components/Settings/SoundSettings.vue'
import TimeSettings from '~/components/Settings/TimeSettings.vue'

// SEO 設定
useSeoMeta({
  title: '設定 - FlowSip',
  description: '個人化您的 FlowSip 計時器設定，包括主題、音效、通知和時間偏好。'
})

// 使用設定管理
const {
  settings,
  isLoading,
  isDirty,
  theme,
  notifications,
  saveSettings: save,
  resetSettings,
  exportSettings: exportConfig,
  importSettings,
  testNotification: testNotificationSound
} = useSettings()

// 頁面狀態
const activeSection = ref('theme')
const showMoreMenu = ref(false)
const showImportDialog = ref(false)
const showResetDialog = ref(false)
const testingNotification = ref(false)
const importing = ref(false)
const resetting = ref(false)
const importData = ref('')

// 下拉選單外部點擊關閉
const moreMenuRef = ref()
onClickOutside(moreMenuRef, () => {
  showMoreMenu.value = false
})

// 設定區段配置
const settingSections = [
  {
    id: 'theme',
    name: '主題外觀',
    icon: 'mdi:palette-outline'
  },
  {
    id: 'sound',
    name: '音效設定',
    icon: 'mdi:volume-high'
  },
  {
    id: 'time',
    name: '計時設定',
    icon: 'mdi:timer-cog'
  },
  {
    id: 'notifications',
    name: '通知設定',
    icon: 'mdi:bell-outline'
  },
  {
    id: 'advanced',
    name: '進階設定',
    icon: 'mdi:cog-outline'
  },
  {
    id: 'about',
    name: '關於應用',
    icon: 'mdi:information-outline'
  }
]

// 計算屬性
const currentTheme = computed({
  get: () => theme.value,
  set: (value) => theme.value = value
})

const notificationSettings = computed({
  get: () => notifications.value,
  set: (value) => {
    // 這裡應該呼叫 updateNotificationSettings
    console.log('更新通知設定:', value)
  }
})

const quietHoursEnabled = computed({
  get: () => notifications.value.quietHours.enabled,
  set: (value) => {
    // 更新靜音時間設定
    console.log('更新靜音時間:', value)
  }
})

const quietHoursStart = computed({
  get: () => notifications.value.quietHours.start,
  set: (value) => {
    // 更新開始時間
    console.log('更新開始時間:', value)
  }
})

const quietHoursEnd = computed({
  get: () => notifications.value.quietHours.end,
  set: (value) => {
    // 更新結束時間
    console.log('更新結束時間:', value)
  }
})

const advancedSettings = computed({
  get: () => settings.value.advanced,
  set: (value) => {
    // 更新進階設定
    console.log('更新進階設定:', value)
  }
})

// 方法
async function navigateBack(): Promise<void> {
  await navigateTo('/')
}

async function saveSettings(): Promise<void> {
  try {
    await save()
    // 顯示成功訊息
  } catch (error) {
    console.error('儲存設定失敗:', error)
    // 顯示錯誤訊息
  }
}

function exportSettings(): void {
  try {
    const configJson = exportConfig()
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `flowsip-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
    showMoreMenu.value = false
  } catch (error) {
    console.error('匯出設定失敗:', error)
  }
}

async function performImport(): Promise<void> {
  try {
    importing.value = true
    const success = await importSettings(importData.value)
    
    if (success) {
      showImportDialog.value = false
      importData.value = ''
      // 顯示成功訊息
    } else {
      // 顯示失敗訊息
    }
  } catch (error) {
    console.error('匯入設定失敗:', error)
  } finally {
    importing.value = false
  }
}

async function performReset(): Promise<void> {
  try {
    resetting.value = true
    await resetSettings()
    showResetDialog.value = false
    // 顯示成功訊息
  } catch (error) {
    console.error('重置設定失敗:', error)
  } finally {
    resetting.value = false
  }
}

async function testNotification(): Promise<void> {
  try {
    testingNotification.value = true
    await testNotificationSound()
  } catch (error) {
    console.error('測試通知失敗:', error)
  } finally {
    setTimeout(() => {
      testingNotification.value = false
    }, 1000)
  }
}

// 事件處理器
function onThemeChange(newTheme: string): void {
  console.log('主題變更:', newTheme)
}

function onSoundTest(soundType: string): void {
  console.log('測試音效:', soundType)
}

function onSoundSettingsChange(settings: any): void {
  console.log('音效設定變更:', settings)
}

function onPresetAdded(preset: any): void {
  console.log('新增預設值:', preset)
}

function onPresetUpdated(preset: any): void {
  console.log('更新預設值:', preset)
}

function onPresetDeleted(presetId: string): void {
  console.log('刪除預設值:', presetId)
}

function onDefaultChanged(presetId: string): void {
  console.log('預設值變更:', presetId)
}

// 關閉下拉選單當點擊其他地方
watch(showMoreMenu, (show) => {
  if (show) {
    nextTick(() => {
      document.addEventListener('click', closeMoreMenu)
    })
  } else {
    document.removeEventListener('click', closeMoreMenu)
  }
})

function closeMoreMenu(event: Event): void {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-container')) {
    showMoreMenu.value = false
  }
}

onMounted(() => {
  // 頁面載入完成後的初始化
})

onUnmounted(() => {
  document.removeEventListener('click', closeMoreMenu)
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background-color: rgb(var(--color-background));
  color: rgb(var(--color-text-primary));
  font-family: var(--font-family-primary);
}

/* 頁面標題 */
.page-header {
  background-color: rgb(var(--color-white));
  border-bottom: 1px solid rgb(var(--color-border));
  box-shadow: var(--shadow-card);
}

.dark .page-header {
  background-color: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-700));
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-6) var(--spacing-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  color: rgb(var(--color-text-secondary));
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.back-btn:hover {
  color: rgb(var(--color-primary));
  background-color: rgb(var(--color-primary) / 0.1);
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: rgb(var(--color-text-primary));
  margin-bottom: var(--spacing-1);
  line-height: var(--leading-heading);
}

.page-subtitle {
  font-size: var(--text-sm);
  color: rgb(var(--color-text-secondary));
  line-height: var(--leading-normal);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
  color: rgb(var(--color-orange-600));
}

.dark .save-indicator {
  color: rgb(var(--color-orange-400));
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.save-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: rgb(var(--color-primary));
  color: rgb(var(--color-white));
  border: none;
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background-color: rgb(var(--color-primary-dark));
  transform: translateY(-1px);
  box-shadow: var(--shadow-button-hover);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 下拉選單 */
.dropdown-container {
  position: relative;
}

.more-btn {
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgb(var(--color-background-secondary));
  color: rgb(var(--color-text-secondary));
  border: none;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.more-btn:hover {
  background-color: rgb(var(--color-background-tertiary));
}

.more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--spacing-2);
  width: 12rem;
  background-color: rgb(var(--color-white));
  border: 1px solid rgb(var(--color-border));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 20;
  overflow: hidden;
}

.dark .more-menu {
  background-color: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-700));
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  color: rgb(var(--color-text-primary));
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
}

.menu-item:hover {
  background-color: rgb(var(--color-background-secondary));
}

.menu-item--danger {
  color: rgb(var(--color-red-600));
}

.dark .menu-item--danger {
  color: rgb(var(--color-red-400));
}

.menu-item--danger:hover {
  background-color: rgb(var(--color-red-50));
}

.dark .menu-item--danger:hover {
  background-color: rgb(var(--color-red-900) / 0.2);
}

.menu-divider {
  border-top: 1px solid rgb(var(--color-border));
}

/* 設定內容 */
.settings-content {
  flex: 1;
}

.settings-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-8) var(--spacing-4);
  display: flex;
  gap: var(--spacing-8);
}

/* 導航選單 */
.settings-nav {
  width: 16rem;
  flex-shrink: 0;
}

.nav-menu {
  position: sticky;
  top: var(--spacing-8);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  color: rgb(var(--color-text-primary));
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: var(--text-sm);
}

.nav-item:hover {
  background-color: rgb(var(--color-background-secondary));
}

.nav-item--active {
  background-color: rgb(var(--color-primary) / 0.1);
  color: rgb(var(--color-primary));
}

.nav-badge {
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  background-color: rgb(var(--color-red-500));
  color: rgb(var(--color-white));
  font-size: var(--text-xs);
  border-radius: var(--radius-full);
}

/* 設定面板 */
.settings-panel {
  flex: 1;
  min-width: 0;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* 設定元件樣式 */
.card {
  background-color: rgb(var(--color-white));
  border: 1px solid rgb(var(--color-border));
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.dark .card {
  background-color: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-700));
}

/* 對話框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.import-dialog,
.reset-dialog {
  background-color: rgb(var(--color-white));
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  width: 90%;
  max-width: 32rem;
}

.dark .import-dialog,
.dark .reset-dialog {
  background-color: rgb(var(--color-gray-800));
}

.dialog-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid rgb(var(--color-border));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: rgb(var(--color-text-primary));
}

.close-btn {
  background: none;
  border: none;
  color: rgb(var(--color-text-secondary));
  cursor: pointer;
  padding: var(--spacing-1);
  border-radius: var(--radius-base);
}

.close-btn:hover {
  background-color: rgb(var(--color-background-secondary));
}

.dialog-content {
  padding: var(--spacing-6);
}

.import-textarea {
  width: 100%;
  min-height: 10rem;
  padding: var(--spacing-3);
  border: 1px solid rgb(var(--color-border));
  border-radius: var(--radius-md);
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
  resize: vertical;
}

.import-textarea:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: var(--shadow-focus);
}

.dialog-actions {
  padding: var(--spacing-6);
  border-top: 1px solid rgb(var(--color-border));
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

.cancel-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background: none;
  border: 1px solid rgb(var(--color-border));
  color: rgb(var(--color-text-secondary));
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: rgb(var(--color-background-secondary));
  border-color: rgb(var(--color-border-dark));
}

.import-btn,
.reset-confirm-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background-color: rgb(var(--color-primary));
  border: none;
  color: rgb(var(--color-white));
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.import-btn:hover:not(:disabled),
.reset-confirm-btn:hover:not(:disabled) {
  background-color: rgb(var(--color-primary-dark));
}

.import-btn:disabled,
.reset-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-confirm-btn {
  background-color: rgb(var(--color-red-600));
}

.reset-confirm-btn:hover:not(:disabled) {
  background-color: rgb(var(--color-red-700));
}

/* 響應式設計 */
@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
    gap: var(--spacing-4);
  }
  
  .settings-nav {
    width: 100%;
  }
  
  .nav-menu {
    position: static;
    flex-direction: row;
    overflow-x: auto;
    gap: var(--spacing-1);
  }
  
  .nav-item {
    flex-shrink: 0;
  }
}
</style>
