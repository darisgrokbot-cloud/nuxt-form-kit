<script setup lang="ts">
import type { TextareaField } from '../../core/types'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<TextareaField>>()
const model = defineModel<string | null>()

function onBlur() {
  if (props.field.trim === false || typeof model.value !== 'string') return
  const trimmed = model.value.trim()
  if (trimmed !== model.value) model.value = trimmed
}
</script>

<template>
  <UTextarea
    v-model="model as string"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="field.rows ?? 3"
    :autoresize="field.autoresize ?? false"
    :maxlength="field.rules?.maxLength"
    class="w-full"
    v-bind="field.props"
    @blur="onBlur"
  />
</template>
