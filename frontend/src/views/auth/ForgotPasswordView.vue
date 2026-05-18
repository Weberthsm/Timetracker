<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Recuperar senha</h2>
      <p class="text-gray-500 text-sm mb-6">Informe seu e-mail e enviaremos as instruções.</p>

      <div v-if="sent" class="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-700 mb-4">
        Se o e-mail estiver cadastrado, você receberá as instruções em breve.
      </div>

      <form v-else @submit="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input v-model="emailValue" v-bind="emailField" type="email" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" />
          <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
        </div>
        <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {{ loading ? 'Enviando...' : 'Enviar instruções' }}
        </button>
      </form>

      <p class="mt-4 text-sm text-center">
        <RouterLink to="/login" class="text-blue-600 hover:underline">Voltar ao login</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { authService } from '@/services/auth.service'

const loading = ref(false)
const sent = ref(false)

const schema = toTypedSchema(z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
}))

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [emailValue, emailField] = defineField('email')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    await authService.forgotPassword(values.email)
    sent.value = true
  } finally {
    loading.value = false
  }
})
</script>
