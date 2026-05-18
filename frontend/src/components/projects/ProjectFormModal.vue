<template>
  <BaseModal :open="open" :title="project ? 'Editar Projeto' : 'Novo Projeto'" @close="$emit('close')">
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nome <span class="text-red-500">*</span></label>
        <input v-model="nameValue" v-bind="nameField" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome do projeto" />
        <p v-if="errors.name" class="mt-1 text-xs text-red-600">{{ errors.name }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea v-model="descValue" v-bind="descField" rows="3" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Descrição opcional" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Cor</label>
        <div class="flex items-center gap-3">
          <input v-model="colorValue" v-bind="colorField" type="color" class="w-10 h-10 rounded cursor-pointer border border-gray-300" />
          <input v-model="colorValue" v-bind="colorField" type="text" class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="#3B82F6" />
        </div>
        <p v-if="errors.color" class="mt-1 text-xs text-red-600">{{ errors.color }}</p>
      </div>

      <div v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</div>
    </form>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton type="submit" :loading="loading" @click="submit">
        {{ project ? 'Salvar' : 'Criar Projeto' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useProjectsStore } from '@/stores/projects'
import type { Project } from '@/services/projects.service'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ open: boolean; project?: Project | null }>()
const emit = defineEmits<{ close: []; saved: [Project] }>()

const store = useProjectsStore()
const loading = ref(false)
const errorMsg = ref('')

const schema = toTypedSchema(z.object({
  name: z.string().min(1, 'Nome obrigatório').max(150),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional().or(z.literal('')),
}))

const { handleSubmit, errors, defineField, setValues } = useForm({ validationSchema: schema })
const [nameValue, nameField] = defineField('name')
const [descValue, descField] = defineField('description')
const [colorValue, colorField] = defineField('color')

watch(() => props.open, (open) => {
  if (open) {
    setValues({
      name: props.project?.name ?? '',
      description: props.project?.description ?? '',
      color: props.project?.color ?? '#3B82F6',
    })
    errorMsg.value = ''
  }
})

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = { name: values.name, description: values.description, color: values.color || undefined }
    const saved = props.project
      ? await store.update(props.project.id, data)
      : await store.create(data)
    emit('saved', saved)
    emit('close')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMsg.value = e.response?.data?.message ?? 'Erro ao salvar projeto.'
  } finally {
    loading.value = false
  }
})

async function submit() {
  await onSubmit()
}
</script>
