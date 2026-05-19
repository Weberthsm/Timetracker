<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-900">Lançamentos</h1>
      <BaseButton data-testid="add-entry-btn" @click="openCreate">+ Adicionar</BaseButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <!-- Mode toggle -->
      <div class="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
        <button
          :class="filterMode === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          class="px-4 py-2 font-medium transition-colors"
          @click="setMode('day')"
        >Dia</button>
        <button
          :class="filterMode === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          class="px-4 py-2 font-medium transition-colors"
          @click="setMode('month')"
        >Mês</button>
      </div>

      <!-- Day navigation -->
      <div v-if="filterMode === 'day'" class="flex items-center gap-1">
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none"
          title="Dia anterior"
          @click="shiftDay(-1)"
        >‹</button>
        <input
          v-model="filterDate"
          type="date"
          :max="today"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none disabled:opacity-30"
          :disabled="filterDate >= today"
          title="Próximo dia"
          @click="shiftDay(1)"
        >›</button>
      </div>

      <!-- Month navigation -->
      <div v-else class="flex items-center gap-1">
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none"
          title="Mês anterior"
          @click="shiftMonth(-1)"
        >‹</button>
        <input
          v-model="filterMonth"
          type="month"
          :max="currentMonth"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          class="p-1.5 rounded hover:bg-gray-100 text-gray-500 text-xl leading-none disabled:opacity-30"
          :disabled="filterMonth >= currentMonth"
          title="Próximo mês"
          @click="shiftMonth(1)"
        >›</button>
      </div>

      <!-- Project filter -->
      <select
        v-model="filterProjectId"
        class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todos os projetos</option>
        <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>

      <!-- Period total -->
      <span v-if="periodTotal > 0" class="ml-auto text-sm text-gray-600">
        Total: <strong class="text-gray-900">{{ formatDuration(periodTotal) }}</strong>
      </span>
    </div>

    <!-- Active timer entry -->
    <div v-if="activeTimer" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-blue-900">Timer ativo</p>
        <p class="text-xs text-blue-700">{{ activeTimer.project?.name ?? '—' }} · {{ activeTimer.task?.title ?? activeTimer.description ?? '—' }}</p>
      </div>
      <span class="font-mono text-blue-900 font-semibold">{{ elapsedFormatted }}</span>
    </div>

    <div v-if="loading" class="text-sm text-gray-400">Carregando...</div>
    <div v-else-if="!filtered.length" class="text-center py-16 text-sm text-gray-400">Nenhum lançamento encontrado</div>

    <!-- Grouped by date -->
    <div v-else class="space-y-6" data-testid="time-entries-list">
      <div v-for="(group, date) in grouped" :key="date">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-gray-600">{{ formatGroupDate(date as string) }}</h2>
          <span class="text-xs text-gray-500">Total: {{ formatDuration(groupTotal(group)) }}</span>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div v-for="entry in group" :key="entry.id" class="flex items-center gap-3 p-3">
            <div
              class="w-2 h-full rounded-full flex-shrink-0 self-stretch min-h-8"
              :style="{ backgroundColor: entry.project?.color ?? '#9CA3AF' }"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ entry.task?.title ?? entry.description ?? '—' }}</p>
              <p class="text-xs text-gray-500">
                {{ entry.project?.name ?? '—' }}
                <template v-if="entry.durationOnly">
                  · <span class="italic text-gray-400">sem horário</span>
                </template>
                <template v-else>
                  · {{ entry.startedAt ? formatTime(entry.startedAt) : '—' }}–{{ entry.endedAt ? formatTime(entry.endedAt) : '...' }}
                </template>
              </p>
            </div>
            <span class="text-sm font-mono text-gray-600 flex-shrink-0">{{ formatDuration(entry.duration ?? 0) }}</span>
            <div class="flex gap-1">
              <button class="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Editar" @click="openEdit(entry)">✏</button>
              <button class="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Excluir" @click="confirmDelete(entry)">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination (day mode only) -->
    <div v-if="filterMode === 'day' && totalPages > 1" class="mt-4">
      <BasePagination :current-page="currentPage" :total-pages="totalPages" @page-change="onPageChange" />
    </div>

    <TimeEntryFormModal :open="showForm" :entry="editingEntry" @close="showForm = false" @saved="onSaved" />
    <ConfirmDialog
      :open="showDelete"
      title="Excluir Lançamento"
      message="Deseja excluir este lançamento?"
      @confirm="deleteEntry"
      @cancel="showDelete = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { format, addDays, addMonths } from 'date-fns'
import { timeEntriesService, type TimeEntry } from '@/services/time-entries.service'
import { useTimeEntriesStore } from '@/stores/timeEntries'
import { useProjectsStore } from '@/stores/projects'
import { useTimer } from '@/composables/useTimer'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import TimeEntryFormModal from '@/components/time-entries/TimeEntryFormModal.vue'
import BasePagination from '@/components/ui/BasePagination.vue'

const timerStore = useTimeEntriesStore()
const projectsStore = useProjectsStore()
const { elapsedFormatted } = useTimer()

const loading = ref(false)
const entries = ref<TimeEntry[]>([])
const showForm = ref(false)
const showDelete = ref(false)
const editingEntry = ref<TimeEntry | null>(null)
const deletingEntry = ref<TimeEntry | null>(null)

const today = format(new Date(), 'yyyy-MM-dd')
const currentMonth = format(new Date(), 'yyyy-MM')

const filterMode = ref<'day' | 'month'>('month')
const filterDate = ref(today)
const filterMonth = ref(currentMonth)
const filterProjectId = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

const activeTimer = computed(() => timerStore.activeTimer)

const filtered = computed(() =>
  entries.value.filter((e) => !filterProjectId.value || e.projectId === filterProjectId.value),
)

const grouped = computed(() => {
  const g: Record<string, TimeEntry[]> = {}
  // Sort descending; durationOnly entries (no startedAt) fall at the end of the day
  const sorted = [...filtered.value].sort((a, b) => {
    const aKey = a.startedAt ?? (a.date + 'T99:99')
    const bKey = b.startedAt ?? (b.date + 'T99:99')
    return bKey.localeCompare(aKey)
  })
  for (const e of sorted) {
    const d = (e.startedAt ?? e.date ?? '').slice(0, 10)
    if (!d) continue
    if (!g[d]) g[d] = []
    g[d].push(e)
  }
  return g
})

const periodTotal = computed(() => filtered.value.reduce((s, e) => s + (e.duration ?? 0), 0))

function groupTotal(group: TimeEntry[]) {
  return group.reduce((s, e) => s + (e.duration ?? 0), 0)
}

function formatTime(iso: string | null) { return iso ? format(new Date(iso), 'HH:mm') : '—' }

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatGroupDate(date: string) {
  return format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')
}

function setMode(mode: 'day' | 'month') {
  filterMode.value = mode
  currentPage.value = 1
  load()
}

function shiftDay(delta: number) {
  const next = format(addDays(new Date(filterDate.value + 'T00:00:00'), delta), 'yyyy-MM-dd')
  if (next > today) return
  filterDate.value = next
}

function shiftMonth(delta: number) {
  const [y, m] = filterMonth.value.split('-').map(Number)
  const next = format(addMonths(new Date(y, m - 1, 1), delta), 'yyyy-MM')
  if (next > currentMonth) return
  filterMonth.value = next
}

function openCreate() { editingEntry.value = null; showForm.value = true }
function openEdit(entry: TimeEntry) { editingEntry.value = entry; showForm.value = true }
function confirmDelete(entry: TimeEntry) { deletingEntry.value = entry; showDelete.value = true }

async function deleteEntry() {
  if (!deletingEntry.value) return
  await timeEntriesService.delete(deletingEntry.value.id)
  entries.value = entries.value.filter((e) => e.id !== deletingEntry.value!.id)
  showDelete.value = false
}

async function onSaved() {
  showForm.value = false
  await load()
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, string> = { page: String(currentPage.value) }
    if (filterMode.value === 'day') {
      params.limit = '20'
      params.date = filterDate.value
    } else {
      // Load up to 300 entries for the whole month; pagination hidden in month mode
      params.limit = '300'
      params.month = filterMonth.value
    }
    const res = await timeEntriesService.list(params)
    const body = (res.data as { data: { data: TimeEntry[]; meta: { totalPages: number } } }).data
    entries.value = body.data
    totalPages.value = filterMode.value === 'day' ? (body.meta?.totalPages ?? 1) : 1
  } finally {
    loading.value = false
  }
}

function onPageChange(page: number) {
  currentPage.value = page
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(filterDate, () => { if (filterMode.value === 'day') { currentPage.value = 1; load() } })
watch(filterMonth, () => { if (filterMode.value === 'month') { currentPage.value = 1; load() } })

onMounted(async () => {
  await Promise.all([load(), projectsStore.fetchAll(), timerStore.fetchActiveTimer()])
})
</script>
