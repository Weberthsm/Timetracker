<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div v-if="loading" class="text-sm text-gray-400">Carregando...</div>
    <template v-else-if="project">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <!-- Logo / upload area -->
          <div class="relative group flex-shrink-0">
            <img v-if="project.logoUrl" :src="project.logoUrl" class="w-14 h-14 rounded-xl object-cover" :alt="project.name" />
            <div v-else class="w-14 h-14 rounded-xl" :style="{ backgroundColor: project.color || '#3B82F6' }" />

            <!-- Overlay for admin/manager -->
            <button
              v-if="canManage"
              class="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              title="Alterar logo"
              @click="triggerLogoUpload"
            >
              <span class="text-white text-xs font-medium leading-tight text-center px-1">Alterar logo</span>
            </button>

            <!-- Remove button -->
            <button
              v-if="canManage && project.logoUrl"
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              title="Remover logo"
              @click.stop="handleRemoveLogo"
            >×</button>

            <input
              ref="logoInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleLogoChange"
            />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">{{ project.name }}</h1>
            <p v-if="project.description" class="text-sm text-gray-500 mt-0.5">{{ project.description }}</p>
            <BaseBadge :variant="project.status === 'active' ? 'success' : 'neutral'" size="sm" class="mt-1">
              {{ project.status === 'active' ? 'Ativo' : 'Arquivado' }}
            </BaseBadge>
          </div>
        </div>
        <div v-if="canManage" class="flex gap-2">
          <BaseButton variant="secondary" size="sm" @click="showEdit = true">Editar</BaseButton>
          <BaseButton v-if="project.status === 'active'" variant="danger" size="sm" @click="showArchive = true">Arquivar</BaseButton>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6 flex items-center justify-between">
        <nav class="flex gap-6">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['pb-2 text-sm border-b-2 transition-colors', activeTab === tab ? 'border-blue-600 font-medium text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
            @click="activeTab = tab"
          >{{ tab }}</button>
        </nav>
        <div v-if="activeTab === 'Tarefas'" class="flex items-center gap-2">
          <button
            v-for="v in ['list', 'kanban']"
            :key="v"
            :class="['px-2 py-1 text-xs rounded border transition-colors', viewMode === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50']"
            @click="setViewMode(v as 'list' | 'kanban')"
          >{{ v === 'list' ? 'Lista' : 'Kanban' }}</button>
          <BaseButton size="sm" @click="showTaskForm = true">+ Tarefa</BaseButton>
        </div>
      </div>

      <!-- Tasks tab -->
      <div v-if="activeTab === 'Tarefas'">
        <TaskListView v-if="viewMode === 'list'" :tasks="tasks" @open-task="openTask" />
        <KanbanView v-else :tasks="tasks" :project-id="project.id" @open-task="openTask" @status-changed="onStatusChange" />
      </div>

      <!-- Teams tab (US-04) -->
      <div v-else-if="activeTab === 'Equipes'">
        <div class="bg-white rounded-xl border border-gray-200">
          <div class="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Equipes vinculadas ({{ linkedTeams.length }})</h2>
            <div v-if="canManage && availableTeamsToLink.length" class="flex items-center gap-2">
              <select
                v-model="selectedTeamToLink"
                class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar equipe...</option>
                <option v-for="t in availableTeamsToLink" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <BaseButton size="sm" :disabled="!selectedTeamToLink" :loading="linkingTeam" @click="handleLinkTeam">
                Vincular
              </BaseButton>
            </div>
            <p v-else-if="canManage && !availableTeamsToLink.length" class="text-xs text-gray-400">Todas as equipes já vinculadas</p>
          </div>
          <ul class="divide-y divide-gray-100">
            <li v-for="tp in linkedTeams" :key="tp.teamId" class="flex items-center gap-3 p-4">
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                {{ tp.team.name.charAt(0).toUpperCase() }}
              </div>
              <p class="flex-1 text-sm font-medium text-gray-900">{{ tp.team.name }}</p>
              <BaseButton v-if="canManage" variant="ghost" size="sm" @click="handleUnlinkTeam(tp.teamId)">Desvincular</BaseButton>
            </li>
            <li v-if="!linkedTeams.length" class="p-6 text-center text-sm text-gray-400">
              Nenhuma equipe vinculada
            </li>
          </ul>
        </div>
      </div>

      <!-- Lançamentos tab -->
      <div v-else-if="activeTab === 'Lançamentos'">
        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            v-model="entriesMonth"
            type="month"
            :max="currentMonth"
            class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-500">Total: <strong class="text-gray-900">{{ formatDuration(entriesTotalSeconds) }}</strong></span>
        </div>

        <!-- Loading -->
        <div v-if="entriesLoading" class="text-sm text-gray-400 py-6">Carregando...</div>

        <!-- Empty -->
        <div v-else-if="!projectEntries.length" class="text-center py-16 text-sm text-gray-400">
          Nenhum lançamento neste período
        </div>

        <!-- Table -->
        <div v-else class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-xs text-gray-500">
                <th class="text-left px-4 py-3 font-medium">Data</th>
                <th v-if="canManage" class="text-left px-4 py-3 font-medium">Membro</th>
                <th class="text-left px-4 py-3 font-medium">Tarefa</th>
                <th class="text-left px-4 py-3 font-medium">Descrição</th>
                <th class="text-left px-4 py-3 font-medium">Início</th>
                <th class="text-left px-4 py-3 font-medium">Fim</th>
                <th class="text-right px-4 py-3 font-medium">Duração</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="e in projectEntries" :key="e.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-gray-600">{{ formatDate(e.date ?? e.startedAt) }}</td>
                <td v-if="canManage" class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <img v-if="e.user?.avatarUrl" :src="e.user.avatarUrl" class="w-6 h-6 rounded-full object-cover" />
                    <div v-else class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                      {{ e.user?.name?.charAt(0).toUpperCase() ?? '?' }}
                    </div>
                    <span class="text-gray-700 truncate max-w-28">{{ e.user?.name ?? '—' }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-600 truncate max-w-32">{{ e.task?.title ?? '—' }}</td>
                <td class="px-4 py-3 text-gray-500 truncate max-w-40">{{ e.description ?? '—' }}</td>
                <td class="px-4 py-3 font-mono text-gray-600">{{ formatTime(e.startedAt) }}</td>
                <td class="px-4 py-3 font-mono text-gray-600">{{ e.endedAt ? formatTime(e.endedAt) : '...' }}</td>
                <td class="px-4 py-3 text-right font-mono text-gray-700">{{ formatDuration(e.duration ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="entriesTotalPages > 1" class="mt-4 flex items-center justify-center gap-2">
          <button
            :disabled="entriesPage === 1"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
            @click="entriesPage--; loadProjectEntries()"
          >‹ Anterior</button>
          <span class="text-sm text-gray-500">{{ entriesPage }} / {{ entriesTotalPages }}</span>
          <button
            :disabled="entriesPage >= entriesTotalPages"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50 transition-colors"
            @click="entriesPage++; loadProjectEntries()"
          >Próxima ›</button>
        </div>
      </div>
    </template>

    <ProjectFormModal :open="showEdit" :project="project" @close="showEdit = false" @saved="onSaved" />
    <ConfirmDialog :open="showArchive" title="Arquivar Projeto" message="Tem certeza que deseja arquivar este projeto?" confirm-label="Arquivar" @confirm="archive" @cancel="showArchive = false" />
    <TaskFormModal :open="showTaskForm" :project-id="project?.id ?? ''" @close="showTaskForm = false" @saved="showTaskForm = false" />
    <TaskDetailModal :open="showTaskDetail" :task="selectedTask" @close="showTaskDetail = false" @edit="editTask" @delete="confirmDeleteTask" />
    <TaskFormModal :open="showTaskEdit" :project-id="project?.id ?? ''" :task="selectedTask" @close="showTaskEdit = false" @saved="showTaskEdit = false" />
    <ConfirmDialog :open="showDeleteTask" title="Excluir Tarefa" message="Deseja excluir esta tarefa?" @confirm="deleteTask" @cancel="showDeleteTask = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useTeamsStore } from '@/stores/teams'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { timeEntriesService } from '@/services/time-entries.service'
import type { Project } from '@/services/projects.service'
import type { Task, TaskStatus } from '@/services/tasks.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import ProjectFormModal from '@/components/projects/ProjectFormModal.vue'
import TaskListView from '@/components/tasks/TaskListView.vue'
import KanbanView from '@/components/tasks/KanbanView.vue'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'
import TaskDetailModal from '@/components/tasks/TaskDetailModal.vue'

interface ProjectEntry {
  id: string
  date: string | null
  startedAt: string
  endedAt: string | null
  duration: number | null
  description: string | null
  task?: { id: string; title: string } | null
  user?: { id: string; name: string; avatarUrl: string | null } | null
}

const route = useRoute()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const teamsStore = useTeamsStore()
const authStore = useAuthStore()
const { success: toastSuccess, error: toastError } = useToast()
const loading = ref(true)
const logoInput = ref<HTMLInputElement | null>(null)
const logoUploading = ref(false)
const selectedTeamToLink = ref('')
const linkingTeam = ref(false)
const showEdit = ref(false)
const showArchive = ref(false)
const showTaskForm = ref(false)
const showTaskEdit = ref(false)
const showTaskDetail = ref(false)
const showDeleteTask = ref(false)
const selectedTask = ref<Task | null>(null)
const activeTab = ref('Tarefas')
const tabs = ['Tarefas', 'Equipes', 'Lançamentos']
const viewMode = ref<'list' | 'kanban'>((localStorage.getItem('task_view') as 'list' | 'kanban') ?? 'list')

// Lançamentos tab
const currentMonth = format(new Date(), 'yyyy-MM')
const entriesMonth = ref(currentMonth)
const projectEntries = ref<ProjectEntry[]>([])
const entriesLoading = ref(false)
const entriesPage = ref(1)
const entriesTotalPages = ref(1)
const entriesTotalSeconds = computed(() =>
  projectEntries.value.reduce((s, e) => s + (e.duration ?? 0), 0),
)

async function loadProjectEntries() {
  if (!project.value) return
  entriesLoading.value = true
  try {
    const res = await timeEntriesService.list({
      projectId: project.value.id,
      month: entriesMonth.value,
      page: String(entriesPage.value),
      limit: '30',
    })
    const body = (res.data as { data: { data: ProjectEntry[]; meta: { totalPages: number } } }).data
    projectEntries.value = body.data
    entriesTotalPages.value = body.meta?.totalPages ?? 1
  } finally {
    entriesLoading.value = false
  }
}

watch(entriesMonth, () => { entriesPage.value = 1; loadProjectEntries() })
watch(activeTab, (tab) => { if (tab === 'Lançamentos') loadProjectEntries() })

function formatDate(iso: string) { return format(new Date(iso), 'dd/MM/yyyy') }
function formatTime(iso: string) { return format(new Date(iso), 'HH:mm') }
function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

const project = computed(() => projectsStore.currentProject)
const canManage = computed(() => ['admin', 'manager'].includes(authStore.user?.role ?? ''))
const tasks = computed(() => tasksStore.tasksByProject[project.value?.id ?? ''] ?? [])
const linkedTeams = computed(() => project.value?.teamProjects ?? [])
const availableTeamsToLink = computed(() => {
  const linkedIds = new Set(linkedTeams.value.map((tp) => tp.teamId))
  return teamsStore.teams.filter((t) => !linkedIds.has(t.id))
})

function setViewMode(mode: 'list' | 'kanban') {
  viewMode.value = mode
  localStorage.setItem('task_view', mode)
}

function openTask(task: Task) {
  selectedTask.value = task
  showTaskDetail.value = true
}

function editTask(task: Task) {
  selectedTask.value = task
  showTaskDetail.value = false
  showTaskEdit.value = true
}

function confirmDeleteTask(task: Task) {
  selectedTask.value = task
  showTaskDetail.value = false
  showDeleteTask.value = true
}

async function deleteTask() {
  if (project.value && selectedTask.value) {
    await tasksStore.remove(project.value.id, selectedTask.value.id)
    showDeleteTask.value = false
  }
}

async function onStatusChange(id: string, status: TaskStatus) {
  if (project.value) await tasksStore.update(project.value.id, id, { status })
}

function onSaved(_p: Project) { showEdit.value = false }

async function archive() {
  if (project.value) { await projectsStore.archive(project.value.id); showArchive.value = false }
}

function triggerLogoUpload() {
  logoInput.value?.click()
}

async function handleLogoChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !project.value) return
  if (file.size > 2 * 1024 * 1024) {
    toastError('A imagem deve ter no máximo 2MB.')
    return
  }
  logoUploading.value = true
  try {
    await projectsStore.uploadLogo(project.value.id, file)
    toastSuccess('Logo atualizado com sucesso!')
  } catch {
    toastError('Erro ao enviar logo.')
  } finally {
    logoUploading.value = false
    if (logoInput.value) logoInput.value.value = ''
  }
}

async function handleRemoveLogo() {
  if (!project.value) return
  logoUploading.value = true
  try {
    await projectsStore.removeLogo(project.value.id)
    toastSuccess('Logo removido.')
  } catch {
    toastError('Erro ao remover logo.')
  } finally {
    logoUploading.value = false
  }
}

async function handleLinkTeam() {
  if (!project.value || !selectedTeamToLink.value) return
  const team = teamsStore.teams.find((t) => t.id === selectedTeamToLink.value)
  if (!team) return
  linkingTeam.value = true
  try {
    await projectsStore.linkTeam(project.value.id, team.id, team.name)
    selectedTeamToLink.value = ''
    toastSuccess(`Equipe "${team.name}" vinculada.`)
  } catch {
    toastError('Erro ao vincular equipe.')
  } finally {
    linkingTeam.value = false
  }
}

async function handleUnlinkTeam(teamId: string) {
  if (!project.value) return
  const tp = linkedTeams.value.find((t) => t.teamId === teamId)
  try {
    await projectsStore.unlinkTeam(project.value.id, teamId)
    toastSuccess(`Equipe "${tp?.team.name ?? ''}" desvinculada.`)
  } catch {
    toastError('Erro ao desvincular equipe.')
  }
}

onMounted(async () => {
  const id = route.params.id as string
  try {
    await Promise.all([
      projectsStore.fetchOne(id),
      tasksStore.fetchByProject(id),
      teamsStore.fetchAll(),
    ])
  } finally { loading.value = false }
})
</script>
