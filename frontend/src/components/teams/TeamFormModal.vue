<template>
  <BaseModal :open="open" :title="team ? 'Editar Equipe' : 'Nova Equipe'" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nome <span class="text-red-500">*</span></label>
        <input v-model="nameValue" v-bind="nameField" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome da equipe" />
        <p v-if="errors.name" class="mt-1 text-xs text-red-600">{{ errors.name }}</p>
      </div>
      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton :loading="loading" @click="submit">{{ team ? 'Salvar' : 'Criar' }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useTeamsStore } from '@/stores/teams'
import type { Team } from '@/services/teams.service'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ open: boolean; team?: Team | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useTeamsStore()
const loading = ref(false)
const errorMsg = ref('')

const { handleSubmit, errors, defineField, setValues } = useForm({
  validationSchema: toTypedSchema(z.object({ name: z.string().min(1, 'Nome obrigatório') })),
})
const [nameValue, nameField] = defineField('name')

watch(() => props.open, (open) => {
  if (open) { setValues({ name: props.team?.name ?? '' }); errorMsg.value = '' }
})

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  errorMsg.value = ''
  try {
    props.team ? await store.update(props.team.id, values) : await store.create(values)
    emit('saved')
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
