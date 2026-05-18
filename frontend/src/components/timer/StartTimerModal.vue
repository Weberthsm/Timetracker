<template>
  <BaseModal :open="open" title="Iniciar Timer" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Projeto <span class="text-red-500">*</span></label>
        <select v-model="selectedProjectId" data-testid="timer-project-select" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="" disabled>Selecione um projeto</option>
          <option v-for="p in activeProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div v-if="availableTasks.length">
        <label class="block text-sm font-medium text-gray-700 mb-1">Tarefa</label>
        <select v-model="selectedTaskId" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Sem tarefa</option>
          <option v-for="t in availableTasks" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>
      </div>
      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton data-testid="timer-submit-btn" :disabled="!selectedProjectId" :loading="loading" @click="submit">Iniciar</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useTimer } from '@/composables/useTimer'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; started: [] }>()

const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const timer = useTimer()
const toast = useToast()
const loading = ref(false)
const errorMsg = ref('')
const selectedProjectId = ref('')
const selectedTaskId = ref('')

const activeProjects = computed(() => projectsStore.projects.filter((p) => p.status === 'active'))
const availableTasks = computed(() =>
  (tasksStore.tasksByProject[selectedProjectId.value] ?? [])
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled'),
)

watch(selectedProjectId, async (id) => {
  selectedTaskId.value = ''
  if (id && !tasksStore.tasksByProject[id]) {
    await tasksStore.fetchByProject(id)
  }
})

watch(() => props.open, (open) => {
  if (open) {
    selectedProjectId.value = ''
    selectedTaskId.value = ''
    errorMsg.value = ''
  }
})

async function submit() {
  if (!selectedProjectId.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await timer.start({
      projectId: selectedProjectId.value,
      taskId: selectedTaskId.value || undefined,
    })
    emit('started')
    emit('close')
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data?: { message?: string } } }
    if (e.response?.status === 422) {
      toast.warning('Já existe um timer ativo. Pare o timer atual antes de iniciar um novo.')
    } else {
      errorMsg.value = e.response?.data?.message ?? 'Erro ao iniciar timer.'
    }
  } finally {
    loading.value = false
  }
}
</script>
