<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div v-if="loading" class="text-sm text-gray-400">Carregando...</div>
    <template v-else-if="team">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-gray-900">{{ team.name }}</h1>
        <div class="flex gap-2">
          <BaseButton variant="secondary" size="sm" @click="showEdit = true">Editar</BaseButton>
          <BaseButton variant="danger" size="sm" @click="showDelete = true">Excluir</BaseButton>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200">
        <div class="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Membros ({{ team.members?.length ?? 0 }})</h2>
          <BaseButton size="sm" @click="showAddMember = true">Adicionar Membro</BaseButton>
        </div>
        <ul class="divide-y divide-gray-100">
          <li v-for="member in team.members" :key="member.id" class="flex items-center gap-3 p-4">
            <BaseAvatar :name="member.name" :src="member.avatarUrl" size="sm" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ member.name }}</p>
              <p class="text-xs text-gray-500">{{ member.email }}</p>
            </div>
            <BaseBadge :variant="member.role === 'admin' ? 'info' : member.role === 'manager' ? 'warning' : 'neutral'" size="sm">
              {{ member.role }}
            </BaseBadge>
            <BaseButton variant="ghost" size="sm" @click="confirmRemove(member.id)">Remover</BaseButton>
          </li>
          <li v-if="!team.members?.length" class="p-4 text-center text-sm text-gray-400">Sem membros</li>
        </ul>
      </div>
    </template>

    <TeamFormModal :open="showEdit" :team="team" @close="showEdit = false" @saved="reload" />
    <AddMemberModal v-if="team" :open="showAddMember" :team-id="team.id" :current-members="team.members ?? []" @close="showAddMember = false" @added="reload" />
    <ConfirmDialog :open="showRemove" title="Remover Membro" message="Deseja remover este membro da equipe?" @confirm="removeMember" @cancel="showRemove = false" confirm-label="Remover" />
    <ConfirmDialog :open="showDelete" title="Excluir Equipe" message="Tem certeza? Os membros serão desvinculados mas não excluídos." confirm-label="Excluir" @confirm="deleteTeam" @cancel="showDelete = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import TeamFormModal from '@/components/teams/TeamFormModal.vue'
import AddMemberModal from '@/components/teams/AddMemberModal.vue'

const route = useRoute()
const router = useRouter()
const store = useTeamsStore()
const loading = ref(true)
const showEdit = ref(false)
const showDelete = ref(false)
const showAddMember = ref(false)
const showRemove = ref(false)
const removingId = ref<string | null>(null)

const team = computed(() => store.currentTeam)

function confirmRemove(userId: string) {
  removingId.value = userId
  showRemove.value = true
}

async function removeMember() {
  if (team.value && removingId.value) {
    await store.removeMember(team.value.id, removingId.value)
    showRemove.value = false
  }
}

async function deleteTeam() {
  if (team.value) {
    await store.deleteTeam(team.value.id)
    await router.push({ name: 'teams' })
  }
}

async function reload() {
  if (team.value) await store.fetchOne(team.value.id)
}

onMounted(async () => {
  try { await store.fetchOne(route.params.id as string) } finally { loading.value = false }
})
</script>
