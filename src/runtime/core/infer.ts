import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FormSchema, FormSchemaInput, Primitive, Values } from './types'

type Depth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8]

/**
 * Walk a const field schema tree and collect field-like nodes.
 * Layout nodes (`section` / `row`) recurse into `children`; depth is capped.
 */
type FlattenFields<T, D extends number = 8> =
  [D] extends [never] ? never
    : T extends readonly (infer N)[]
      ? N extends { type: 'section' | 'row', children: infer C }
        ? FlattenFields<C, Depth[D]>
        : N extends { type: 'slot' }
          ? never
          : N extends { key: string, type: string }
            ? N
            : never
      : never

/** Default empty / submitted value type for a single field. */
export type InferFieldValue<F> =
  F extends { type: 'number' | 'money' } ? number | null
    : F extends { type: 'checkbox' | 'switch' } ? boolean
      : F extends { type: 'date-range' } ? { start: string | null, end: string | null }
        : F extends { type: 'checkbox-group' } ? Primitive[]
          : F extends { multiple: true } ? Primitive[]
            : F extends { type: 'date' } ? string | null
              : F extends { type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'textarea' | 'color' } ? string | null
                : F extends { type: 'select' | 'radio' | 'autocomplete' | 'tree-select' } ? Primitive
                  : unknown

type FieldValuesFromSchema<T> = {
  [F in FlattenFields<T> as F extends { key: infer K extends string } ? K : never]: InferFieldValue<F>
}

/**
 * Infer form value types from a field schema tree.
 * Falls back to `Values` (`Record<string, any>`) when keys cannot be narrowed
 * (e.g. a plain `FormSchema` annotation without `as const` / defineFormSchema).
 */
export type InferFormValuesFromFields<T> =
  [FormSchema] extends [T] ? Values
    : keyof FieldValuesFromSchema<T> extends never ? Values
      : string extends keyof FieldValuesFromSchema<T> ? Values
        : FieldValuesFromSchema<T>

type PreferStandardOutput<S> = S extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<S>
  : never

/**
 * Infer form values from:
 * 1. A Standard Schema (`~standard`) — uses `InferOutput`
 * 2. A config object with `schema` / `validate` — prefers that Standard Schema
 * 3. A config object with `fields` or a field schema array — maps field types
 * 4. Otherwise `Values` (`Record<string, any>`) for backward compatibility
 */
export type InferFormValues<T> =
  T extends { readonly '~standard': unknown } ? PreferStandardOutput<T & StandardSchemaV1>
    : T extends { schema: infer S extends StandardSchemaV1 } ? PreferStandardOutput<S>
      : T extends { validate: infer S extends StandardSchemaV1 } ? PreferStandardOutput<S>
        : T extends { fields: infer F } ? InferFormValuesFromFields<F>
          : T extends readonly unknown[] ? InferFormValuesFromFields<T>
            : Values

/** Resolve fields + form-level Standard Schema from FormSchema | FormSchemaConfig. */
export function resolveFormSchemaInput(input: FormSchemaInput | null | undefined): {
  fields: FormSchema
  validate: StandardSchemaV1 | undefined
} {
  if (!input) return { fields: [], validate: undefined }
  if (Array.isArray(input)) return { fields: input, validate: undefined }
  return {
    fields: input.fields ?? [],
    validate: input.validate ?? input.schema,
  }
}
