<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors',
        error
          ? 'border-red-300 focus:ring-red-500 bg-red-50'
          : 'border-gray-300 focus:ring-blue-500',
        disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  error?: string
  hint?: string
  type?: string
  placeholder?: string
  modelValue?: string
  disabled?: boolean
}>(), {
  type: 'text',
  disabled: false,
})

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
