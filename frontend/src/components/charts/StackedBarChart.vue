<template>
  <div class="relative w-full" style="height: 240px">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, type TooltipItem } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Dataset {
  label: string
  data: number[]
  backgroundColor: string
}

const props = defineProps<{
  labels: string[]
  datasets: Dataset[]
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((d) => ({
    ...d,
    borderRadius: 2,
    borderSkipped: false,
  })),
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12 } },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<'bar'>) => {
          const secs = Number(ctx.raw)
          const h = Math.floor(secs / 3600)
          const m = Math.floor((secs % 3600) / 60)
          const dur = h > 0 ? `${h}h ${m}min` : `${m}min`
          return ` ${ctx.dataset.label ?? ''}: ${dur}`
        },
      },
    },
  },
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: {
      stacked: true,
      ticks: {
        callback: (v: unknown) => {
          const n = Number(v)
          return n >= 3600 ? `${Math.round(n / 3600)}h` : `${Math.round(n / 60)}m`
        },
      },
      grid: { color: '#F3F4F6' },
    },
  },
}
</script>
