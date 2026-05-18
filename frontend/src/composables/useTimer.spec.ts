import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

vi.mock('@/services/time-entries.service', () => ({
  timeEntriesService: {
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    activeTimer: vi.fn(),
    list: vi.fn(),
  },
}))

import { timeEntriesService } from '@/services/time-entries.service'
import { useTimeEntriesStore } from '@/stores/timeEntries'
import { useTimer } from './useTimer'

const mockEntry = {
  id: 't1',
  description: null,
  startedAt: new Date(Date.now() - 90_000).toISOString(),
  endedAt: null,
  duration: null,
  userId: 'u1',
  taskId: 'task1',
  projectId: null,
}

function createTestWrapper() {
  const pinia = createPinia()
  setActivePinia(pinia)

  let timerRef: ReturnType<typeof useTimer>
  const TestComp = defineComponent({
    setup() {
      timerRef = useTimer()
      return {}
    },
    template: '<div />',
  })
  const wrapper = mount(TestComp, { global: { plugins: [pinia] } })
  return { wrapper, get timer() { return timerRef } }
}

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('elapsedFormatted: "00:01:30" para 90 segundos', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const TestComp = defineComponent({
      setup() {
        const timer = useTimer()
        timer.elapsed.value = 90
        return { timer }
      },
      template: '<div>{{ timer.elapsedFormatted }}</div>',
    })
    const wrapper = mount(TestComp, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('00:01:30')
    wrapper.unmount()
  })

  it('isLongRunning: true quando elapsed > 86400', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const TestComp = defineComponent({
      setup() {
        const timer = useTimer()
        timer.elapsed.value = 86401
        return { timer }
      },
      template: '<div />',
    })
    const wrapper = mount(TestComp, { global: { plugins: [pinia] } })
    const vm = wrapper.vm as any
    expect(vm.timer.isLongRunning.value).toBe(true)
    wrapper.unmount()
  })

  it('stop: limpa activeTimer e zera elapsed', async () => {
    vi.mocked(timeEntriesService.stopTimer).mockResolvedValue(undefined as never)
    vi.mocked(timeEntriesService.activeTimer).mockResolvedValue({ data: { data: null } } as never)

    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useTimeEntriesStore()
    store.activeTimer = mockEntry as never

    const TestComp = defineComponent({
      setup() {
        return { timer: useTimer() }
      },
      template: '<div />',
    })
    const wrapper = mount(TestComp, { global: { plugins: [pinia] } })
    const { timer } = (wrapper.vm as any)
    timer.elapsed.value = 90

    await timer.stop('t1')
    await nextTick()

    expect(store.activeTimer).toBeNull()
    expect(timer.elapsed.value).toBe(0)
    wrapper.unmount()
  })
})
