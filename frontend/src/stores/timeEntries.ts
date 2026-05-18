import { defineStore } from 'pinia'
import { ref } from 'vue'
import { timeEntriesService, type TimeEntry } from '@/services/time-entries.service'

export const useTimeEntriesStore = defineStore('timeEntries', () => {
  const entries = ref<TimeEntry[]>([])
  const activeTimer = ref<TimeEntry | null>(null)

  async function fetchToday() {
    const today = new Date().toISOString().slice(0, 10)
    const res = await timeEntriesService.list({ date: today })
    entries.value = (res.data as { data: { data: TimeEntry[] } }).data.data
  }

  async function fetchActiveTimer() {
    try {
      const res = await timeEntriesService.activeTimer()
      activeTimer.value = (res.data as { data: TimeEntry | null }).data
    } catch {
      activeTimer.value = null
    }
  }

  async function stopTimer(id: string) {
    await timeEntriesService.stopTimer(id)
    activeTimer.value = null
    await fetchToday()
  }

  function clearActiveTimer() {
    activeTimer.value = null
  }

  return { entries, activeTimer, fetchToday, fetchActiveTimer, stopTimer, clearActiveTimer }
})
