import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsService, type SystemSettings } from '@/services/settings.service'

export type EntryInputMode = 'times' | 'start-duration' | 'duration-only'

export const useSettingsStore = defineStore('settings', () => {
  const allowTimesMode         = ref(true)
  const allowStartDurationMode = ref(true)
  const allowDurationOnlyMode  = ref(false)
  const loaded                 = ref(false)

  /** Ordered list of modes the admin has enabled */
  const availableModes = computed<EntryInputMode[]>(() => {
    const modes: EntryInputMode[] = []
    if (allowTimesMode.value)         modes.push('times')
    if (allowStartDurationMode.value) modes.push('start-duration')
    if (allowDurationOnlyMode.value)  modes.push('duration-only')
    // Fallback: always expose at least the times mode so the form never breaks
    return modes.length ? modes : ['times']
  })

  async function load() {
    try {
      const res = await settingsService.get()
      const d = (res.data as { data: SystemSettings }).data
      allowTimesMode.value         = d.allowTimesMode ?? true
      allowStartDurationMode.value = d.allowStartDurationMode ?? true
      allowDurationOnlyMode.value  = d.allowDurationOnlyMode ?? false
    } catch {
      // Keep defaults on error
    } finally {
      loaded.value = true
    }
  }

  return {
    allowTimesMode, allowStartDurationMode, allowDurationOnlyMode,
    availableModes, loaded,
    load,
  }
})
