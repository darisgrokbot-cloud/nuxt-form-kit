<script setup lang="ts">
import { computed } from 'vue'
import type { PinField } from '../../core/types'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<PinField>>()
const model = defineModel<string | null>()

const length = computed(() => props.field.length ?? 6)
const inputType = computed(() => props.field.inputType ?? 'number')

const cells = computed({
  get: () => {
    const raw = typeof model.value === 'string' ? model.value : ''
    return Array.from({ length: length.value }, (_, i) => raw[i] ?? '')
  },
  set: (v: Array<string | number | undefined> | undefined) => {
    if (!Array.isArray(v)) {
      model.value = null
      return
    }
    const joined = v.map(c => (c == null ? '' : String(c))).join('')
    model.value = joined === '' ? null : joined
  },
})
</script>

<template>
  <UPinInput
    v-model="cells as any"
    :length="length"
    :type="inputType"
    :mask="field.mask"
    :otp="field.otp"
    :disabled="disabled"
    :placeholder="placeholder"
    data-sf-pin-input
    v-bind="field.props"
  />
</template>
