<template>
  <BaseModal :open="open" title="Adicionar Membro" @close="$emit('close')">
    <div class="space-y-3">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar usuário..."
        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div v-if="loading" class="text-sm text-gray-400 py-4 text-center">Carregando...</div>
      <ul v-else class="max-h-60 overflow-y-auto divide-y divide-gray-100">
        <li
          v-for="user in filteredUsers"
          :key="user.id"
          :class="['flex items-center gap-3 p-2 cursor-pointer rounded-md hover:bg-gray-50', selected === user.id && 'bg-blue-50']"
          @click="selected = user.id"
        >
          <BaseAvatar :name="user.name" :src="user.avatarUrl" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ user.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
          </div>
          <span v-if="selected === user.id" class="text-blue-600 text-xs">✓</span>
        </li>
        <li v-if="!filteredUsers.length" class="py-4 text-center text-sm text-gray-400">Nenhum usuário disponível</li>
      </ul>
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton :disabled="!selected" :loading="adding" @click="add">Adicionar</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import type { TeamMember } from '@/services/teams.service'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'

const props = defineProps<{ open: boolean; teamId: string; currentMembers: TeamMember[] }>()
const emit = defineEmits<{ close: []; added: [] }>()

const loading = ref(false)
const adding = ref(false)
const search = ref('')
const selected = ref<string | null>(null)
const users = ref<TeamMember[]>([])

const currentIds = computed(() => new Set(props.currentMembers.map((m) => m.id)))

const filteredUsers = computed(() =>
  users.value
    .filter((u) => !currentIds.value.has(u.id))
    .filter((u) => u.name.toLowerCase().includes(search.value.toLowerCase()) ||
      u.email.toLowerCase().includes(search.value.toLowerCase())),
)

async function add() {
  if (!selected.value) return
  adding.value = true
  try {
    await api.post(`/teams/${props.teamId}/members`, { userId: selected.value })
    emit('added')
    emit('close')
  } finally {
    adding.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/users', { params: { limit: '1000' } })
    const body = (res.data as { data: { data: TeamMember[] } }).data
    users.value = body.data
  } finally {
    loading.value = false
  }
})
</script>
