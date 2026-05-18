<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Redefinir senha</h2>

      <form @submit="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input v-model="passwordValue" v-bind="passwordField" type="password" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mínimo 8 caracteres" />
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <input v-model="confirmValue" v-bind="confirmField" type="password" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Repita a senha" />
          <p v-if="errors.confirm" class="text-red-500 text-xs mt-1">{{ errors.confirm }}</p>
        </div>
        <div v-if="errorMessage" class="text-red-600 text-sm">{{ errorMessage }}</div>
        <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {{ loading ? 'Salvando...' : 'Redefinir senha' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')

const schema = toTypedSchema(z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Senhas não conferem', path: ['confirm'] }))

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [passwordValue, passwordField] = defineField('password')
const [confirmValue, confirmField] = defineField('confirm')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  errorMessage.value = ''
  try {
    await authService.resetPassword({ token: route.query.token as string, newPassword: values.password })
    await router.push({ name: 'login' })
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMessage.value = e.response?.data?.message ?? 'Erro ao redefinir senha.'
  } finally {
    loading.value = false
  }
})
</script>
