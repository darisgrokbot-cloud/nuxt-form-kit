<script setup lang="ts">
import { computed, reactive, toRef } from 'vue'
import type { Component } from 'vue'
import { useFieldOptions } from '../composables/useFieldOptions'
import { useTreeFieldOptions } from '../composables/useTreeFieldOptions'
import type { FieldSchema } from '../core/types'
import { useFormContext, useFormSlots } from './context'
import FieldDisplay from './FieldDisplay.vue'
import SlotOutlet from './SlotOutlet'
import type { BuiltinFieldType } from '../core/types'
import AutocompleteInput from './fields/AutocompleteInput.vue'
import ChoiceInput from './fields/ChoiceInput.vue'
import DateInput from './fields/DateInput.vue'
import NumberInput from './fields/NumberInput.vue'
import SelectInput from './fields/SelectInput.vue'
import TextareaInput from './fields/TextareaInput.vue'
import TextInput from './fields/TextInput.vue'
import ToggleInput from './fields/ToggleInput.vue'
import TreeSelectInput from './fields/TreeSelectInput.vue'

const props = defineProps<{ field: FieldSchema }>()

const form = useFormContext()
const slots = useFormSlots()

const BUILTIN: Record<BuiltinFieldType, Component> = {
  'text': TextInput,
  'email': TextInput,
  'password': TextInput,
  'tel': TextInput,
  'url': TextInput,
  'textarea': TextareaInput,
  'number': NumberInput,
  'money': NumberInput,
  'select': SelectInput,
  'autocomplete': AutocompleteInput,
  'radio': ChoiceInput,
  'checkbox-group': ChoiceInput,
  'checkbox': ToggleInput,
  'switch': ToggleInput,
  'date': DateInput,
  'date-range': DateInput,
  'tree-select': TreeSelectInput,
}

const key = computed(() => props.field.key)
const component = computed(() => form.registry.fields[props.field.type] ?? BUILTIN[props.field.type as BuiltinFieldType])
const hasOptions = computed(() => Boolean((props.field as { options?: unknown }).options))
const options = hasOptions.value
  ? reactive(
      props.field.type === 'tree-select'
        ? useTreeFieldOptions(toRef(props, 'field'), form)
        : useFieldOptions(toRef(props, 'field'), form),
    )
  : undefined

const isToggle = computed(() => props.field.type === 'checkbox' || props.field.type === 'switch')
const readonly = computed(() => form.isReadonly(key.value))
const disabled = computed(() => form.isDisabled(key.value))
const required = computed(() => form.isRequired(key.value))

const value = computed({
  get: () => form.state.value[key.value],
  set: v => form.setValue(key.value, v),
})

const label = computed(() => form.t(props.field.label))
const placeholder = computed(() => form.t(props.field.placeholder))

const counter = computed(() => {
  const f = props.field as { counter?: boolean }
  const max = props.field.rules?.maxLength
  if (!f.counter || readonly.value) return undefined
  const len = typeof value.value === 'string' ? [...value.value].length : 0
  return max ? `${len}/${max}` : String(len)
})

const hint = computed(() => counter.value ?? form.t(props.field.hint))

const fieldSlot = computed(() => slots[`field:${key.value}`])
</script>

<template>
  <UFormField
    :name="key"
    :label="isToggle && !readonly ? undefined : label"
    :description="isToggle && !readonly ? undefined : form.t(field.description)"
    :hint="hint"
    :help="readonly ? undefined : form.t(field.help)"
    :required="required && !readonly"
    :error="options?.error ?? undefined"
    :data-fk-field="key"
    :data-fk-type="field.type"
  >
    <SlotOutlet
      v-if="fieldSlot"
      :slot-fn="fieldSlot"
      :slot-props="{ field, value, setValue: (v: unknown) => (value = v), disabled, readonly, options }"
    />
    <FieldDisplay
      v-else-if="readonly"
      :field="field"
      :value="value"
      :messages="form.messages.value"
      :locale="form.locale.value"
      :options="options"
    />
    <component
      :is="component"
      v-else-if="component"
      v-model="value"
      :field="field"
      :disabled="disabled"
      :placeholder="placeholder"
      :label="label"
      :messages="form.messages.value"
      :options="options"
      :values="form.state.value"
      :locale="form.locale.value"
    />
    <p v-else class="text-sm text-error">
      [schema-form] unknown field type "{{ field.type }}"
    </p>
  </UFormField>
</template>
