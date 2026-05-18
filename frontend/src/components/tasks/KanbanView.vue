<template>
  <div class="grid grid-cols-4 gap-4 min-h-64">
    <div
      v-for="col in columns"
      :key="col.status"
      class="bg-gray-50 rounded-lg p-3"
      @dragover.prevent
      @drop="onDrop($event, col.status)"
    >
      <h3 class="text-xs font-semibold text-gray-500 uppercase mb-3">{{ col.label }} ({{ col.tasks.length }})</h3>
      <div class="space-y-2">
        <div
          v-for="task in col.tasks"
          :key="task.id"
          class="bg-white rounded-md border border-gray-200 p-3 cursor-grab hover:shadow-sm transition-shadow"
          draggable="true"
          @dragstart="onDragStart($event, task)"
          @click="$emit('openTask', task)"
        >
          <p class="text-sm font-medium text-gray-900 line-clamp-2">{{ task.title }}</p>
          <p v-if="task.description" class="text-xs text-gray-500 mt-1 line-clamp-1">{{ task.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, TaskStatus } from '@/services/tasks.service'

const props = defineProps<{ tasks: Task[]; projectId: string }>()
const emit = defineEmits<{ openTask: [Task]; statusChanged: [id: string, status: TaskStatus] }>()

const COLS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Todo' },
  { status: 'in_progress', label: 'Em Progresso' },
  { status: 'done', label: 'Concluído' },
  { status: 'cancelled', label: 'Cancelado' },
]

const columns = computed(() =>
  COLS.map((col) => ({ ...col, tasks: props.tasks.filter((t) => t.status === col.status) })),
)

let draggingId: string | null = null

function onDragStart(e: DragEvent, task: Task) {
  draggingId = task.id
  e.dataTransfer?.setData('text/plain', task.id)
}

function onDrop(e: DragEvent, status: TaskStatus) {
  const id = e.dataTransfer?.getData('text/plain') ?? draggingId
  if (id) {
    const task = props.tasks.find((t) => t.id === id)
    if (task && task.status !== status) {
      emit('statusChanged', id, status)
    }
  }
  draggingId = null
}
</script>
