<template>
  <div class="flex items-center gap-2">
    <template v-if="isActive && store.activeTimer">
      <div data-testid="active-timer" class="flex items-center gap-2">
        <span v-if="isLongRunning" class="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">+24h</span>
        <span class="text-sm text-gray-600 hidden sm:block max-w-32 truncate">{{ store.activeTimer.project?.name ?? store.activeTimer.task?.title ?? '—' }}</span>
        <span class="font-mono text-sm font-semibold text-gray-800">{{ elapsedFormatted }}</span>
        <BaseButton data-testid="stop-timer-btn" variant="danger" size="sm" @click="stopTimer">&#9632; Parar</BaseButton>
      </div>
    </template>
    <BaseButton v-else data-testid="start-timer-btn" variant="secondary" size="sm" @click="showModal = true">&#9654; Timer</BaseButton>

    <StartTimerModal :open="showModal" @close="showModal = false" @started="showModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useTimeEntriesStore } from '@/stores/timeEntries'
import { useTimer } from '@/composables/useTimer'
import BaseButton from '@/components/ui/BaseButton.vue'
import StartTimerModal from './StartTimerModal.vue'

const store = useTimeEntriesStore()
const { isActive, elapsedFormatted, isLongRunning, stop, startCounting, stopCounting } = useTimer()
const showModal = ref(false)

async function stopTimer() {
  if (store.activeTimer) await stop(store.activeTimer.id)
}

// React to a timer being started (e.g. from the modal) after this component
// was already mounted, and to a timer being cleared externally.
watch(
  () => store.activeTimer,
  (timer) => {
    if (timer) {
      startCounting()
    } else {
      stopCounting()
    }
  },
)

onMounted(async () => {
  await store.fetchActiveTimer()
  if (store.activeTimer) startCounting()
})
</script>
