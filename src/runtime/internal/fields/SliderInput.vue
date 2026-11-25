<script setup lang="ts">
import { computed } from 'vue'
import type { SliderField } from '../../core/types'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<SliderField>>()
const model = defineModel<number | [number, number] | null>()

const min = computed(() => props.field.min ?? 0)
const max = computed(() => props.field.max ?? 100)
const step = computed(() => props.field.step ?? 1)
const range = computed(() => Boolean(props.field.range))
const showValue = computed(() => props.field.showValue ?? false)

const value = computed({
  get: () => {
    if (range.value) {
      if (Array.isArray(model.value) && model.value.length >= 2) {
        return [Number(model.value[0]), Number(model.value[1])] as [number, number]
      }
      return [min.value, max.value] as [number, number]
    }
    return typeof model.value === 'number' ? model.value : min.value
  },
  set: (v: number | number[] | undefined) => {
    if (range.value) {
      if (Array.isArray(v) && v.length >= 2) {
        model.value = [Number(v[0]), Number(v[1])]
      }
      return
    }
    model.value = typeof v === 'number' && !Number.isNaN(v) ? v : null
  },
})

const display = computed(() => {
  if (!showValue.value) return null
  if (range.value && Array.isArray(value.value)) {
    return `${value.value[0]} – ${value.value[1]}`
  }
  return String(value.value)
})
</script>

<template>
  <div class="flex w-full flex-col gap-1.5" data-sf-slider-input>
    <USlider
      v-model="value as any"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="w-full"
      v-bind="field.props"
    />
    <p
      v-if="display != null"
      class="text-xs text-muted tabular-nums"
      data-sf-slider-value
      aria-live="polite"
    >
      {{ display }}
    </p>
  </div>
</template>
