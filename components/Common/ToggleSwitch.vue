<template>
  <button
    :class="toggleClasses"
    :disabled="disabled"
    :aria-checked="modelValue"
    :aria-label="ariaLabel"
    role="switch"
    @click="toggle"
    @keydown="handleKeydown"
  >
    <span class="toggle-track">
      <span class="toggle-thumb" />
    </span>
    <span v-if="showLabel" class="toggle-label">
      {{ modelValue ? onLabel : offLabel }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  modelValue: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onLabel?: string
  offLabel?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
  showLabel: false,
  onLabel: '開啟',
  offLabel: '關閉',
  ariaLabel: '切換開關'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 計算屬性
const toggleClasses = computed(() => ({
  'toggle-switch': true,
  'toggle-switch--on': props.modelValue,
  'toggle-switch--off': !props.modelValue,
  'toggle-switch--disabled': props.disabled,
  [`toggle-switch--${props.size}`]: true,
  'toggle-switch--with-label': props.showLabel
}))

// 方法
function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
  }
}
</script>

<style scoped>
.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.toggle-switch:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.toggle-switch--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 軌道樣式 */
.toggle-track {
  position: relative;
  display: block;
  border-radius: 9999px;
  transition: all 0.2s ease;
  background: var(--color-input-border);
  border: 1px solid var(--color-border);
}

/* 不同尺寸的軌道 */
.toggle-switch--sm .toggle-track {
  width: 2rem;
  height: 1rem;
}

.toggle-switch--md .toggle-track {
  width: 2.75rem;
  height: 1.5rem;
}

.toggle-switch--lg .toggle-track {
  width: 3.5rem;
  height: 2rem;
}

/* 開啟狀態的軌道 */
.toggle-switch--on .toggle-track {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.toggle-switch--disabled .toggle-track {
  background: var(--color-muted);
  border-color: var(--color-border);
}

/* 滑塊樣式 */
.toggle-thumb {
  position: absolute;
  top: 50%;
  left: 0.125rem;
  transform: translateY(-50%);
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px color-mix(in srgb, black 20%, transparent);
  transition: all 0.2s ease;
  border: 1px solid var(--color-border);
}

/* 不同尺寸的滑塊 */
.toggle-switch--sm .toggle-thumb {
  width: 0.75rem;
  height: 0.75rem;
}

.toggle-switch--md .toggle-thumb {
  width: 1.25rem;
  height: 1.25rem;
}

.toggle-switch--lg .toggle-thumb {
  width: 1.5rem;
  height: 1.5rem;
}

/* 開啟狀態的滑塊位置 */
.toggle-switch--sm.toggle-switch--on .toggle-thumb {
  transform: translateY(-50%) translateX(1rem);
}

.toggle-switch--md.toggle-switch--on .toggle-thumb {
  transform: translateY(-50%) translateX(1.25rem);
}

.toggle-switch--lg.toggle-switch--on .toggle-thumb {
  transform: translateY(-50%) translateX(1.5rem);
}

/* 標籤樣式 */
.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: color 0.2s ease;
}

.toggle-switch--disabled .toggle-label {
  color: var(--color-text-disabled);
}

/* 互動狀態 */
.toggle-switch:not(.toggle-switch--disabled):hover .toggle-track {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.toggle-switch--on:not(.toggle-switch--disabled):hover .toggle-track {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.toggle-switch:not(.toggle-switch--disabled):active .toggle-thumb {
  transform: translateY(-50%) scale(0.95);
}

.toggle-switch--sm:not(.toggle-switch--disabled):active.toggle-switch--on .toggle-thumb {
  transform: translateY(-50%) translateX(1rem) scale(0.95);
}

.toggle-switch--md:not(.toggle-switch--disabled):active.toggle-switch--on .toggle-thumb {
  transform: translateY(-50%) translateX(1.25rem) scale(0.95);
}

.toggle-switch--lg:not(.toggle-switch--disabled):active.toggle-switch--on .toggle-thumb {
  transform: translateY(-50%) translateX(1.5rem) scale(0.95);
}

/* 暗色主題調整 */
.dark .toggle-thumb {
  background: var(--color-surface);
  border-color: var(--color-border);
}

.dark .toggle-switch--on .toggle-thumb {
  background: white;
  border-color: transparent;
}

/* 高對比模式 */
@media (prefers-contrast: high) {
  .toggle-track {
    border-width: 2px;
  }
  
  .toggle-thumb {
    border-width: 2px;
    box-shadow: 0 2px 6px color-mix(in srgb, black 40%, transparent);
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .toggle-switch,
  .toggle-track,
  .toggle-thumb,
  .toggle-label {
    transition: none;
  }
}
</style>