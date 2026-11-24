<script setup lang="ts">
import type { FieldComponentProps } from 'nuxt-form-kit'

// ตัวอย่าง field type ที่ลงทะเบียนเอง — ได้ props มาตรฐานเหมือน field ในตัว
const props = defineProps<FieldComponentProps>()
const model = defineModel<number | null>()
const max = computed(() => Number((props.field as { max?: number }).max ?? 5))
</script>

<template>
  <div class="flex gap-1" role="radiogroup" :aria-label="label">
    <button
      v-for="n in max"
      :key="n"
      type="button"
      role="radio"
      :aria-checked="model === n"
      :aria-label="`${n}`"
      :disabled="disabled"
      class="text-2xl leading-none disabled:opacity-50"
      :class="(model ?? 0) >= n ? 'text-warning' : 'text-dimmed'"
      :data-star="n"
      @click="model = n"
    >
      ★
    </button>
  </div>
</template>
