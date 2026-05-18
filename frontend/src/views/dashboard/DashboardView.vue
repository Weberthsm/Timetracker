<template>
  <div class="p-6 max-w-6xl mx-auto">

    <!-- Active timer banner -->
    <div v-if="timerStore.activeTimer" class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-blue-900">Timer ativo</p>
        <p class="text-xs text-blue-700 mt-0.5">
          {{ timerStore.activeTimer.project?.name ?? 'Sem projeto' }} ·
          {{ timerStore.activeTimer.task?.title ?? timerStore.activeTimer.description ?? 'Sem descrição' }}
        </p>
      </div>
      <div class="flex items-center gap-4">
        <span class="font-mono text-lg font-semibold text-blue-900">{{ elapsedTime }}</span>
        <BaseButton variant="danger" size="sm" @click="stopTimer">Parar</BaseButton>
      </div>
    </div>

    <!-- ── TODAY section ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-semibold text-gray-700">Hoje · {{ todayLabel }}</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-sm font-medium text-gray-500">Horas hoje</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ formattedTotal }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ dailyReport?.entries?.length ?? 0 }} lançamento(s)</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-sm font-medium text-gray-500">Projetos hoje</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ dailyReport?.byProject?.length ?? 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">projeto(s) trabalhado(s)</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-sm font-medium text-gray-500">Principal hoje</p>
        <p class="text-lg font-bold text-gray-900 mt-1 truncate">{{ topProject?.projectName ?? '—' }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ topProject ? Math.round(topProject.percentage) + '% do dia' : 'Sem registros' }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Alocação por projeto</h2>
        <DoughnutChart v-if="!loading" :items="chartItems" />
        <div v-else class="h-40 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Atividades de hoje</h2>
        <div v-if="loading" class="text-sm text-gray-400">Carregando...</div>
        <div v-else-if="!dailyReport?.entries?.length" class="text-center py-8">
          <p class="text-sm text-gray-500 mb-3">Nenhuma atividade registrada hoje</p>
        </div>
        <ul v-else class="divide-y divide-gray-100">
          <li v-for="entry in dailyReport.entries" :key="entry.id" class="py-2 flex items-center justify-between text-sm">
            <div>
              <p class="font-medium text-gray-800">{{ entry.task?.title ?? entry.description ?? '—' }}</p>
              <p class="text-xs text-gray-500">{{ entry.project?.name ?? '—' }} · {{ formatTime(entry.startedAt) }}</p>
            </div>
            <span class="text-gray-600 font-mono text-xs">{{ formatDuration(entry.duration ?? 0) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── MONTHLY SUMMARY section ────────────────────────────────── -->
    <div class="mt-10">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-base font-semibold text-gray-700">Resumo do Mês</h2>
        <div class="flex items-center gap-1">
          <button
            class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none"
            title="Mês anterior"
            @click="shiftReportMonth(-1)"
          >‹</button>
          <input
            v-model="reportMonth"
            type="month"
            :max="currentMonth"
            class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none disabled:opacity-30"
            :disabled="reportMonth >= currentMonth"
            title="Próximo mês"
            @click="shiftReportMonth(1)"
          >›</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500">Total do mês</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ monthFormattedTotal }}</p>
          <p class="text-xs text-gray-400 mt-1">horas registradas</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500">Dias trabalhados</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ monthDaysWorked }}</p>
          <p class="text-xs text-gray-400 mt-1">com pelo menos 1 lançamento</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm font-medium text-gray-500">Média por dia</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ monthAvgPerDay }}</p>
          <p class="text-xs text-gray-400 mt-1">nos dias trabalhados</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Projetos do mês</h3>
        <div v-if="monthLoading" class="h-40 flex items-center justify-center text-sm text-gray-400">Carregando...</div>
        <div v-else-if="!monthChartItems.length" class="h-40 flex items-center justify-center text-sm text-gray-400">
          Sem lançamentos neste mês
        </div>
        <DoughnutChart v-else :items="monthChartItems" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { format, addMonths } from 'date-fns'
import { reportsService } from '@/services/reports.service'
import { useTimeEntriesStore } from '@/stores/timeEntries'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'

// ── Types ────────────────────────────────────────────────────────────────────

interface DailyEntry {
  id: string
  description: string | null
  startedAt: string
  duration: number | null
  task?: { id: string; title: string } | null
  project?: { id: string; name: string; color: string } | null
}

interface ByProject {
  projectId: string
  projectName: string
  color: string | null
  totalSeconds: number
  percentage: number
  totalFormatted: string
}

interface DailyReport {
  date: string
  totalSeconds: number
  totalFormatted: string
  byProject: ByProject[]
  entries: DailyEntry[]
}

interface MonthlyByProject {
  projectId: string
  projectName: string
  color: string | null
  totalSeconds: number
  percentage: number
}

interface MonthlyByDay {
  date: string
  totalSeconds: number
}

interface MonthlyReport {
  month: string
  totalSeconds: number
  totalFormatted: string
  byProject: MonthlyByProject[]
  byDay: MonthlyByDay[]
}

// ── State ────────────────────────────────────────────────────────────────────

const authStore = useAuthStore()
const timerStore = useTimeEntriesStore()

const dailyReport = ref<DailyReport | null>(null)
const loading = ref(true)
const elapsed = ref(0)
let refreshInterval: ReturnType<typeof setInterval> | null = null
let timerInterval: ReturnType<typeof setInterval> | null = null

const currentMonth = format(new Date(), 'yyyy-MM')
const reportMonth = ref(currentMonth)
const monthReport = ref<MonthlyReport | null>(null)
const monthLoading = ref(false)

// ── Today helpers ────────────────────────────────────────────────────────────

const todayLabel = format(new Date(), 'dd/MM/yyyy')

async function load() {
  const userId = authStore.user?.id
  if (!userId) return
  loading.value = true
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const res = await reportsService.daily({ date: today, userId })
    dailyReport.value = (res.data as { data: DailyReport }).data
    await timerStore.fetchActiveTimer()
    resetElapsed()
  } finally {
    loading.value = false
  }
}

function resetElapsed() {
  if (timerInterval) clearInterval(timerInterval)
  if (timerStore.activeTimer?.startedAt) {
    const start = new Date(timerStore.activeTimer.startedAt).getTime()
    elapsed.value = Math.floor((Date.now() - start) / 1000)
    timerInterval = setInterval(() => { elapsed.value++ }, 1000)
  }
}

async function stopTimer() {
  if (timerStore.activeTimer) {
    await timerStore.stopTimer(timerStore.activeTimer.id)
    if (timerInterval) clearInterval(timerInterval)
    elapsed.value = 0
    await load()
  }
}

const formattedTotal = computed(() => {
  const secs = dailyReport.value?.totalSeconds ?? 0
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
})

const elapsedTime = computed(() => {
  const h = Math.floor(elapsed.value / 3600)
  const m = Math.floor((elapsed.value % 3600) / 60)
  const s = elapsed.value % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const topProject = computed(() =>
  (dailyReport.value?.byProject ?? []).sort((a, b) => b.totalSeconds - a.totalSeconds)[0] ?? null,
)

const chartItems = computed(() =>
  (dailyReport.value?.byProject ?? []).map((p) => ({
    label: p.projectName,
    percentage: p.percentage,
    duration: p.totalSeconds,
  })),
)

function formatTime(iso: string) { return format(new Date(iso), 'HH:mm') }

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

// ── Monthly helpers ──────────────────────────────────────────────────────────

async function loadMonthReport() {
  const userId = authStore.user?.id
  if (!userId) return
  monthLoading.value = true
  try {
    const res = await reportsService.monthly({ month: reportMonth.value, userId })
    monthReport.value = (res.data as { data: MonthlyReport }).data
  } catch {
    monthReport.value = null
  } finally {
    monthLoading.value = false
  }
}

function shiftReportMonth(delta: number) {
  const [y, m] = reportMonth.value.split('-').map(Number)
  const next = format(addMonths(new Date(y, m - 1, 1), delta), 'yyyy-MM')
  if (next > currentMonth) return
  reportMonth.value = next
}

const monthFormattedTotal = computed(() => {
  const secs = monthReport.value?.totalSeconds ?? 0
  if (secs === 0) return '0min'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
})

const monthDaysWorked = computed(() =>
  (monthReport.value?.byDay ?? []).filter((d) => d.totalSeconds > 0).length,
)

const monthAvgPerDay = computed(() => {
  const days = monthDaysWorked.value
  if (!days) return '0min'
  const avg = Math.floor((monthReport.value?.totalSeconds ?? 0) / days)
  const h = Math.floor(avg / 3600)
  const m = Math.floor((avg % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
})

const monthChartItems = computed(() =>
  (monthReport.value?.byProject ?? []).map((p) => ({
    label: p.projectName,
    percentage: p.percentage,
    duration: p.totalSeconds,
  })),
)

watch(reportMonth, loadMonthReport)

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([load(), loadMonthReport()])
  refreshInterval = setInterval(load, 60_000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (timerInterval) clearInterval(timerInterval)
})
</script>
