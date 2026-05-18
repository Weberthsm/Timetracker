<template>
  <BaseModal v-if="task" :open="open" :title="task.title" size="lg" @close="$emit('close')">
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <BaseBadge :variant="statusVariant(task.status)" size="sm">{{ statusLabel(task.status) }}</BaseBadge>
        <span class="text-xs text-gray-400">Criado em {{ formatDate(task.createdAt) }}</span>
      </div>
      <p v-if="task.description" class="text-sm text-gray-700">{{ task.description }}</p>
      <p v-else class="text-sm text-gray-400 italic">Sem descrição</p>
    </div>
    <template #footer>
      <BaseButton v-if="canManage" variant="danger" size="sm" @click="$emit('delete', task)">Excluir</BaseButton>
      <BaseButton variant="ghost" @click="$emit('close')">Fechar</BaseButton>
      <BaseButton size="sm" @click="$emit('edit', task)">Editar</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/auth'
import type { Task, TaskStatus } from '@/services/tasks.service'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

defineProps<{ open: boolean; task: Task | null }>()
defineEmits<{ close: []; edit: [Task]; delete: [Task] }>()

const authStore = useAuthStore()
const canManage = computed(() => ['admin', 'manager'].includes(authStore.user?.role ?? ''))

function statusLabel(s: TaskStatus) {
  return { todo: 'Todo', in_progress: 'Em Progresso', done: 'Concluído', cancelled: 'Cancelado' }[s]
}

function statusVariant(s: TaskStatus) {
  return { todo: 'neutral', in_progress: 'info', done: 'success', cancelled: 'error' }[s] as 'neutral' | 'info' | 'success' | 'error'
}

function formatDate(iso: string) {
  return format(new Date(iso), 'dd/MM/yyyy')
}
</script>
