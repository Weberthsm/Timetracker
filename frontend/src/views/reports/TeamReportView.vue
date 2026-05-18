<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Relatório de Equipe</h1>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Equipe</label>
        <select
          v-model="selectedTeamId"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-44"
        >
          <option value="">Selecione uma equipe...</option>
          <option v-for="t in teamsStore.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Mês</label>
        <input
          v-model="selectedMonth"
          type="month"
          :max="currentMonth"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <BaseButton :disabled="!selectedTeamId" :loading="loading" @click="loadReport">Gerar relatório</BaseButton>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="h-20 bg-gray-200 rounded-xl animate-pulse" />
        <div class="h-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div class="h-56 bg-gray-200 rounded-xl animate-pulse" />
      <div class="h-48 bg-gray-200 rounded-xl animate-pulse" />
    </div>

    <template v-else-if="report">
      <!-- Empty -->
      <div v-if="!memberRows.length" class="text-center py-20 text-sm text-gray-400">
        Nenhum dado encontrado para este período
      </div>

      <template v-else>
        <!-- Imbalance cards -->
        <div v-if="topMember && bottomMember" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 mb-1">Maior contribuidor</p>
            <p class="text-lg font-bold text-gray-900">{{ topMember.name }}</p>
            <p class="text-sm text-green-600 font-medium">{{ formatDuration(topMember.totalSeconds) }}</p>
          </div>
          <div
            class="bg-white rounded-xl border p-4"
            :class="imbalancePct > 50 ? 'border-orange-300 bg-orange-50' : 'border-gray-200'"
          >
            <p class="text-xs text-gray-500 mb-1">Menor contribuidor</p>
            <p class="text-lg font-bold text-gray-900">{{ bottomMember.name }}</p>
            <p class="text-sm font-medium" :class="imbalancePct > 50 ? 'text-orange-600' : 'text-gray-500'">
              {{ formatDuration(bottomMember.totalSeconds) }}
              <span v-if="imbalancePct > 50" class="ml-1">⚠ +{{ imbalancePct }}% de diferença</span>
            </p>
          </div>
        </div>

        <!-- Stacked bar chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Horas por membro</h3>
          <StackedBarChart :labels="chartLabels" :datasets="chartDatasets" />
        </div>

        <!-- Member table -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-xs text-gray-500">
                <th class="text-left px-4 py-3 font-medium">Membro</th>
                <th class="text-right px-4 py-3 font-medium">Total</th>
                <th class="text-left px-4 py-3 font-medium">Distribuição</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="m in memberRows" :key="m.userId">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {{ m.name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="font-medium text-gray-900">{{ m.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-mono text-gray-700">{{ formatDuration(m.totalSeconds) }}</td>
                <td class="px-4 py-3">
                  <div class="flex h-3 rounded-full overflow-hidden w-full max-w-40 bg-gray-100">
                    <div
                      v-for="(p, i) in m.byProject"
                      :key="i"
                      :style="{ width: `${p.percent}%`, backgroundColor: p.color }"
                      :title="`${p.name}: ${formatDuration(p.seconds)}`"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Copy CSV -->
        <div class="flex justify-end">
          <button class="text-xs text-gray-500 hover:text-gray-700 underline transition-colors" @click="copyCSV">
            Copiar tabela (CSV)
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { reportsService } from '@/services/reports.service'
import { useTeamsStore } from '@/stores/teams'
import BaseButton from '@/components/ui/BaseButton.vue'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'

interface MemberInfo { id: string; name: string; email: string; avatarUrl: string | null }
interface ProjectSlice { projectId: string; projectName: string; totalSeconds: number }
interface MemberReport { member: MemberInfo; totalSeconds: number; totalFormatted: string; byProject: ProjectSlice[] }
interface TeamReport { members: MemberReport[] }

const teamsStore = useTeamsStore()
const loading = ref(false)
const currentMonth = format(new Date(), 'yyyy-MM')
const selectedTeamId = ref('')
const selectedMonth = ref(currentMonth)
const report = ref<TeamReport | null>(null)

const PROJECT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

const memberRows = computed(() =>
  (report.value?.members ?? [])
    .map((m) => {
      const total = m.totalSeconds
      const byProject = m.byProject.map((p, i) => ({
        projectId: p.projectId,
        name: p.projectName,
        color: PROJECT_COLORS[i % PROJECT_COLORS.length],
        seconds: p.totalSeconds,
        percent: total > 0 ? Math.round((p.totalSeconds / total) * 100) : 0,
      }))
      return {
        userId: m.member.id,
        name: m.member.name,
        totalSeconds: m.totalSeconds,
        byProject,
      }
    })
    .sort((a, b) => b.totalSeconds - a.totalSeconds),
)

const topMember = computed(() => memberRows.value[0])
const bottomMember = computed(() => memberRows.value[memberRows.value.length - 1])
const imbalancePct = computed(() => {
  if (!topMember.value || !bottomMember.value || bottomMember.value.totalSeconds === 0) return 0
  return Math.round(((topMember.value.totalSeconds - bottomMember.value.totalSeconds) / bottomMember.value.totalSeconds) * 100)
})

const chartLabels = computed(() => memberRows.value.map((m) => m.name))

const chartDatasets = computed(() => {
  const projectMap: Record<string, { name: string; color: string; dataByMember: Record<string, number> }> = {}
  for (const m of memberRows.value) {
    for (const p of m.byProject) {
      if (!projectMap[p.projectId]) {
        projectMap[p.projectId] = { name: p.name, color: p.color, dataByMember: {} }
      }
      projectMap[p.projectId].dataByMember[m.userId] = p.seconds
    }
  }
  return Object.entries(projectMap).map(([, proj]) => ({
    label: proj.name,
    backgroundColor: proj.color,
    data: memberRows.value.map((m) => proj.dataByMember[m.userId] ?? 0),
  }))
})

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function copyCSV() {
  const header = 'Membro,Total'
  const rows = memberRows.value.map((m) => `${m.name},${formatDuration(m.totalSeconds)}`)
  navigator.clipboard.writeText([header, ...rows].join('\n'))
}

async function loadReport() {
  if (!selectedTeamId.value) return
  loading.value = true
  try {
    const res = await reportsService.team({ teamId: selectedTeamId.value, month: selectedMonth.value })
    report.value = (res.data as { data: TeamReport }).data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await teamsStore.fetchAll()
})
</script>
