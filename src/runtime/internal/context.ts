import { inject, ref } from 'vue'
import type { ComputedRef, InjectionKey, Ref, Slots } from 'vue'
import type { SchemaFormInstance } from '../composables/useSchemaForm'
import type { GridResponsive } from '../core/types'

export const SCHEMA_FORM_KEY: InjectionKey<SchemaFormInstance> = Symbol('schema-form')
export const SCHEMA_FORM_SLOTS: InjectionKey<Slots> = Symbol('schema-form-slots')
export const SCHEMA_FORM_GRID_KEY: InjectionKey<Ref<GridResponsive> | ComputedRef<GridResponsive>> = Symbol('schema-form-grid')

const DEFAULT_GRID_RESPONSIVE = ref<GridResponsive>('viewport')

export function useFormContext(): SchemaFormInstance {
  const form = inject(SCHEMA_FORM_KEY)
  if (!form) throw new Error('[schema-form] field components must be used inside <SfForm>')
  return form
}

export function useFormSlots(): Slots {
  return inject(SCHEMA_FORM_SLOTS, {})
}

/** Resolved grid responsive mode for the nearest SfForm (default viewport). */
export function useFormGridResponsive(): Ref<GridResponsive> | ComputedRef<GridResponsive> {
  return inject(SCHEMA_FORM_GRID_KEY, DEFAULT_GRID_RESPONSIVE)
}
