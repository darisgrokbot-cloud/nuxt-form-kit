<script setup lang="ts">
import { computed } from 'vue'
import type { NumberField } from '../../core/types'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<NumberField>>()
const model = defineModel<number | null>()

const isMoney = computed(() => props.field.type === 'money')

const formatOptions = computed<Intl.NumberFormatOptions>(() => props.field.format
  ?? (isMoney.value ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 10 }))

// UInputNumber คืน undefined/NaN เมื่อลบค่า → เก็บเป็น null
const value = computed<number | undefined>({
  get: () => (typeof model.value === 'number' ? model.value : undefined),
  set: (v) => {
    model.value = typeof v === 'number' && !Number.isNaN(v) ? v : null
  },
})
</script>

<template>
  <UInputNumber
    v-model="value"
    :placeholder="placeholder"
    :disabled="disabled"
    :min="field.min ?? field.rules?.min"
    :max="field.max ?? field.rules?.max"
    :step="field.step ?? (isMoney ? 0.01 : 1)"
    :format-options="formatOptions"
    :locale="locale === 'th' ? 'th-TH' : 'en-US'"
    class="w-full"
    v-bind="field.props"
  />
</template>
