<template>
  <div v-if="hasData" class="flex items-center gap-6">
    <div class="w-48 h-48 flex-shrink-0">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <div class="flex flex-col gap-2">
      <div v-for="(item, i) in items" :key="i" class="flex items-center gap-2 text-sm">
        <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: palette[i % palette.length] }" />
        <span class="text-gray-700">{{ item.label }}</span>
        <span class="text-gray-500 ml-auto pl-4">{{ item.percentage }}%</span>
      </div>
    </div>
  </div>
  <p v-else class="text-sm text-gray-500 text-center py-8">Nenhuma atividade registrada hoje</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const palette = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#EC4899', '#6366F1', '#14B8A6',
]

const props = defineProps<{
  items: { label: string; percentage: number; duration: number }[]
}>()

const hasData = computed(() => props.items.length > 0)

const chartData = computed(() => ({
  labels: props.items.map((i) => i.label),
  datasets: [{
    data: props.items.map((i) => i.duration),
    backgroundColor: props.items.map((_, i) => palette[i % palette.length]),
    borderWidth: 0,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  cutout: '70%',
}
</script>
