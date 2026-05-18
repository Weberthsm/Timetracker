<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Alocação por Projeto</h1>

    <!-- ── Period bar ───────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <!-- Granularity toggle -->
      <div class="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
        <button
          v-for="g in granularities"
          :key="g.value"
          :class="granularity === g.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          class="px-4 py-2 font-medium transition-colors"
          @click="setGranularity(g.value)"
        >{{ g.label }}</button>
      </div>

      <!-- Day picker -->
      <div v-if="granularity === 'day'" class="flex items-center gap-1">
        <button class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none" @click="shiftDay(-1)">‹</button>
        <input
          v-model="dayValue"
          type="date"
          :max="todayStr"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none disabled:opacity-30"
          :disabled="dayValue >= todayStr"
          @click="shiftDay(1)"
        >›</button>
      </div>

      <!-- Month picker -->
      <div v-else-if="granularity === 'month'" class="flex items-center gap-1">
        <button class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none" @click="shiftMonth(-1)">‹</button>
        <input
          v-model="monthValue"
          type="month"
          :max="currentMonthStr"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none disabled:opacity-30"
          :disabled="monthValue >= currentMonthStr"
          @click="shiftMonth(1)"
        >›</button>
      </div>

      <!-- Year picker -->
      <div v-else class="flex items-center gap-1">
        <button class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none" @click="shiftYear(-1)">‹</button>
        <div class="border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-800 min-w-20 text-center">
          {{ yearValue }}
        </div>
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none disabled:opacity-30"
          :disabled="yearValue >= currentYear"
          @click="shiftYear(1)"
        >›</button>
      </div>

      <!-- Period label -->
      <span class="text-sm text-gray-500 italic">{{ periodLabel }}</span>
    </div>

    <!-- ── Section tabs ──────────────────────────────────────────────────── -->
    <div class="flex border-b border-gray-200 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="activeTab === tab.value
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
        class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        @click="activeTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <!-- ── Loading ───────────────────────────────────────────────────────── -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-14 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- ── Empty ─────────────────────────────────────────────────────────── -->
    <div v-else-if="activeRows.length === 0" class="text-center py-20 text-sm text-gray-400">
      Nenhum lançamento encontrado neste período
    </div>

    <!-- ── Table ─────────────────────────────────────────────────────────── -->
    <div v-else class="space-y-2">
      <div
        v-for="row in activeRows"
        :key="row.id"
        class="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <!-- Entity header row -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          @click="toggle(row.id)"
        >
          <!-- Expand icon -->
          <span class="text-gray-400 text-xs w-3 flex-shrink-0">{{ expanded.has(row.id) ? '▼' : '▶' }}</span>

          <!-- Avatar / icon -->
          <div class="flex-shrink-0">
            <div v-if="activeTab === 'members' && row.avatarUrl"
              class="w-7 h-7 rounded-full bg-cover bg-center overflow-hidden"
              :style="{ backgroundImage: `url(${row.avatarUrl})` }"
            />
            <div v-else-if="activeTab === 'members'"
              class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
            >{{ row.label.charAt(0).toUpperCase() }}</div>
            <div v-else class="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {{ row.label.charAt(0).toUpperCase() }}
            </div>
          </div>

          <!-- Name + team badge -->
          <div class="flex-1 min-w-0">
            <span class="font-medium text-gray-900 text-sm">{{ row.label }}</span>
            <span v-if="row.sublabel" class="ml-2 text-xs text-gray-400">{{ row.sublabel }}</span>
          </div>

          <!-- Stacked mini-bar -->
          <div class="flex h-2 rounded-full overflow-hidden w-32 bg-gray-100 flex-shrink-0">
            <div
              v-for="p in row.byProject"
              :key="p.projectId"
              :style="{ width: `${p.percentage}%`, backgroundColor: resolveColor(p.projectId, p.color) }"
              :title="`${p.projectName}: ${p.totalFormatted} (${p.percentage}%)`"
            />
          </div>

          <!-- Total -->
          <span class="font-mono text-sm font-semibold text-gray-700 flex-shrink-0 w-20 text-right">
            {{ row.totalFormatted }}
          </span>
        </button>

        <!-- Expanded project rows -->
        <div v-if="expanded.has(row.id)" class="border-t border-gray-100 divide-y divide-gray-50">
          <div
            v-for="p in row.byProject"
            :key="p.projectId"
            class="flex items-center gap-3 px-4 py-2.5 bg-gray-50"
          >
            <!-- Color dot -->
            <div
              class="w-2.5 h-2.5 rounded-full flex-shrink-0 ml-6"
              :style="{ backgroundColor: resolveColor(p.projectId, p.color) }"
            />
            <!-- Project name -->
            <span class="flex-1 text-sm text-gray-700 truncate">{{ p.projectName }}</span>
            <!-- Progress bar -->
            <div class="w-32 bg-gray-200 rounded-full h-1.5 flex-shrink-0">
              <div
                class="h-1.5 rounded-full transition-all"
                :style="{ width: `${p.percentage}%`, backgroundColor: resolveColor(p.projectId, p.color) }"
              />
            </div>
            <!-- Hours -->
            <span class="font-mono text-sm text-gray-600 flex-shrink-0 w-20 text-right">{{ p.totalFormatted }}</span>
            <!-- Percentage -->
            <span class="text-xs text-gray-500 flex-shrink-0 w-12 text-right font-medium">{{ p.percentage }}%</span>
          </div>
          <!-- No projects -->
          <div v-if="!row.byProject.length" class="px-12 py-2.5 text-xs text-gray-400 bg-gray-50">
            Nenhum lançamento neste período
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { format, addDays, addMonths } from 'date-fns'
import { reportsService } from '@/services/reports.service'

// ── Types ─────────────────────────────────────────────────────────────────

interface ProjectSlice {
  projectId: string
  projectName: string
  color: string | null
  totalSeconds: number
  percentage: number
  totalFormatted: string
}

interface MemberInfo {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  teamId: string | null
  teamName: string | null
}

interface TeamRow {
  teamId: string
  teamName: string
  totalSeconds: number
  totalFormatted: string
  byProject: ProjectSlice[]
}

interface MemberRow {
  member: MemberInfo
  totalSeconds: number
  totalFormatted: string
  byProject: ProjectSlice[]
}

interface AllocationReport {
  granularity: string
  value: string
  teams: TeamRow[]
  members: MemberRow[]
}

// ── Period state ───────────────────────────────────────────────────────────

const todayStr = format(new Date(), 'yyyy-MM-dd')
const currentMonthStr = format(new Date(), 'yyyy-MM')
const currentYear = new Date().getFullYear()

const granularity = ref<'day' | 'month' | 'year'>('month')
const dayValue = ref(todayStr)
const monthValue = ref(currentMonthStr)
const yearValue = ref(currentYear)

const granularities = [
  { value: 'day' as const, label: 'Dia' },
  { value: 'month' as const, label: 'Mês' },
  { value: 'year' as const, label: 'Ano' },
]

const periodValue = computed(() => {
  if (granularity.value === 'day') return dayValue.value
  if (granularity.value === 'month') return monthValue.value
  return String(yearValue.value)
})

const periodLabel = computed(() => {
  if (granularity.value === 'day') return format(new Date(dayValue.value + 'T00:00:00'), 'dd/MM/yyyy')
  if (granularity.value === 'month') {
    const [y, m] = monthValue.value.split('-').map(Number)
    return format(new Date(y, m - 1, 1), 'MMMM yyyy').replace(/^\w/, (c) => c.toUpperCase())
  }
  return `Ano ${yearValue.value}`
})

function setGranularity(g: 'day' | 'month' | 'year') {
  granularity.value = g
  load()
}

function shiftDay(delta: number) {
  const next = format(addDays(new Date(dayValue.value + 'T00:00:00'), delta), 'yyyy-MM-dd')
  if (next > todayStr) return
  dayValue.value = next
}

function shiftMonth(delta: number) {
  const [y, m] = monthValue.value.split('-').map(Number)
  const next = format(addMonths(new Date(y, m - 1, 1), delta), 'yyyy-MM')
  if (next > currentMonthStr) return
  monthValue.value = next
}

function shiftYear(delta: number) {
  const next = yearValue.value + delta
  if (next > currentYear) return
  yearValue.value = next
}

// ── Section tabs ───────────────────────────────────────────────────────────

const tabs = [
  { value: 'teams' as const, label: 'Por Equipe' },
  { value: 'members' as const, label: 'Por Colaborador' },
]
const activeTab = ref<'teams' | 'members'>('members')

// ── Expanded rows ──────────────────────────────────────────────────────────

const expanded = ref(new Set<string>())

function toggle(id: string) {
  const s = new Set(expanded.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expanded.value = s
}

// ── Color palette ──────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
]

// Build a consistent color index per project across the whole report
const colorIndex = computed(() => {
  const ids = new Set<string>()
  for (const t of report.value?.teams ?? []) for (const p of t.byProject) ids.add(p.projectId)
  for (const m of report.value?.members ?? []) for (const p of m.byProject) ids.add(p.projectId)
  const idx = new Map<string, number>()
  let i = 0
  for (const id of ids) idx.set(id, i++)
  return idx
})

function resolveColor(projectId: string, backendColor: string | null): string {
  if (backendColor) return backendColor
  const idx = colorIndex.value.get(projectId) ?? 0
  return PROJECT_COLORS[idx % PROJECT_COLORS.length]
}

// ── Data ───────────────────────────────────────────────────────────────────

const loading = ref(false)
const report = ref<AllocationReport | null>(null)

/** Normalise both team and member rows to a unified shape for the template */
interface DisplayRow {
  id: string
  label: string
  sublabel?: string
  avatarUrl?: string | null
  totalSeconds: number
  totalFormatted: string
  byProject: ProjectSlice[]
}

const activeRows = computed<DisplayRow[]>(() => {
  if (!report.value) return []
  if (activeTab.value === 'teams') {
    return report.value.teams.map((t) => ({
      id: t.teamId,
      label: t.teamName,
      totalSeconds: t.totalSeconds,
      totalFormatted: t.totalFormatted,
      byProject: t.byProject,
    }))
  }
  return report.value.members.map((m) => ({
    id: m.member.id,
    label: m.member.name,
    sublabel: m.member.teamName ?? undefined,
    avatarUrl: m.member.avatarUrl,
    totalSeconds: m.totalSeconds,
    totalFormatted: m.totalFormatted,
    byProject: m.byProject,
  }))
})

async function load() {
  loading.value = true
  expanded.value = new Set()
  try {
    const res = await reportsService.allocation({
      granularity: granularity.value,
      value: periodValue.value,
    })
    report.value = (res.data as { data: AllocationReport }).data
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}

watch(dayValue, () => { if (granularity.value === 'day') load() })
watch(monthValue, () => { if (granularity.value === 'month') load() })
watch(yearValue, () => { if (granularity.value === 'year') load() })

onMounted(load)
</script>
