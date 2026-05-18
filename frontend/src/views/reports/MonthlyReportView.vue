<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Relatório Mensal</h1>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <div class="flex items-center gap-1">
        <button
          data-testid="prev-month-btn"
          class="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          @click="prevMonth"
        >‹</button>
        <input
          v-model="selectedMonth"
          type="month"
          :max="currentMonth"
          data-testid="month-label"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          :disabled="selectedMonth >= currentMonth"
          data-testid="next-month-btn"
          class="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          @click="nextMonth"
        >›</button>
      </div>

      <!-- User selector (admin/manager only) -->
      <select
        v-if="canSeeOthers"
        v-model="selectedUserId"
        class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Meu relatório</option>
        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="h-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div class="h-56 bg-gray-200 rounded-xl animate-pulse" />
      <div class="h-40 bg-gray-200 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <!-- Empty -->
      <div v-if="!hasData" class="text-center py-20 text-sm text-gray-400">
        Nenhuma atividade registrada neste mês
      </div>

      <template v-else>
        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 mb-1">Total de horas</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatDuration(totalSeconds) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 mb-1">Projeto principal</p>
            <p class="text-lg font-bold text-gray-900 truncate">{{ topProject?.name ?? '—' }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 mb-1">Dias com registros</p>
            <p class="text-2xl font-bold text-gray-900">{{ daysWithEntries }}</p>
          </div>
        </div>

        <!-- Bar chart: hours per day -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Horas por dia</h3>
          <BarChart :labels="barLabels" :datasets="barDatasets" />
        </div>

        <!-- Project table -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-xs text-gray-500">
                <th class="text-left px-4 py-3 font-medium">Projeto</th>
                <th class="text-right px-4 py-3 font-medium">Total</th>
                <th class="text-right px-4 py-3 font-medium w-40">% do Mês</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in projectRows" :key="p.projectId">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: p.color }" />
                    <span class="truncate max-w-48">{{ p.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-mono text-gray-700">{{ formatDuration(p.seconds) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 justify-end">
                    <div class="flex-1 bg-gray-100 rounded-full h-1.5 max-w-24">
                      <div class="bg-blue-500 h-1.5 rounded-full" :style="{ width: `${p.percent}%` }" />
                    </div>
                    <span class="text-xs text-gray-500 w-8 text-right">{{ p.percent }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Expandable daily breakdown -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            class="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showDailyTable = !showDailyTable"
          >
            <span>Distribuição diária</span>
            <span class="text-gray-400 text-xs">{{ showDailyTable ? '▲ Recolher' : '▼ Expandir' }}</span>
          </button>
          <div v-if="showDailyTable" class="overflow-x-auto border-t border-gray-100">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-100 text-gray-500">
                  <th class="text-left px-4 py-2 font-medium">Dia</th>
                  <th class="text-right px-4 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="day in daysWithData" :key="day.date">
                  <td class="px-4 py-2 font-medium text-gray-700">{{ formatDay(day.date) }}</td>
                  <td class="px-4 py-2 text-right font-mono text-gray-600">{{ formatDuration(day.totalSeconds) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { format, addMonths, parseISO, getDaysInMonth } from 'date-fns'
import { useRoute, useRouter } from 'vue-router'
import { reportsService } from '@/services/reports.service'
import { usersService, type UserOption } from '@/services/users.service'
import { useAuthStore } from '@/stores/auth'
import BarChart from '@/components/charts/BarChart.vue'

interface ByProjectItem {
  projectId: string
  projectName: string
  color: string | null
  totalSeconds: number
  percentage: number
}

interface DayEntry {
  date: string
  totalSeconds: number
}

interface MonthlyReport {
  month: string
  totalSeconds: number
  totalFormatted: string
  byProject: ByProjectItem[]
  byDay: DayEntry[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const currentMonth = format(new Date(), 'yyyy-MM')
const selectedMonth = ref((route.query.month as string) || currentMonth)
// Empty = "Meu relatório"; non-empty = chosen by admin/manager
const selectedUserId = ref('')
const report = ref<MonthlyReport | null>(null)
const users = ref<UserOption[]>([])
const showDailyTable = ref(false)

const canSeeOthers = computed(() => {
  const role = authStore.user?.role
  return role === 'admin' || role === 'manager'
})

/** The user whose report is being viewed */
const targetUserId = computed(() =>
  selectedUserId.value || authStore.user?.id || '',
)

const hasData = computed(() => (report.value?.totalSeconds ?? 0) > 0)
const totalSeconds = computed(() => report.value?.totalSeconds ?? 0)

const daysWithEntries = computed(() =>
  (report.value?.byDay ?? []).filter((d) => d.totalSeconds > 0).length,
)

const PROJECT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

const projectRows = computed(() => {
  let idx = 0
  return (report.value?.byProject ?? [])
    .map((p) => ({
      projectId: p.projectId,
      name: p.projectName,
      color: p.color || PROJECT_COLORS[idx++ % PROJECT_COLORS.length],
      seconds: p.totalSeconds,
      percent: Math.round(p.percentage),
    }))
    .sort((a, b) => b.seconds - a.seconds)
})

const topProject = computed(() => projectRows.value[0])

const daysWithData = computed(() =>
  (report.value?.byDay ?? [])
    .filter((d) => d.totalSeconds > 0)
    .sort((a, b) => a.date.localeCompare(b.date)),
)

function formatDay(date: string) {
  return format(parseISO(date), 'dd/MM')
}

const barLabels = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const days = getDaysInMonth(new Date(y, m - 1))
  return Array.from({ length: days }, (_, i) => String(i + 1))
})

const barDatasets = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const days = getDaysInMonth(new Date(y, m - 1))
  const data = Array<number>(days).fill(0)
  for (const day of report.value?.byDay ?? []) {
    const d = parseISO(day.date).getDate()
    data[d - 1] = day.totalSeconds
  }
  return [{ label: 'Horas', data, backgroundColor: '#3B82F6' }]
})

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function prevMonth() {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  selectedMonth.value = format(new Date(y, m - 2), 'yyyy-MM')
}

function nextMonth() {
  if (selectedMonth.value >= currentMonth) return
  const [y, m] = selectedMonth.value.split('-').map(Number)
  selectedMonth.value = format(addMonths(new Date(y, m - 1), 1), 'yyyy-MM')
}

async function loadReport() {
  if (!targetUserId.value) return
  loading.value = true
  try {
    const res = await reportsService.monthly({ month: selectedMonth.value, userId: targetUserId.value })
    report.value = (res.data as { data: MonthlyReport }).data
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  if (!canSeeOthers.value) return
  try {
    const res = await usersService.list({ limit: 100 })
    const body = (res.data as { data: { data: UserOption[] } }).data
    users.value = body.data.filter((u) => u.id !== authStore.user?.id)
  } catch {
    // non-critical
  }
}

watch(selectedMonth, (val) => {
  router.replace({ query: { ...route.query, month: val } })
  loadReport()
})
watch(selectedUserId, loadReport)

onMounted(async () => {
  await Promise.all([loadReport(), loadUsers()])
})
</script>
