<template>
  <div class="relative w-full cursor-pointer" style="height: 220px" title="Clique em uma barra para ver detalhes">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string
}

const props = defineProps<{
  labels: string[]
  datasets: ChartDataset[]
}>()

const emit = defineEmits<{ 'segment-click': [index: number] }>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((d) => ({
    ...d,
    backgroundColor: d.backgroundColor ?? '#3B82F6',
    borderRadius: 4,
    borderSkipped: false,
  })),
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  onClick: (_event: unknown, elements: Array<{ index: number }>) => {
    if (elements.length > 0) emit('segment-click', elements[0].index)
  },
  scales: {
    y: {
      ticks: {
        callback: (v: unknown) => {
          const n = Number(v)
          return n >= 3600 ? `${Math.round(n / 3600)}h` : `${Math.round(n / 60)}m`
        },
      },
      grid: { color: '#F3F4F6' },
    },
    x: { grid: { display: false } },
  },
}))
</script>
