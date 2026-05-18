<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Criar conta</h2>

      <form @submit="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input v-model="nameValue" v-bind="nameField" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Seu nome" />
          <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input v-model="emailValue" v-bind="emailField" type="email" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" />
          <p v-if="errors.email || emailError" class="text-red-500 text-xs mt-1">{{ errors.email || emailError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input v-model="passwordValue" v-bind="passwordField" type="password" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mínimo 8 caracteres" />
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
          <input v-model="confirmValue" v-bind="confirmField" type="password" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Repita a senha" />
          <p v-if="errors.confirm" class="text-red-500 text-xs mt-1">{{ errors.confirm }}</p>
        </div>

        <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {{ loading ? 'Criando conta...' : 'Criar conta' }}
        </button>
      </form>

      <p class="mt-4 text-sm text-center text-gray-500">
        Já tem conta? <RouterLink to="/login" class="text-blue-600 hover:underline">Entrar</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'

const router = useRouter()
const loading = ref(false)
const emailError = ref('')

const schema = toTypedSchema(z.object({
  name: z.string().min(2, 'Nome precisa ter ao menos 2 caracteres').max(150),
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(8, 'Senha precisa ter ao menos 8 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Senhas não conferem', path: ['confirm'] }))

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [nameValue, nameField] = defineField('name')
const [emailValue, emailField] = defineField('email')
const [passwordValue, passwordField] = defineField('password')
const [confirmValue, confirmField] = defineField('confirm')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  emailError.value = ''
  try {
    await authService.register({ name: values.name, email: values.email, password: values.password })
    await router.push({ name: 'register-success', query: { email: values.email } })
  } catch (err: unknown) {
    const e = err as { response?: { status: number; data?: { message?: string } } }
    if (e.response?.status === 409) {
      emailError.value = 'E-mail já cadastrado'
    }
  } finally {
    loading.value = false
  }
})
</script>
