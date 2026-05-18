<template>
  <BaseModal :open="open" :title="entry ? 'Editar Lançamento' : 'Novo Lançamento'" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Projeto <span class="text-red-500">*</span></label>
        <select v-model="form.projectId" data-testid="entry-project" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="" disabled>Selecione...</option>
          <option v-for="p in activeProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div v-if="projectTasks.length">
        <label class="block text-sm font-medium text-gray-700 mb-1">Tarefa</label>
        <select v-model="form.taskId" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Sem tarefa</option>
          <option v-for="t in projectTasks" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Data <span class="text-red-500">*</span></label>
        <input v-model="form.date" type="date" :max="today" data-testid="entry-date" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p v-if="isPastDate" data-testid="retro-warning" class="mt-1 text-xs text-yellow-600">Você está registrando horas em uma data anterior a hoje</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Início <span class="text-red-500">*</span></label>
          <input v-model="form.startTime" type="time" data-testid="entry-start" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Fim <span class="text-red-500">*</span></label>
          <input v-model="form.endTime" type="time" data-testid="entry-end" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p v-if="timeError" class="mt-1 text-xs text-red-600">{{ timeError }}</p>
        </div>
      </div>
      <p v-if="durationPreview" class="text-xs text-gray-600">Duração: <strong>{{ durationPreview }}</strong></p>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea v-model="form.description" rows="2" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton data-testid="entry-submit" :loading="loading" :disabled="!isValid" @click="submit">{{ entry ? 'Salvar' : 'Adicionar' }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { timeEntriesService, type TimeEntry } from '@/services/time-entries.service'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ open: boolean; entry?: TimeEntry | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const loading = ref(false)
const errorMsg = ref('')
const today = format(new Date(), 'yyyy-MM-dd')

const form = ref({ projectId: '', taskId: '', date: today, startTime: '', endTime: '', description: '' })

const activeProjects = computed(() => projectsStore.projects.filter((p) => p.status === 'active'))

const projectTasks = computed(() =>
  (tasksStore.tasksByProject[form.value.projectId] ?? [])
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled'),
)

const isPastDate = computed(() => form.value.date < today && form.value.date !== '')

const timeError = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return ''
  return form.value.endTime <= form.value.startTime ? 'Fim deve ser após início' : ''
})

const durationPreview = computed(() => {
  if (!form.value.startTime || !form.value.endTime || timeError.value) return ''
  const [sh, sm] = form.value.startTime.split(':').map(Number)
  const [eh, em] = form.value.endTime.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
})

const isValid = computed(() =>
  !!form.value.projectId && !!form.value.date && !!form.value.startTime && !!form.value.endTime && !timeError.value,
)

watch(() => form.value.projectId, async (id) => {
  form.value.taskId = ''
  if (id && !tasksStore.tasksByProject[id]) await tasksStore.fetchByProject(id)
})

watch(() => props.open, (open) => {
  if (open) {
    const e = props.entry
    form.value = {
      projectId: e?.projectId ?? '',
      taskId: e?.taskId ?? '',
      date: e ? format(new Date(e.startedAt), 'yyyy-MM-dd') : today,
      startTime: e ? format(new Date(e.startedAt), 'HH:mm') : '',
      endTime: e?.endedAt ? format(new Date(e.endedAt), 'HH:mm') : '',
      description: e?.description ?? '',
    }
    errorMsg.value = ''
  }
})

async function submit() {
  if (!isValid.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const startedAt = new Date(`${form.value.date}T${form.value.startTime}:00`).toISOString()
    const endedAt = new Date(`${form.value.date}T${form.value.endTime}:00`).toISOString()
    const payload = {
      projectId: form.value.projectId,
      taskId: form.value.taskId || undefined,
      description: form.value.description || undefined,
      date: form.value.date,
      startedAt,
      endedAt,
    }
    if (props.entry) {
      await timeEntriesService.update(props.entry.id, payload)
    } else {
      await timeEntriesService.create(payload)
    }
    emit('saved')
    emit('close')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMsg.value = e.response?.data?.message ?? 'Erro ao salvar.'
  } finally {
    loading.value = false
  }
}
</script>
