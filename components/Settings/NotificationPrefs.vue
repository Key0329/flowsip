<template>
  <div class="notification-prefs">
    <!-- 標題區 -->
    <div class="section-header">
      <Icon name="mdi:bell-outline" class="section-icon" />
      <h3 class="section-title">通知偏好</h3>
      <p class="section-description">
        自訂計時器完成時的提醒方式
      </p>
    </div>

    <!-- 通知權限狀態 -->
    <div class="permission-status" :class="permissionStatusClass">
      <div class="permission-icon">
        <Icon :name="permissionIcon" />
      </div>
      <div class="permission-content">
        <span class="permission-label">{{ permissionLabel }}</span>
        <button 
          v-if="notifications.state.permission === 'default'"
          class="permission-action"
          @click="requestPermission"
        >
          允許通知
        </button>
      </div>
    </div>

    <!-- 通知設定 -->
    <div class="settings-group" :class="{ disabled: !canShowNotifications }">
      <!-- 啟用通知 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-title">桌面通知</span>
          <span class="setting-description">
            計時完成時顯示系統通知
          </span>
        </div>
        <ToggleSwitch
          :model-value="notificationSettings.enabled"
          :disabled="!canShowNotifications"
          aria-label="啟用桌面通知"
          @update:model-value="updateSetting('enabled', $event)"
        />
      </div>

      <!-- 聲音提醒 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-title">聲音提醒</span>
          <span class="setting-description">
            播放提醒聲音
          </span>
        </div>
        <ToggleSwitch
          :model-value="notificationSettings.sound"
          aria-label="啟用聲音提醒"
          @update:model-value="updateSetting('sound', $event)"
        />
      </div>

      <!-- 振動提醒（行動裝置） -->
      <div 
        v-if="canVibrate" 
        class="setting-item"
      >
        <div class="setting-label">
          <span class="setting-title">振動提醒</span>
          <span class="setting-description">
            裝置振動提醒（行動裝置）
          </span>
        </div>
        <ToggleSwitch
          :model-value="notificationSettings.vibrate"
          aria-label="啟用振動提醒"
          @update:model-value="updateSetting('vibrate', $event)"
        />
      </div>

      <!-- 持續時間 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-title">通知顯示時間</span>
          <span class="setting-description">
            桌面通知的持續顯示時間
          </span>
        </div>
        <select
          :value="notificationSettings.duration"
          class="duration-select"
          :disabled="!canShowNotifications"
          aria-label="通知持續時間"
          @change="updateSetting('duration', Number($event.target.value))"
        >
          <option :value="3000">3 秒</option>
          <option :value="5000">5 秒</option>
          <option :value="8000">8 秒</option>
          <option :value="0">不自動關閉</option>
        </select>
      </div>

      <!-- 提醒頻率 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-title">重複提醒</span>
          <span class="setting-description">
            若未回應通知，重複提醒間隔
          </span>
        </div>
        <select
          :value="notificationSettings.repeatInterval"
          class="repeat-select"
          :disabled="!canShowNotifications"
          aria-label="重複提醒間隔"
          @change="updateSetting('repeatInterval', Number($event.target.value))"
        >
          <option :value="0">不重複</option>
          <option :value="30000">30 秒</option>
          <option :value="60000">1 分鐘</option>
          <option :value="120000">2 分鐘</option>
          <option :value="300000">5 分鐘</option>
        </select>
      </div>

      <!-- 最大重複次數 -->
      <div 
        v-if="notificationSettings.repeatInterval > 0"
        class="setting-item"
      >
        <div class="setting-label">
          <span class="setting-title">最大重複次數</span>
          <span class="setting-description">
            最多重複提醒幾次
          </span>
        </div>
        <select
          :value="notificationSettings.maxRepeats"
          class="repeat-count-select"
          :disabled="!canShowNotifications"
          aria-label="最大重複次數"
          @change="updateSetting('maxRepeats', Number($event.target.value))"
        >
          <option :value="1">1 次</option>
          <option :value="3">3 次</option>
          <option :value="5">5 次</option>
          <option :value="10">10 次</option>
          <option :value="-1">無限制</option>
        </select>
      </div>
    </div>

    <!-- 預覽測試 -->
    <div class="preview-section">
      <h4 class="preview-title">預覽測試</h4>
      <button
        :disabled="isTestingNotification || !canShowNotifications"
        class="test-button"
        :class="{ testing: isTestingNotification }"
        @click="testNotification"
      >
        <Icon 
          :name="isTestingNotification ? 'mdi:loading' : 'mdi:bell-ring'" 
          :class="{ spinning: isTestingNotification }"
        />
        {{ isTestingNotification ? '測試中...' : '測試通知' }}
      </button>
      <p class="test-description">
        測試當前的通知設定
      </p>
    </div>

    <!-- 無障礙說明 -->
    <div class="accessibility-note">
      <Icon name="mdi:information-outline" class="info-icon" />
      <div class="note-content">
        <h5 class="note-title">無障礙功能</h5>
        <ul class="note-list">
          <li>通知內容包含計時器完成的詳細資訊</li>
          <li>支援螢幕報讀器朗讀通知內容</li>
          <li>視覺化通知配合聲音和振動提醒</li>
          <li>可自訂重複提醒確保不錯過重要通知</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FallbackAlertSettings } from '~/types/index'

// 型別定義
interface NotificationSettings {
  permission: NotificationPermission
  enabled: boolean
  sound: boolean
  vibrate: boolean
  duration: number
  repeatInterval: number
  maxRepeats: number
}

// 預設設定
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  permission: 'default',
  enabled: true,
  sound: true,
  vibrate: true,
  duration: 5000,
  repeatInterval: 0,
  maxRepeats: 3
}

// 響應式狀態
const notificationSettings = ref<NotificationSettings>({ ...DEFAULT_NOTIFICATION_SETTINGS })
const isTestingNotification = ref(false)

// 使用通知管理 composable
const notifications = useNotifications()

// 計算屬性
const canShowNotifications = computed(() => 
  notifications.isAvailable.value
)

const canVibrate = computed(() => 
  'vibrate' in navigator
)

const permissionStatusClass = computed(() => ({
  'permission-granted': notifications.state.permission === 'granted',
  'permission-denied': notifications.state.permission === 'denied',
  'permission-default': notifications.state.permission === 'default'
}))

const permissionIcon = computed(() => {
  switch (notifications.state.permission) {
    case 'granted': return 'mdi:check-circle'
    case 'denied': return 'mdi:close-circle'
    default: return 'mdi:help-circle'
  }
})

const permissionLabel = computed(() => {
  switch (notifications.state.permission) {
    case 'granted': return '通知已允許'
    case 'denied': return '通知已拒絕'
    default: return '需要通知權限'
  }
})

// 方法
function loadSettings() {
  try {
    const saved = localStorage.getItem('notification-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(notificationSettings.value, parsed)
    }
    
    // 更新權限狀態
    if ('Notification' in window) {
      notificationSettings.value.permission = Notification.permission
    }
  } catch (error) {
    console.error('載入通知設定失敗：', error)
  }
}

function saveSettings() {
  try {
    localStorage.setItem('notification-settings', JSON.stringify(notificationSettings.value))
  } catch (error) {
    console.error('儲存通知設定失敗：', error)
  }
}

function updateSetting<K extends keyof NotificationSettings>(
  key: K, 
  value: NotificationSettings[K]
) {
  notificationSettings.value[key] = value
  saveSettings()
}

async function requestPermission() {
  try {
    const permission = await notifications.requestPermission()
    notificationSettings.value.permission = permission
    saveSettings()
    
    if (permission === 'granted') {
      // 顯示歡迎通知
      await notifications.sendNotification('FlowSip', {
        body: '通知權限已啟用！現在您可以接收計時器完成提醒。',
        icon: '/icons/icon-192x192.png'
      })
    }
  } catch (error) {
    console.error('請求通知權限失敗：', error)
    if (!notifications.state.isSupported) {
      alert('此瀏覽器不支援桌面通知功能')
    }
  }
}


async function testNotification() {
  if (isTestingNotification.value) return
  
  isTestingNotification.value = true
  
  try {
    // 測試聲音（如果啟用）
    if (notificationSettings.value.sound) {
      await notifications.playAlertSound('notification-pop', 0.7)
    }

    // 測試通知
    if (canShowNotifications.value && notificationSettings.value.enabled) {
      await notifications.sendNotification('FlowSip 測試通知', {
        body: '這是一個測試通知。如果您看到這個訊息，表示通知設定正常運作。',
        tag: 'flowsip-test'
      })
    }

    // 測試振動
    if (notificationSettings.value.vibrate && canVibrate.value) {
      navigator.vibrate([100, 50, 100, 50, 100])
    }

    // 測試視覺提醒
    if (notifications.needsFallback.value) {
      await notifications.showVisualAlert('這是測試通知', 'pomodoro')
    }
  } catch (error) {
    console.error('測試通知失敗：', error)
  } finally {
    // 延遲重置按鈕狀態
    setTimeout(() => {
      isTestingNotification.value = false
    }, 2000)
  }
}

// 生命週期
onMounted(() => {
  loadSettings()
  // 同步 composable 的權限狀態
  notificationSettings.value.permission = notifications.state.permission
})

// 導出給外部使用
defineExpose({
  testNotification,
  notificationSettings: readonly(notificationSettings),
  notifications: readonly(notifications)
})
</script>

<style scoped>
.notification-prefs {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 標題區 */
.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.section-icon {
  font-size: 2rem;
  color: var(--color-primary);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.section-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* 權限狀態 */
.permission-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.permission-status.permission-granted {
  background: color-mix(in srgb, var(--color-success) 10%, var(--color-surface));
  border-color: var(--color-success);
}

.permission-status.permission-denied {
  background: color-mix(in srgb, var(--color-error) 10%, var(--color-surface));
  border-color: var(--color-error);
}

.permission-status.permission-default {
  background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface));
  border-color: var(--color-warning);
}

.permission-icon {
  font-size: 1.5rem;
}

.permission-granted .permission-icon {
  color: var(--color-success);
}

.permission-denied .permission-icon {
  color: var(--color-error);
}

.permission-default .permission-icon {
  color: var(--color-warning);
}

.permission-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.permission-label {
  font-weight: 500;
  color: var(--color-text-primary);
}

.permission-action {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.permission-action:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.permission-action:active {
  transform: translateY(0);
}

/* 設定群組 */
.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: opacity 0.3s ease;
}

.settings-group.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.setting-item:hover {
  border-color: var(--color-primary-muted);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.setting-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-title {
  font-weight: 500;
  color: var(--color-text-primary);
}

.setting-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* 選擇器樣式 */
.duration-select,
.repeat-select,
.repeat-count-select {
  padding: 0.5rem 0.75rem;
  background: var(--color-input-background);
  border: 1px solid var(--color-input-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.duration-select:focus,
.repeat-select:focus,
.repeat-count-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.duration-select:disabled,
.repeat-select:disabled,
.repeat-count-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 預覽測試區 */
.preview-section {
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  text-align: center;
}

.preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
}

.test-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.test-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent);
}

.test-button:active:not(:disabled) {
  transform: translateY(0);
}

.test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.test-button.testing {
  background: var(--color-secondary);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.test-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* 無障礙說明 */
.accessibility-note {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
  border-radius: 0.75rem;
}

.info-icon {
  font-size: 1.25rem;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.note-content {
  flex: 1;
}

.note-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.note-list {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  padding-left: 1rem;
  line-height: 1.5;
}

.note-list li {
  margin-bottom: 0.25rem;
}

.note-list li:last-child {
  margin-bottom: 0;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .notification-prefs {
    gap: 1rem;
  }
  
  .section-header {
    gap: 0.375rem;
    padding-bottom: 0.75rem;
  }
  
  .section-title {
    font-size: 1.125rem;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .setting-label {
    order: 1;
  }
  
  .duration-select,
  .repeat-select,
  .repeat-count-select {
    order: 2;
    min-width: auto;
  }
  
  .permission-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .permission-action {
    align-self: stretch;
    text-align: center;
  }
  
  .accessibility-note {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .info-icon {
    align-self: flex-start;
  }
}

/* 高對比模式 */
@media (prefers-contrast: high) {
  .permission-status {
    border-width: 2px;
  }
  
  .setting-item {
    border-width: 2px;
  }
  
  .test-button {
    border: 2px solid var(--color-primary-foreground);
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .setting-item,
  .test-button,
  .permission-status {
    transition: none;
  }
  
  .spinning {
    animation: none;
  }
  
  .test-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>