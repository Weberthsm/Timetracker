<template>
  <BaseModal :open="open" :title="task ? 'Editar Tarefa' : 'Nova Tarefa'" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Título <span class="text-red-500">*</span></label>
        <input v-model="nameValue" v-bind="nameField" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome da tarefa" />
        <p v-if="errors.title" class="mt-1 text-xs text-red-600">{{ errors.title }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea v-model="descValue" v-bind="descField" rows="3" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <div v-if="task">
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select v-model="statusValue" v-bind="statusField" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="todo">Todo</option>
          <option value="in_progress">Em Progresso</option>
          <option value="done">Concluído</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>
      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton :loading="loading" @click="submit">{{ task ? 'Salvar' : 'Criar' }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/services/tasks.service'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ open: boolean; projectId: string; task?: Task | null }>()
const emit = defineEmits<{ close: []; saved: [Task] }>()

const store = useTasksStore()
const loading = ref(false)
const errorMsg = ref('')

const { handleSubmit, errors, defineField, setValues } = useForm({
  validationSchema: toTypedSchema(z.object({
    title: z.string().min(1, 'Título obrigatório'),
    description: z.string().optional(),
    status: z.string().optional(),
  })),
})
const [nameValue, nameField] = defineField('title')
const [descValue, descField] = defineField('description')
const [statusValue, statusField] = defineField('status')

watch(() => props.open, (open) => {
  if (open) {
    setValues({ title: props.task?.title ?? '', description: props.task?.description ?? '', status: props.task?.status ?? 'todo' })
    errorMsg.value = ''
  }
})

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  errorMsg.value = ''
  try {
    let saved: Task
    if (props.task) {
      saved = await store.update(props.projectId, props.task.id, { title: values.title, description: values.description, status: values.status as Task['status'] })
    } else {
      saved = await store.create(props.projectId, { title: values.title, description: values.description })
    }
    emit('saved', saved)
    emit('close')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMsg.value = e.response?.data?.message ?? 'Erro ao salvar.'
  } finally {
    loading.value = false
  }
})

async function submit() { await onSubmit() }
</script>
