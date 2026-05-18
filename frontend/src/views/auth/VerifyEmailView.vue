<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div v-if="status === 'loading'" class="text-gray-500">Verificando e-mail...</div>
      <div v-else-if="status === 'success'">
        <div class="text-green-600 text-4xl mb-4">✓</div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">E-mail verificado!</h2>
        <p class="text-gray-500 mb-6">Sua conta foi ativada com sucesso.</p>
        <RouterLink to="/login" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">Fazer login</RouterLink>
      </div>
      <div v-else>
        <div class="text-red-500 text-4xl mb-4">✗</div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Link inválido ou expirado</h2>
        <p class="text-gray-500 mb-6">{{ errorMessage }}</p>
        <RouterLink to="/login" class="text-blue-600 hover:underline text-sm">Solicitar novo link</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '@/services/auth.service'

const route = useRoute()
const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Token não encontrado na URL.'
    return
  }
  try {
    await authService.verifyEmail(token)
    status.value = 'success'
  } catch (err: unknown) {
    status.value = 'error'
    const e = err as { response?: { data?: { message?: string } } }
    errorMessage.value = e.response?.data?.message ?? 'Erro ao verificar e-mail.'
  }
})
</script>
