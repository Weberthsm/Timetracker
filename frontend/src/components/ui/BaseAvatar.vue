<template>
  <div :class="['rounded-full overflow-hidden flex items-center justify-center flex-shrink-0', sizeClass]">
    <img v-if="src" :src="src" :alt="name" class="w-full h-full object-cover" />
    <span v-else :class="['font-semibold text-white select-none', textSize]" :style="{ backgroundColor: bgColor }">
      {{ initials }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
}>(), { src: null, size: 'md' })

const sizeClass = computed(() => ({ sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }[props.size]))
const textSize = computed(() => ({ sm: 'text-xs', md: 'text-sm', lg: 'text-lg' }[props.size]))

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
})

const bgColor = computed(() => {
  let hash = 0
  for (const ch of props.name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 45%)`
})
</script>
