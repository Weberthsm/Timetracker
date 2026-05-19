<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Relatório Diário</h1>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6">
      <!-- Day navigation -->
      <div class="flex items-center gap-1">
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none"
          title="Dia anterior"
          @click="shiftDay(-1)"
        >‹</button>
        <input
          v-model="selectedDate"
          type="date"
          :max="today"
          data-testid="date-picker"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none disabled:opacity-30"
          :disabled="selectedDate >= today"
          title="Próximo dia"
          @click="shiftDay(1)"
        >›</button>
      </div>

      <!-- User selector (admin/manager only) -->
      <select
        v-if="canSeeOthers"
        v-model="selectedUserId"
        data-testid="user-selector"
        class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Meu relatório</option>
        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div class="h-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div class="h-64 bg-gray-200 rounded-xl animate-pulse" />
      <div class="h-40 bg-gray-200 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <!-- Empty state -->
      <div v-if="!entries.length" data-testid="empty-state" class="text-center py-20 text-sm text-gray-400">
        Nenhuma atividade registrada neste dia
      </div>

      <template v-else>
        <!-- Totals -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 mb-1">Total de horas</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatDuration(totalSeconds) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 mb-1">Atividades</p>
            <p class="text-2xl font-bold text-gray-900">{{ entries.length }}</p>
          </div>
        </div>

        <!-- Chart + legend -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div data-testid="daily-chart" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center">
            <DoughnutChart :items="chartItems" @segment-click="onChartClick" />
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Por projeto</h3>
            <div class="space-y-2">
              <div
                v-for="item in byProject"
                :key="item.projectId"
                class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1 py-0.5 transition-colors"
                @click="openProjectDrill(item)"
              >
                <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: item.color }" />
                <span class="flex-1 text-sm text-gray-700 truncate">{{ item.name }}</span>
                <span class="text-xs text-gray-500">{{ formatDuration(item.seconds) }}</span>
                <span class="text-xs text-gray-400 w-10 text-right">{{ item.percent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity table -->
        <div data-testid="daily-entries-table" class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-xs text-gray-500">
                <th class="text-left px-4 py-3 font-medium">Projeto</th>
                <th class="text-left px-4 py-3 font-medium">Tarefa</th>
                <th class="text-left px-4 py-3 font-medium">Descrição</th>
                <th class="text-left px-4 py-3 font-medium">Início</th>
                <th class="text-left px-4 py-3 font-medium">Fim</th>
                <th class="text-right px-4 py-3 font-medium">Duração</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="e in entries" :key="e.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: e.project?.color ?? '#9CA3AF' }" />
                    <span class="truncate max-w-28">{{ e.project?.name ?? '—' }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-600 truncate max-w-32">{{ e.task?.title ?? '—' }}</td>
                <td class="px-4 py-3 text-gray-500 truncate max-w-40">{{ e.description ?? '—' }}</td>
                <td class="px-4 py-3 text-gray-600 font-mono">{{ e.startedAt ? formatTime(e.startedAt) : '—' }}</td>
                <td class="px-4 py-3 text-gray-600 font-mono">{{ e.endedAt ? formatTime(e.endedAt) : (e.startedAt ? '...' : '—') }}</td>
                <td class="px-4 py-3 text-right font-mono text-gray-700">{{ formatDuration(e.duration ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- Drill-down modal: entries for a clicked project -->
    <BaseModal :open="drillOpen" :title="drillTitle" size="lg" @close="drillOpen = false">
      <div v-if="!drillEntries.length" class="text-center py-8 text-sm text-gray-400">
        Nenhum lançamento encontrado
      </div>
      <template v-else>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-xs text-gray-500">
              <th class="text-left pb-2 font-medium">Tarefa / Descrição</th>
              <th class="text-left pb-2 font-medium">Início</th>
              <th class="text-left pb-2 font-medium">Fim</th>
              <th class="text-right pb-2 font-medium">Duração</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="e in drillEntries" :key="e.id" class="hover:bg-gray-50">
              <td class="py-2.5 pr-4 font-medium text-gray-800">{{ e.task?.title ?? e.description ?? '—' }}</td>
              <td class="py-2.5 pr-4 font-mono text-gray-600">{{ e.startedAt ? formatTime(e.startedAt) : '—' }}</td>
              <td class="py-2.5 pr-4 font-mono text-gray-600">{{ e.endedAt ? formatTime(e.endedAt) : (e.startedAt ? '...' : '—') }}</td>
              <td class="py-2.5 text-right font-mono text-gray-700">{{ formatDuration(e.duration ?? 0) }}</td>
            </tr>
          </tbody>
        </table>
        <p class="text-xs text-gray-400 text-right mt-3 pt-2 border-t border-gray-100">
          Total: <strong class="text-gray-700">{{ formatDuration(drillEntries.reduce((s, e) => s + (e.duration ?? 0), 0)) }}</strong>
          · {{ drillEntries.length }} lançamento(s)
        </p>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { format, addDays } from 'date-fns'
import { reportsService } from '@/services/reports.service'
import { usersService, type UserOption } from '@/services/users.service'
import { useAuthStore } from '@/stores/auth'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

interface Project { id: string; name: string; color: string }
interface Task { id: string; title: string }
interface Entry {
  id: string
  projectId: string
  project?: Project
  task?: Task
  description?: string | null
  startedAt: string | null
  endedAt?: string | null
  duration?: number | null
  durationOnly?: boolean
}

const authStore = useAuthStore()
const loading = ref(false)
const today = format(new Date(), 'yyyy-MM-dd')
const selectedDate = ref(today)
// Empty string = "Meu relatório"; non-empty = a specific user chosen by admin/manager
const selectedUserId = ref('')
const entries = ref<Entry[]>([])
const users = ref<UserOption[]>([])

const canSeeOthers = computed(() => {
  const role = authStore.user?.role
  return role === 'admin' || role === 'manager'
})

/** The user whose report is being viewed */
const targetUserId = computed(() =>
  selectedUserId.value || authStore.user?.id || '',
)

const totalSeconds = computed(() => entries.value.reduce((s, e) => s + (e.duration ?? 0), 0))

const PROJECT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

const byProject = computed(() => {
  const map: Record<string, { projectId: string; name: string; color: string; seconds: number }> = {}
  for (const e of entries.value) {
    const id = e.projectId
    if (!map[id]) {
      map[id] = {
        projectId: id,
        name: e.project?.name ?? '—',
        color: e.project?.color ?? PROJECT_COLORS[Object.keys(map).length % PROJECT_COLORS.length],
        seconds: 0,
      }
    }
    map[id].seconds += e.duration ?? 0
  }
  return Object.values(map).map((item) => ({
    ...item,
    percent: totalSeconds.value > 0 ? Math.round((item.seconds / totalSeconds.value) * 100) : 0,
  }))
})

const chartItems = computed(() =>
  byProject.value.map((p) => ({ label: p.name, percentage: p.percent, duration: p.seconds })),
)

// ── Drill-down ──────────────────────────────────────────────────────────────

const drillOpen = ref(false)
const drillTitle = ref('')
const drillEntries = ref<Entry[]>([])

function openProjectDrill(project: { projectId: string; name: string }) {
  drillTitle.value = project.name
  drillEntries.value = entries.value.filter((e) => e.projectId === project.projectId)
  drillOpen.value = true
}

function onChartClick(index: number) {
  const project = byProject.value[index]
  if (!project) return
  openProjectDrill(project)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function shiftDay(delta: number) {
  const next = format(addDays(new Date(selectedDate.value + 'T00:00:00'), delta), 'yyyy-MM-dd')
  if (next > today) return
  selectedDate.value = next
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'HH:mm')
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

async function loadReport() {
  if (!targetUserId.value) return
  loading.value = true
  try {
    const res = await reportsService.daily({ date: selectedDate.value, userId: targetUserId.value })
    const data = (res.data as { data: { entries: Entry[] } }).data
    entries.value = (data.entries ?? []).sort((a, b) => {
      if (!a.startedAt) return 1
      if (!b.startedAt) return -1
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    })
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  if (!canSeeOthers.value) return
  try {
    const res = await usersService.list({ limit: 100 })
    const body = (res.data as { data: { data: UserOption[] } }).data
    // Exclude current user (already shown as "Meu relatório")
    users.value = body.data.filter((u) => u.id !== authStore.user?.id)
  } catch {
    // non-critical – dropdown simply stays empty
  }
}

watch([selectedDate, selectedUserId], loadReport)

onMounted(async () => {
  await Promise.all([loadReport(), loadUsers()])
})
</script>
