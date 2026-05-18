<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div class="text-blue-500 text-4xl mb-4">✉</div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Verifique seu e-mail</h2>
      <p class="text-gray-500 mb-6">Enviamos um link de confirmação para <strong>{{ email }}</strong>. Clique no link para ativar sua conta.</p>
      <button :disabled="resent || loading" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm" @click="resend">
        {{ resent ? 'E-mail reenviado!' : loading ? 'Enviando...' : 'Reenviar e-mail' }}
      </button>
      <p class="mt-4 text-sm"><RouterLink to="/login" class="text-blue-600 hover:underline">Voltar ao login</RouterLink></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from '@/services/auth.service'

const route = useRoute()
const email = route.query.email as string ?? ''
const loading = ref(false)
const resent = ref(false)

async function resend() {
  loading.value = true
  try {
    await authService.resendVerification(email)
    resent.value = true
  } finally {
    loading.value = false
  }
}
</script>
