<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, useSlots, watch } from 'vue'
import type { SchemaFormInstance } from '../composables/useSchemaForm'
import { useSchemaForm } from '../composables/useSchemaForm'
import type { FieldError, FormMode, FormSchema, Messages, RuleFn, ServerError, SourceFn, Values } from '../core/types'
import { SCHEMA_FORM_KEY, SCHEMA_FORM_SLOTS } from '../internal/context'
import { focusFirstError } from '../internal/focusFirstError'
import NodeRenderer from '../internal/NodeRenderer.vue'

type ValidateOn = 'input' | 'change' | 'blur'

const props = withDefaults(defineProps<{
  /** schema ของฟอร์ม (ไม่ต้องส่งถ้าส่ง form) */
  schema?: FormSchema
  /** instance จาก useSchemaForm() — ใช้เมื่อต้องการควบคุมจากภายนอก */
  form?: SchemaFormInstance
  mode?: FormMode
  disabled?: boolean
  serverErrors?: ServerError[]
  locale?: string
  messages?: Partial<Messages>
  sources?: Record<string, SourceFn>
  rules?: Record<string, RuleFn>
  /** ตรวจเมื่อไหร่ (default: blur + change) */
  validateOn?: ValidateOn[]
  /** แสดงปุ่ม submit อัตโนมัติ */
  submitLabel?: string
  /** แสดงปุ่ม reset อัตโนมัติ */
  resetLabel?: string
  /** แปลงค่าก่อนส่ง submit */
  omitHidden?: boolean
  /** โฟกัส + เลื่อนไปฟิลด์ error แรกเมื่อ validation ไม่ผ่าน (default: true) */
  focusOnError?: boolean
}>(), {
  schema: undefined,
  form: undefined,
  mode: 'edit',
  serverErrors: undefined,
  locale: undefined,
  messages: undefined,
  sources: undefined,
  rules: undefined,
  validateOn: () => ['blur', 'change'],
  submitLabel: undefined,
  resetLabel: undefined,
  focusOnError: true,
})

const model = defineModel<Values>({ default: () => ({}) })

const emit = defineEmits<{
  submit: [payload: Values, form: SchemaFormInstance]
  error: [errors: FieldError[]]
}>()

const form: SchemaFormInstance = props.form ?? useSchemaForm(() => props.schema ?? [], {
  values: model,
  deferDefaults: true,
  mode: () => props.mode,
  disabled: () => props.disabled,
  serverErrors: () => props.serverErrors,
  locale: () => props.locale,
  messages: props.messages,
  sources: props.sources,
  rules: props.rules,
})

const slots = useSlots()
provide(SCHEMA_FORM_KEY, form)
provide(SCHEMA_FORM_SLOTS, slots)

const uForm = ref()
watch(uForm, (instance) => {
  form._bindForm(instance ?? null)
}, { immediate: true })
onBeforeUnmount(() => form._bindForm(null))

const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    emit('submit', form.getPayload({ omitHidden: props.omitHidden }), form)
  }
  finally {
    submitting.value = false
  }
}

function onError(event: { errors: { id?: string, name?: string, message: string }[] }) {
  emit('error', event.errors.map(e => ({ name: e.name ?? '', message: e.message })))
  focusFirstError(event.errors, props.focusOnError)
}

async function submit() {
  await uForm.value?.submit()
}

const actionProps = computed(() => ({
  submit,
  reset: () => form.reset(),
  isValid: form.isValid.value,
  isDirty: form.isDirty.value,
  submitting: submitting.value,
  mode: form.mode.value,
  form,
}))

defineExpose({
  form,
  submit,
  validate: form.validate,
  reset: form.reset,
  setErrors: form.setErrors,
  getPayload: form.getPayload,
})
</script>

<template>
  <UForm
    ref="uForm"
    :state="form.values.value"
    :validate="form.runValidation"
    :validate-on="validateOn"
    :disabled="disabled"
    class="sf-form"
    @submit="onSubmit"
    @error="onError"
  >
    <slot name="header" v-bind="actionProps" />
    <div class="grid grid-cols-12 gap-x-4 gap-y-4">
      <NodeRenderer :nodes="form.schema.value" />
    </div>
    <slot v-bind="actionProps" />
    <div
      v-if="!form.isView.value && (submitLabel || resetLabel || $slots.actions)"
      class="mt-6 flex flex-wrap items-center justify-end gap-2"
    >
      <slot name="actions" v-bind="actionProps">
        <UButton
          v-if="resetLabel"
          type="button"
          color="neutral"
          variant="outline"
          :label="resetLabel"
          :disabled="disabled"
          @click="form.reset()"
        />
        <UButton
          v-if="submitLabel"
          type="submit"
          :label="submitLabel"
          :loading="submitting"
          :disabled="disabled"
        />
      </slot>
    </div>
  </UForm>
</template>
