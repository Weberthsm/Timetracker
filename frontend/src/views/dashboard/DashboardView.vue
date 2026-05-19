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
        <DoughnutChart v-if="!loading" :items="chartItems" @segment-click="onTodayChartClick" />
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
              <p class="text-xs text-gray-500">{{ entry.project?.name ?? '—' }} · {{ entry.startedAt ? formatTime(entry.startedAt) : 'sem horário' }}</p>
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
        <DoughnutChart v-else :items="monthChartItems" @segment-click="onMonthChartClick" />
      </div>
    </div>

    <!-- ── INVESTMENT OVERVIEW section (admin / manager) ─────────── -->
    <div v-if="canSeeOverview" class="mt-10">
      <div class="mb-5">
        <h2 class="text-base font-semibold text-gray-700">Investimento por Projeto</h2>
        <p class="text-xs text-gray-400 mt-0.5">Todos os colaboradores · clique em Hoje ou no mês para ver detalhes</p>
      </div>

      <!-- Skeleton -->
      <div v-if="overviewLoading" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
          <div class="w-2.5 h-2.5 rounded-full bg-gray-200 flex-shrink-0" />
          <div class="flex-1 h-3.5 bg-gray-100 rounded animate-pulse" />
          <div class="w-14 h-3.5 bg-gray-100 rounded animate-pulse" />
          <div class="w-16 h-3.5 bg-gray-100 rounded animate-pulse" />
          <div class="w-18 h-3.5 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!projectOverview.length" class="text-center py-12 text-sm text-gray-400">
        Nenhum lançamento encontrado no período
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-xs text-gray-500 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium">Projeto</th>

              <!-- Dia navegável -->
              <th class="px-4 py-2 font-medium">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-0.5 rounded hover:bg-gray-200 text-gray-500 leading-none transition-colors"
                    title="Dia anterior"
                    @click="shiftOverviewDay(-1)"
                  >‹</button>
                  <span class="whitespace-nowrap">{{ overviewDayLabel }}</span>
                  <button
                    class="p-0.5 rounded hover:bg-gray-200 text-gray-500 leading-none transition-colors disabled:opacity-30"
                    :disabled="overviewDay >= todayIso"
                    title="Próximo dia"
                    @click="shiftOverviewDay(1)"
                  >›</button>
                  <span v-if="overviewDayLoading" class="ml-1 text-gray-400 animate-pulse">…</span>
                </div>
              </th>

              <!-- Mês navegável -->
              <th class="px-4 py-2 font-medium">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-0.5 rounded hover:bg-gray-200 text-gray-500 leading-none transition-colors"
                    title="Mês anterior"
                    @click="shiftOverviewMonth(-1)"
                  >‹</button>
                  <span class="whitespace-nowrap">{{ overviewMonthLabel }}</span>
                  <button
                    class="p-0.5 rounded hover:bg-gray-200 text-gray-500 leading-none transition-colors disabled:opacity-30"
                    :disabled="overviewMonth >= currentMonth"
                    title="Próximo mês"
                    @click="shiftOverviewMonth(1)"
                  >›</button>
                  <span v-if="overviewMonthLoading" class="ml-1 text-gray-400 animate-pulse">…</span>
                </div>
              </th>

              <!-- Ano navegável -->
              <th class="px-4 py-2 font-medium">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-0.5 rounded hover:bg-gray-200 text-gray-500 leading-none transition-colors"
                    title="Ano anterior"
                    @click="shiftOverviewYear(-1)"
                  >‹</button>
                  <span>{{ overviewYear }}</span>
                  <button
                    class="p-0.5 rounded hover:bg-gray-200 text-gray-500 leading-none transition-colors disabled:opacity-30"
                    :disabled="overviewYear >= currentYear"
                    title="Próximo ano"
                    @click="shiftOverviewYear(1)"
                  >›</button>
                  <span v-if="overviewYearLoading" class="ml-1 text-gray-400 animate-pulse">…</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="row in projectOverview" :key="row.projectId" class="hover:bg-gray-50 transition-colors">
              <!-- Project name -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: row.color ?? '#9CA3AF' }"
                  />
                  <span class="font-medium text-gray-800 truncate max-w-52">{{ row.name }}</span>
                </div>
              </td>

              <!-- Dia (clickable when > 0) -->
              <td class="px-4 py-3 text-right">
                <button
                  v-if="row.daySeconds > 0"
                  class="text-right hover:opacity-75 transition-opacity"
                  @click="onOverviewDayClick(row)"
                >
                  <div class="font-mono font-semibold text-blue-600">{{ formatDuration(row.daySeconds) }}</div>
                  <div class="text-xs text-gray-400">{{ pct(row.daySeconds, overviewDayTotal) }}</div>
                </button>
                <span v-else class="font-mono text-gray-300">—</span>
              </td>

              <!-- Este Mês (clickable when > 0) -->
              <td class="px-4 py-3 text-right">
                <button
                  v-if="row.monthSeconds > 0"
                  class="text-right hover:opacity-75 transition-opacity"
                  @click="onOverviewMonthClick(row)"
                >
                  <div class="font-mono text-blue-600">{{ formatDuration(row.monthSeconds) }}</div>
                  <div class="text-xs text-gray-400">{{ pct(row.monthSeconds, overviewMonthTotal) }}</div>
                </button>
                <span v-else class="font-mono text-gray-300">—</span>
              </td>

              <!-- Este Ano -->
              <td class="px-4 py-3 text-right">
                <div class="font-mono font-semibold text-gray-700">{{ formatDuration(row.yearSeconds) }}</div>
                <div class="text-xs text-gray-400">{{ pct(row.yearSeconds, overviewYearTotal) }}</div>
              </td>
            </tr>
          </tbody>

          <!-- Totals row -->
          <tfoot>
            <tr class="border-t border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
              <td class="px-4 py-2.5">Total</td>
              <td class="px-4 py-2.5 text-right font-mono">
                {{ overviewDayTotal > 0 ? formatDuration(overviewDayTotal) : '—' }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono">
                {{ overviewMonthTotal > 0 ? formatDuration(overviewMonthTotal) : '—' }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono">{{ formatDuration(overviewYearTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ── Drill-down modal ────────────────────────────────────────── -->
    <BaseModal :open="drillOpen" :title="drillTitle" size="lg" @close="drillOpen = false">
      <!-- Today: entries for the clicked project -->
      <template v-if="drillType === 'today-entries'">
        <div v-if="!drillEntries.length" class="text-center py-8 text-sm text-gray-400">
          Nenhum lançamento encontrado
        </div>
        <ul v-else class="divide-y divide-gray-100">
          <li
            v-for="entry in drillEntries"
            :key="entry.id"
            class="py-3 flex items-center justify-between text-sm"
          >
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-800 truncate">{{ entry.task?.title ?? entry.description ?? '—' }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                <template v-if="entry.startedAt">{{ formatTime(entry.startedAt) }}</template>
                <span v-else class="italic">sem horário</span>
              </p>
            </div>
            <span class="font-mono text-gray-600 ml-4 flex-shrink-0">{{ formatDuration(entry.duration ?? 0) }}</span>
          </li>
        </ul>
        <p class="text-xs text-gray-400 text-right mt-3">
          Total: <strong class="text-gray-700">{{ formatDuration(drillEntries.reduce((s, e) => s + (e.duration ?? 0), 0)) }}</strong>
        </p>
      </template>

      <!-- Month: entries for the clicked project -->
      <template v-else-if="drillType === 'month-entries'">
        <div v-if="drillLoading" class="text-center py-10 text-sm text-gray-400">
          Carregando lançamentos...
        </div>
        <div v-else-if="!drillMonthEntries.length" class="text-center py-8 text-sm text-gray-400">
          Nenhum lançamento encontrado
        </div>
        <template v-else>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-xs text-gray-500">
                <th class="text-left pb-2 font-medium">Data</th>
                <th class="text-left pb-2 font-medium">Colaborador</th>
                <th class="text-left pb-2 font-medium">Tarefa / Descrição</th>
                <th class="text-left pb-2 font-medium">Início</th>
                <th class="text-right pb-2 font-medium">Duração</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="e in drillMonthEntries" :key="e.id" class="hover:bg-gray-50">
                <td class="py-2.5 pr-3 text-gray-600 whitespace-nowrap">{{ e.date ? formatDayShort(e.date) : '—' }}</td>
                <td class="py-2.5 pr-3 text-gray-600 truncate max-w-24">{{ e.user?.name ?? '—' }}</td>
                <td class="py-2.5 pr-3 font-medium text-gray-800">{{ e.task?.title ?? e.description ?? '—' }}</td>
                <td class="py-2.5 pr-3 font-mono text-gray-600">{{ e.startedAt ? formatTime(e.startedAt) : '—' }}</td>
                <td class="py-2.5 text-right font-mono text-gray-700">{{ formatDuration(e.duration ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-gray-400 text-right mt-3 pt-2 border-t border-gray-100">
            Total: <strong class="text-gray-700">{{ formatDuration(drillMonthEntries.reduce((s, e) => s + (e.duration ?? 0), 0)) }}</strong>
            · {{ drillMonthEntries.length }} lançamento(s)
          </p>
        </template>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { format, addDays, addMonths } from 'date-fns'
import { reportsService } from '@/services/reports.service'
import { timeEntriesService } from '@/services/time-entries.service'
import type { TimeEntry } from '@/services/time-entries.service'
import { useTimeEntriesStore } from '@/stores/timeEntries'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'

// ── Types ────────────────────────────────────────────────────────────────────

interface DailyEntry {
  id: string
  description: string | null
  startedAt: string | null
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
  totalFormatted: string
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

// Minimal shape needed from allocation response
interface AllocProjectSlice {
  projectId: string
  projectName: string
  color: string | null
  totalSeconds: number
}
interface AllocMember { byProject: AllocProjectSlice[] }
interface AllocReport { members: AllocMember[] }

interface ProjectOverviewRow {
  projectId: string
  name: string
  color: string | null
  daySeconds: number
  monthSeconds: number
  yearSeconds: number
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
const currentYear = new Date().getFullYear()
const reportMonth = ref(currentMonth)
const monthReport = ref<MonthlyReport | null>(null)
const monthLoading = ref(false)

// ── Project overview (admin/manager) ─────────────────────────────────────────

const overviewDay   = ref(format(new Date(), 'yyyy-MM-dd'))
const overviewMonth = ref(currentMonth)
const overviewYear  = ref(currentYear)

// Per-period aggregated maps: projectId → totalSeconds + meta
type PeriodMap = Record<string, { projectId: string; name: string; color: string | null; seconds: number }>

const overviewDayMap  = ref<PeriodMap>({})
const overviewMonthMap = ref<PeriodMap>({})
const overviewYearMap  = ref<PeriodMap>({})

const overviewDayLoading   = ref(false)
const overviewMonthLoading = ref(false)
const overviewYearLoading  = ref(false)

const overviewLoading = computed(
  () => overviewDayLoading.value || overviewMonthLoading.value || overviewYearLoading.value,
)

const canSeeOverview = computed(() => {
  const role = authStore.user?.role
  return role === 'admin' || role === 'manager'
})

function buildPeriodMap(report: AllocReport | null): PeriodMap {
  const map: PeriodMap = {}
  for (const member of report?.members ?? []) {
    for (const p of member.byProject) {
      if (!map[p.projectId]) map[p.projectId] = { projectId: p.projectId, name: p.projectName, color: p.color, seconds: 0 }
      map[p.projectId].seconds += p.totalSeconds
    }
  }
  return map
}

async function loadOverviewDay() {
  overviewDayLoading.value = true
  try {
    const res = await reportsService.allocation({ granularity: 'day', value: overviewDay.value })
    overviewDayMap.value = buildPeriodMap((res.data as { data: AllocReport }).data)
  } catch { overviewDayMap.value = {} } finally { overviewDayLoading.value = false }
}

async function loadOverviewMonth() {
  overviewMonthLoading.value = true
  try {
    const res = await reportsService.allocation({ granularity: 'month', value: overviewMonth.value })
    overviewMonthMap.value = buildPeriodMap((res.data as { data: AllocReport }).data)
  } catch { overviewMonthMap.value = {} } finally { overviewMonthLoading.value = false }
}

async function loadOverviewYear() {
  overviewYearLoading.value = true
  try {
    const res = await reportsService.allocation({ granularity: 'year', value: String(overviewYear.value) })
    overviewYearMap.value = buildPeriodMap((res.data as { data: AllocReport }).data)
  } catch { overviewYearMap.value = {} } finally { overviewYearLoading.value = false }
}

async function loadProjectOverview() {
  if (!canSeeOverview.value) return
  await Promise.all([loadOverviewDay(), loadOverviewMonth(), loadOverviewYear()])
}

// Merge the three maps into a single sorted list
const projectOverview = computed<ProjectOverviewRow[]>(() => {
  const allIds = new Set([
    ...Object.keys(overviewDayMap.value),
    ...Object.keys(overviewMonthMap.value),
    ...Object.keys(overviewYearMap.value),
  ])
  const rows: ProjectOverviewRow[] = []
  for (const id of allIds) {
    const d = overviewDayMap.value[id]
    const m = overviewMonthMap.value[id]
    const y = overviewYearMap.value[id]
    const meta = d ?? m ?? y
    if (!meta) continue
    rows.push({
      projectId: id,
      name: meta.name,
      color: meta.color,
      daySeconds:   d?.seconds ?? 0,
      monthSeconds: m?.seconds ?? 0,
      yearSeconds:  y?.seconds ?? 0,
    })
  }
  return rows.sort((a, b) => b.yearSeconds - a.yearSeconds)
})

const overviewDayTotal   = computed(() => Object.values(overviewDayMap.value).reduce((s, p) => s + p.seconds, 0))
const overviewMonthTotal = computed(() => Object.values(overviewMonthMap.value).reduce((s, p) => s + p.seconds, 0))
const overviewYearTotal  = computed(() => Object.values(overviewYearMap.value).reduce((s, p) => s + p.seconds, 0))

const overviewDayLabel = computed(() =>
  format(new Date(overviewDay.value + 'T00:00:00'), 'dd/MM'),
)

const overviewMonthLabel = computed(() => {
  const [y, m] = overviewMonth.value.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMM yyyy')
})

function shiftOverviewDay(delta: number) {
  const next = format(addDays(new Date(overviewDay.value + 'T00:00:00'), delta), 'yyyy-MM-dd')
  if (next > format(new Date(), 'yyyy-MM-dd')) return
  overviewDay.value = next
}

function shiftOverviewMonth(delta: number) {
  const [y, m] = overviewMonth.value.split('-').map(Number)
  const next = format(addMonths(new Date(y, m - 1, 1), delta), 'yyyy-MM')
  if (next > currentMonth) return
  overviewMonth.value = next
}

function shiftOverviewYear(delta: number) {
  const next = overviewYear.value + delta
  if (next > currentYear || next < 2020) return
  overviewYear.value = next
}

// ── Drill-down state ─────────────────────────────────────────────────────────

type DrillType = 'today-entries' | 'month-entries'
const drillOpen = ref(false)
const drillTitle = ref('')
const drillType = ref<DrillType>('today-entries')
const drillLoading = ref(false)
const drillEntries = ref<DailyEntry[]>([])
const drillMonthEntries = ref<TimeEntry[]>([])

function openTodayDrill(projectId: string, projectName: string) {
  drillTitle.value = `${projectName} — Hoje`
  drillType.value = 'today-entries'
  drillEntries.value = (dailyReport.value?.entries ?? []).filter(
    (e) => e.project?.id === projectId,
  )
  drillOpen.value = true
}

async function openMonthDrill(
  projectId: string,
  projectName: string,
  period: string,
  granularity: 'day' | 'month' = 'month',
) {
  const label = granularity === 'day'
    ? format(new Date(period + 'T00:00:00'), 'dd/MM/yyyy')
    : period
  drillTitle.value = `${projectName} — ${label}`
  drillType.value = 'month-entries'
  drillMonthEntries.value = []
  drillLoading.value = true
  drillOpen.value = true
  try {
    const params: Record<string, string> = { projectId, limit: '300' }
    if (granularity === 'day') params.date = period
    else params.month = period
    const res = await timeEntriesService.list(params)
    const body = (res.data as { data: { data: TimeEntry[] } }).data
    drillMonthEntries.value = body.data
  } catch {
    // non-critical
  } finally {
    drillLoading.value = false
  }
}

function onTodayChartClick(index: number) {
  const project = dailyReport.value?.byProject[index]
  if (!project) return
  openTodayDrill(project.projectId, project.projectName)
}

async function onMonthChartClick(index: number) {
  const project = monthReport.value?.byProject[index]
  if (!project) return
  await openMonthDrill(project.projectId, project.projectName, reportMonth.value)
}

async function onOverviewDayClick(row: ProjectOverviewRow) {
  if (row.daySeconds === 0) return
  // If the selected day is today and data is already loaded, filter locally
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  if (overviewDay.value === todayStr) {
    openTodayDrill(row.projectId, row.name)
  } else {
    // Fetch daily report for the selected day
    await openMonthDrill(row.projectId, row.name, overviewDay.value, 'day')
  }
}

async function onOverviewMonthClick(row: ProjectOverviewRow) {
  if (row.monthSeconds === 0) return
  await openMonthDrill(row.projectId, row.name, overviewMonth.value)
}

// ── Today helpers ────────────────────────────────────────────────────────────

const todayLabel = format(new Date(), 'dd/MM/yyyy')
const todayIso   = format(new Date(), 'yyyy-MM-dd')

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

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'HH:mm')
}

function formatDayShort(iso: string) {
  return format(new Date(iso.slice(0, 10) + 'T00:00:00'), 'dd/MM')
}

function pct(part: number, total: number): string {
  if (!total) return '0%'
  return Math.round((part / total) * 100) + '%'
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
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
watch(overviewDay,   loadOverviewDay)
watch(overviewMonth, loadOverviewMonth)
watch(overviewYear,  loadOverviewYear)

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([load(), loadMonthReport(), loadProjectOverview()])
  refreshInterval = setInterval(load, 60_000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (timerInterval) clearInterval(timerInterval)
})
</script>
