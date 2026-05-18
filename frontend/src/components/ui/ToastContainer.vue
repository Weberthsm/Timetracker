<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          data-testid="toast"
          :class="['flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto text-sm', variantClass(toast.type)]"
        >
          <span class="text-base leading-none mt-0.5">{{ icon(toast.type) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts } = useToast()

function variantClass(type: ToastType) {
  return {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-600 text-white',
  }[type]
}

function icon(type: ToastType) {
  return { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[type]
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>
