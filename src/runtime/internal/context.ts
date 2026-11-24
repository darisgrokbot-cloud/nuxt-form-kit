import { inject } from 'vue'
import type { InjectionKey, Slots } from 'vue'
import type { FormKitInstance } from '../composables/useFormKit'

export const FORM_KIT_KEY: InjectionKey<FormKitInstance> = Symbol('form-kit')
export const FORM_KIT_SLOTS: InjectionKey<Slots> = Symbol('form-kit-slots')

export function useFormContext(): FormKitInstance {
  const form = inject(FORM_KIT_KEY)
  if (!form) throw new Error('[form-kit] field components must be used inside <FkForm>')
  return form
}

export function useFormSlots(): Slots {
  return inject(FORM_KIT_SLOTS, {} as Slots)
}
