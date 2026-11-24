import type { UnwrapNestedRefs } from 'vue'
import type { FieldOptionsState } from '../composables/useFieldOptions'
import type { FieldSchema, Messages, Values } from '../core/types'

export type FieldOptionsView = UnwrapNestedRefs<FieldOptionsState>

/**
 * props ที่ทุก field component ได้รับ (รวม field type ที่ลงทะเบียนเอง)
 * ค่าใช้ v-model (modelValue / update:modelValue)
 */
export interface FieldComponentProps<F extends FieldSchema = FieldSchema> {
  field: F
  disabled: boolean
  placeholder?: string
  label?: string
  messages: Messages
  /** มีเฉพาะฟิลด์ที่มี options */
  options?: FieldOptionsView
  values: Values
  locale: string
}
