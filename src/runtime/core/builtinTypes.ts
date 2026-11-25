import type { BuiltinFieldType } from './types'

/** Built-in field types rendered by FieldRenderer (without custom registry fields). */
export const BUILTIN_FIELD_TYPES: readonly BuiltinFieldType[] = [
  'text',
  'email',
  'password',
  'tel',
  'url',
  'textarea',
  'number',
  'money',
  'select',
  'autocomplete',
  'radio',
  'checkbox-group',
  'checkbox',
  'switch',
  'date',
  'date-range',
  'tree-select',
]

/** All types known to the form: builtins + custom registry field components. */
export function knownFieldTypes(registryFields?: Record<string, unknown>): Set<string> {
  return new Set<string>([...BUILTIN_FIELD_TYPES, ...Object.keys(registryFields ?? {})])
}
