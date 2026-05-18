<template>
  <BaseModal :open="open" :title="title" size="sm" @close="$emit('cancel')">
    <p class="text-sm text-gray-600">{{ message }}</p>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('cancel')">Cancelar</BaseButton>
      <BaseButton :variant="confirmVariant" @click="$emit('confirm')">{{ confirmLabel }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}>(), {
  confirmLabel: 'Confirmar',
  confirmVariant: 'danger',
})

defineEmits<{ confirm: []; cancel: [] }>()
</script>
