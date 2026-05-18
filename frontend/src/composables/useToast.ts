import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function add(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      const idx = toasts.value.findIndex((t) => t.id === id)
      if (idx !== -1) toasts.value.splice(idx, 1)
    }, duration)
  }

  return { toasts, add }
})

export function useToast() {
  const store = useToastStore()
  const { toasts } = storeToRefs(store)

  function show(message: string, type: ToastType = 'info', duration = 4000) {
    store.add(message, type, duration)
  }

  function success(message: string) {
    show(message, 'success')
  }

  function error(message: string) {
    show(message, 'error')
  }

  function warning(message: string) {
    show(message, 'warning')
  }

  return { show, success, error, warning, toasts }
}
