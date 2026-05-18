<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-900">Equipes</h1>
      <BaseButton @click="showCreate = true">Nova Equipe</BaseButton>
    </div>

    <div v-if="loading" class="text-sm text-gray-400">Carregando...</div>

    <div v-else-if="!store.teams.length" class="text-center py-16">
      <p class="text-gray-500 mb-3">Nenhuma equipe cadastrada</p>
      <BaseButton variant="secondary" @click="showCreate = true">Criar primeira equipe</BaseButton>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="team in pagedTeams"
        :key="team.id"
        class="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
        @click="$router.push({ name: 'team-detail', params: { id: team.id } })"
      >
        <p class="font-medium text-gray-900">{{ team.name }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ team.membersCount ?? 0 }} membro(s)</p>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-6">
      <BasePagination :current-page="currentPage" :total-pages="totalPages" @page-change="onPageChange" />
    </div>

    <TeamFormModal :open="showCreate" @close="showCreate = false" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import BaseButton from '@/components/ui/BaseButton.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import TeamFormModal from '@/components/teams/TeamFormModal.vue'

const PAGE_SIZE = 12
const store = useTeamsStore()
const loading = ref(false)
const showCreate = ref(false)
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(store.teams.length / PAGE_SIZE))
const pagedTeams = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return store.teams.slice(start, start + PAGE_SIZE)
})

function onPageChange(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onSaved() { showCreate.value = false }

onMounted(async () => {
  loading.value = true
  try { await store.fetchAll() } finally { loading.value = false }
})
</script>
