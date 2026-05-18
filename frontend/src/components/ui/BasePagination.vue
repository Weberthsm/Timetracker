<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between gap-2">
    <span class="text-xs text-gray-500">Página {{ currentPage }} de {{ totalPages }}</span>
    <div class="flex items-center gap-1">
      <button
        :disabled="currentPage <= 1"
        class="px-2 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="emit('page-change', currentPage - 1)"
      >‹ Anterior</button>

      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '...'" class="px-1 text-gray-400 text-sm">…</span>
        <button
          v-else
          :class="[
            'w-8 h-8 text-sm rounded-md border transition-colors',
            p === currentPage
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50',
          ]"
          @click="emit('page-change', p as number)"
        >{{ p }}</button>
      </template>

      <button
        :disabled="currentPage >= totalPages"
        class="px-2 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="emit('page-change', currentPage + 1)"
      >Próximo ›</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ currentPage: number; totalPages: number }>()
const emit = defineEmits<{ 'page-change': [page: number] }>()

const visiblePages = computed(() => {
  const total = props.totalPages
  const cur = props.currentPage
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})
</script>
