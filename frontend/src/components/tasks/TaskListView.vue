<template>
  <div>
    <!-- Filter -->
    <div class="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
      <button
        v-for="f in filters"
        :key="f.value"
        :class="['px-3 py-1 text-xs rounded-md transition-colors', activeFilter === f.value ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700']"
        @click="activeFilter = f.value"
      >{{ f.label }}</button>
    </div>

    <div v-if="!filteredTasks.length" class="text-center py-8 text-sm text-gray-400">Nenhuma tarefa</div>

    <table v-else class="w-full text-sm">
      <thead class="border-b border-gray-200">
        <tr>
          <th class="text-left py-2 pr-4 text-xs font-medium text-gray-500">Título</th>
          <th class="text-left py-2 pr-4 text-xs font-medium text-gray-500">Status</th>
          <th class="text-left py-2 text-xs font-medium text-gray-500">Criado</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="task in filteredTasks"
          :key="task.id"
          class="cursor-pointer hover:bg-gray-50 transition-colors"
          @click="$emit('openTask', task)"
        >
          <td class="py-2 pr-4 font-medium text-gray-900">{{ task.title }}</td>
          <td class="py-2 pr-4">
            <BaseBadge :variant="statusVariant(task.status)" size="sm">{{ statusLabel(task.status) }}</BaseBadge>
          </td>
          <td class="py-2 text-gray-500 text-xs">{{ formatDate(task.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import type { Task, TaskStatus } from '@/services/tasks.service'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps<{ tasks: Task[] }>()
defineEmits<{ openTask: [Task] }>()

const activeFilter = ref<TaskStatus | 'all'>('all')
const filters = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'todo' as const, label: 'Todo' },
  { value: 'in_progress' as const, label: 'Em Progresso' },
  { value: 'done' as const, label: 'Concluído' },
  { value: 'cancelled' as const, label: 'Cancelado' },
]

const filteredTasks = computed(() =>
  activeFilter.value === 'all' ? props.tasks : props.tasks.filter((t) => t.status === activeFilter.value),
)

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
