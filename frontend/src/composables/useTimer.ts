import { ref, computed } from 'vue'
import { useTimeEntriesStore } from '@/stores/timeEntries'
import { timeEntriesService } from '@/services/time-entries.service'

// ── Singleton state ────────────────────────────────────────────────────────
// Module-level: shared by every caller. The interval survives component
// unmounts (e.g. the StartTimerModal closing) so ActiveTimer keeps ticking.
const elapsed = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

export function useTimer() {
  const store = useTimeEntriesStore()

  const isActive = computed(() => !!store.activeTimer)

  const elapsedFormatted = computed(() => {
    const h = Math.floor(elapsed.value / 3600)
    const m = Math.floor((elapsed.value % 3600) / 60)
    const s = elapsed.value % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const isLongRunning = computed(() => elapsed.value > 86400)

  function startCounting() {
    if (!store.activeTimer) return
    if (intervalId) clearInterval(intervalId)
    const startedAt = new Date(store.activeTimer.startedAt).getTime()
    // Seed immediately so there is no 1-second blank flash
    elapsed.value = Math.floor((Date.now() - startedAt) / 1000)
    intervalId = setInterval(() => {
      elapsed.value = Math.floor((Date.now() - startedAt) / 1000)
    }, 1000)
  }

  function stopCounting() {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
  }

  async function start(dto: { projectId: string; taskId?: string; description?: string }) {
    await timeEntriesService.startTimer(dto)
    await store.fetchActiveTimer()
    startCounting()
  }

  async function stop(timerId: string) {
    await timeEntriesService.stopTimer(timerId)
    store.clearActiveTimer()
    stopCounting()
    elapsed.value = 0
  }

  // No onUnmounted here — the singleton interval must not be killed by
  // the modal (or any other short-lived component) unmounting.

  return { isActive, elapsed, elapsedFormatted, isLongRunning, startCounting, stopCounting, start, stop }
}
