<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
    <div class="mb-8 flex items-center gap-2">
      <span class="text-2xl font-bold text-blue-600">TimeTracker</span>
    </div>
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>
