<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-900">Projetos</h1>
      <BaseButton v-if="canManage" @click="openCreate">Novo Projeto</BaseButton>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
      <button
        v-for="f in filters"
        :key="f.value"
        :class="['px-3 py-1.5 text-sm rounded-md transition-colors', filter === f.value ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700']"
        @click="filter = f.value"
      >{{ f.label }}</button>
    </div>

    <div v-if="loading" class="text-sm text-gray-400">Carregando...</div>

    <div v-else-if="!filteredProjects.length" class="text-center py-16">
      <p class="text-gray-500 mb-3">Nenhum projeto encontrado</p>
      <BaseButton v-if="canManage" variant="secondary" @click="openCreate">Criar primeiro projeto</BaseButton>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="project in pagedProjects"
        :key="project.id"
        :class="['bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow', project.status === 'archived' && 'opacity-60']"
        @click="$router.push({ name: 'project-detail', params: { id: project.id } })"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <img v-if="project.logoUrl" :src="project.logoUrl" class="w-10 h-10 rounded-lg object-cover" :alt="project.name" />
            <div v-else class="w-10 h-10 rounded-lg flex-shrink-0" :style="{ backgroundColor: project.color || '#3B82F6' }" />
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ project.name }}</p>
              <p v-if="project.description" class="text-xs text-gray-500 line-clamp-1">{{ project.description }}</p>
            </div>
          </div>
          <BaseBadge :variant="project.status === 'active' ? 'success' : 'neutral'" size="sm">
            {{ project.status === 'active' ? 'Ativo' : 'Arquivado' }}
          </BaseBadge>
        </div>
        <p class="text-xs text-gray-400">{{ project.tasksCount ?? 0 }} tarefa(s)</p>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-6">
      <BasePagination :current-page="currentPage" :total-pages="totalPages" @page-change="onPageChange" />
    </div>

    <ProjectFormModal :open="showModal" :project="editingProject" @close="showModal = false" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import type { Project } from '@/services/projects.service'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import ProjectFormModal from '@/components/projects/ProjectFormModal.vue'

const PAGE_SIZE = 12

const store = useProjectsStore()
const authStore = useAuthStore()
const loading = ref(false)
const showModal = ref(false)
const editingProject = ref<Project | null>(null)
const filter = ref<'all' | 'active' | 'archived'>('all')
const currentPage = ref(1)

const filters = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'active' as const, label: 'Ativos' },
  { value: 'archived' as const, label: 'Arquivados' },
]

const canManage = computed(() => ['admin', 'manager'].includes(authStore.user?.role ?? ''))

const filteredProjects = computed(() =>
  store.projects.filter((p) => filter.value === 'all' || p.status === filter.value),
)
const totalPages = computed(() => Math.ceil(filteredProjects.value.length / PAGE_SIZE))
const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredProjects.value.slice(start, start + PAGE_SIZE)
})

function onPageChange(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openCreate() {
  editingProject.value = null
  showModal.value = true
}

function onSaved(_project: Project) {
  showModal.value = false
}

onMounted(async () => {
  loading.value = true
  try { await store.fetchAll() } finally { loading.value = false }
})
</script>
