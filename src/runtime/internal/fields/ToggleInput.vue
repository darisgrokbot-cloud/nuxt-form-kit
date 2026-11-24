<script setup lang="ts">
import { computed } from 'vue'
import type { CheckboxField } from '../../core/types'
import type { FieldComponentProps } from '../types'

/** checkbox และ switch — label อยู่ข้างตัว input */
const props = defineProps<FieldComponentProps<CheckboxField>>()
const model = defineModel<boolean | null>()

const checked = computed({
  get: () => Boolean(model.value),
  set: (v: boolean) => {
    model.value = v
  },
})
</script>

<template>
  <USwitch
    v-if="field.type === 'switch'"
    v-model="checked"
    :label="label"
    :description="props.field.description"
    :disabled="disabled"
    v-bind="field.props"
  />
  <UCheckbox
    v-else
    v-model="checked"
    :label="label"
    :description="props.field.description"
    :disabled="disabled"
    v-bind="field.props"
  />
</template>
