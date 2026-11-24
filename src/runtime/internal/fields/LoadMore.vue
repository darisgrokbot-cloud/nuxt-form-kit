<script setup lang="ts">
defineProps<{ label: string, loading?: boolean }>()
defineEmits<{ load: [] }>()
</script>

<template>
  <div class="p-1 border-t border-default">
    <UButton
      block
      size="xs"
      color="neutral"
      variant="ghost"
      :loading="loading"
      :label="label"
      @mousedown.prevent
      @click="$emit('load')"
    />
  </div>
</template>
