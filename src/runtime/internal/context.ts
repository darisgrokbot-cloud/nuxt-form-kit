import { inject } from 'vue'
import type { InjectionKey, Slots } from 'vue'
import type { SchemaFormInstance } from '../composables/useSchemaForm'

export const SCHEMA_FORM_KEY: InjectionKey<SchemaFormInstance> = Symbol('schema-form')
export const SCHEMA_FORM_SLOTS: InjectionKey<Slots> = Symbol('schema-form-slots')

/** @deprecated Use `SCHEMA_FORM_KEY` instead. */
export const FORM_KIT_KEY = SCHEMA_FORM_KEY
/** @deprecated Use `SCHEMA_FORM_SLOTS` instead. */
export const FORM_KIT_SLOTS = SCHEMA_FORM_SLOTS

export function useFormContext(): SchemaFormInstance {
  const form = inject(SCHEMA_FORM_KEY)
  if (!form) throw new Error('[schema-form] field components must be used inside <SfForm>')
  return form
}

export function useFormSlots(): Slots {
  return inject(SCHEMA_FORM_SLOTS, {})
}
