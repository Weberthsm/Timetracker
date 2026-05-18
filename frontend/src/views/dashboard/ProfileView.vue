<template>
  <div class="max-w-lg mx-auto">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Meu Perfil</h2>

      <!-- Avatar -->
      <div class="flex flex-col items-center mb-8">
        <div class="relative group mb-3">
          <!-- Avatar display -->
          <BaseAvatar :src="user?.avatarUrl" :name="user?.name ?? ''" size="lg" />

          <!-- Overlay upload (hover) -->
          <button
            class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            title="Alterar foto"
            @click="triggerAvatarUpload"
          >
            <span class="text-white text-xs font-medium text-center px-1 leading-tight">Alterar</span>
          </button>

          <!-- Remove button -->
          <button
            v-if="user?.avatarUrl"
            class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
            title="Remover foto"
            @click.stop="handleRemoveAvatar"
          >×</button>

          <input
            ref="avatarInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="handleAvatarChange"
          />
        </div>

        <p class="text-xs text-gray-400">JPEG, PNG ou WebP · máx. 2 MB · recomendado 400 × 400 px</p>
        <p v-if="uploading" class="text-xs text-blue-500 mt-1">Enviando...</p>
      </div>

      <!-- User info -->
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Nome</label>
          <p class="text-sm text-gray-900 font-medium">{{ user?.name }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">E-mail</label>
          <p class="text-sm text-gray-900">{{ user?.email }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Função</label>
          <BaseBadge :variant="roleBadge.variant" size="sm">{{ roleBadge.label }}</BaseBadge>
        </div>
        <div v-if="user?.emailVerifiedAt !== undefined">
          <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">E-mail verificado</label>
          <BaseBadge :variant="user?.emailVerifiedAt ? 'success' : 'neutral'" size="sm">
            {{ user?.emailVerifiedAt ? 'Verificado' : 'Pendente' }}
          </BaseBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { uploadService } from '@/services/upload.service'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const authStore = useAuthStore()
const { success: toastSuccess, error: toastError } = useToast()

const user = computed(() => authStore.user)
const avatarInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const roleBadge = computed(() => {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
    admin: { label: 'Administrador', variant: 'success' },
    manager: { label: 'Gerente', variant: 'warning' },
    member: { label: 'Membro', variant: 'neutral' },
  }
  return map[user.value?.role ?? 'member'] ?? map.member
})

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    toastError('A imagem deve ter no máximo 2 MB.')
    return
  }
  uploading.value = true
  try {
    const res = await uploadService.uploadAvatar(file)
    const { avatarUrl } = (res.data as { data: { avatarUrl: string } }).data
    if (authStore.user) authStore.setUser({ ...authStore.user, avatarUrl })
    toastSuccess('Foto atualizada com sucesso!')
  } catch {
    toastError('Erro ao enviar foto.')
  } finally {
    uploading.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

async function handleRemoveAvatar() {
  uploading.value = true
  try {
    await uploadService.removeAvatar()
    if (authStore.user) authStore.setUser({ ...authStore.user, avatarUrl: null })
    toastSuccess('Foto removida.')
  } catch {
    toastError('Erro ao remover foto.')
  } finally {
    uploading.value = false
  }
}
</script>
