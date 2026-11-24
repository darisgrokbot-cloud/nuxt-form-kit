<script setup lang="ts">
import { computed } from 'vue'
import type { CheckboxGroupField, Primitive, RadioField } from '../../core/types'
import type { FieldComponentProps } from '../types'

/** radio และ checkbox-group */
const props = defineProps<FieldComponentProps<RadioField | CheckboxGroupField>>()
const model = defineModel<Primitive | Primitive[] | null>()

const items = computed(() => props.options?.items ?? [])
const orientation = computed(() => props.field.orientation ?? 'horizontal')

const groupModel = computed({
  get: () => (Array.isArray(model.value) ? model.value : []),
  set: (v: Primitive[]) => {
    model.value = v
  },
})
</script>

<template>
  <div>
    <URadioGroup
      v-if="field.type === 'radio'"
      v-model="model as any"
      :items="items as any[]"
      value-key="value"
      label-key="label"
      description-key="description"
      :orientation="orientation"
      :disabled="disabled"
      v-bind="field.props"
    />
    <UCheckboxGroup
      v-else
      v-model="groupModel as any"
      :items="items as any[]"
      value-key="value"
      label-key="label"
      description-key="description"
      :orientation="orientation"
      :disabled="disabled"
      v-bind="field.props"
    />
    <p v-if="options?.loading" class="text-sm text-muted">
      {{ messages.loading }}
    </p>
    <p v-else-if="options?.error" class="text-sm text-error">
      {{ options.error }}
    </p>
  </div>
</template>
