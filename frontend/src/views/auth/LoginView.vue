<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Entrar</h2>

      <form @submit="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input v-model="emailValue" v-bind="emailField" type="email" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" />
          <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input v-model="passwordValue" v-bind="passwordField" type="password" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
        </div>

        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {{ errorMessage }}
          <button v-if="showResend" type="button" class="underline ml-1" @click="handleResend">Reenviar e-mail</button>
        </div>

        <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="mt-4 flex flex-col gap-2 text-sm text-center">
        <RouterLink to="/forgot-password" class="text-blue-600 hover:underline">Esqueci minha senha</RouterLink>
        <span class="text-gray-500">Não tem conta? <RouterLink to="/register" class="text-blue-600 hover:underline">Criar conta</RouterLink></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth.service'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const showResend = ref(false)
const pendingEmail = ref('')

const schema = toTypedSchema(z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
}))

const { handleSubmit, errors, defineField, setValues, validate } = useForm({ validationSchema: schema })
const [emailValue, emailField] = defineField('email')
const [passwordValue, passwordField] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  errorMessage.value = ''
  showResend.value = false
  try {
    const res = await authService.login(values)
    const { accessToken, user } = (res.data as { data: { accessToken: string; user: Record<string, unknown> } }).data
    authStore.setAuth(user as unknown as Parameters<typeof authStore.setAuth>[0], accessToken)
    await router.push('/app/dashboard')
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data?: { message?: string } } }
    if (e.response?.status === 403) {
      errorMessage.value = 'E-mail não verificado.'
      showResend.value = true
      pendingEmail.value = values.email
    } else {
      errorMessage.value = e.response?.data?.message ?? 'Credenciais inválidas'
    }
  } finally {
    loading.value = false
  }
})

defineExpose({ setValues, validate, onSubmit })

async function handleResend() {
  await authService.resendVerification(pendingEmail.value)
  errorMessage.value = 'E-mail de confirmação reenviado.'
  showResend.value = false
}
</script>
