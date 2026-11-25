export * from './types'
export * from './utils'
export * from './conditions'
export * from './template'
export * from './rules'
export * from './options'
export * from './tree'
export * from './schema'
export * from './layout'
export * from './messages'
export * from './registry'
export * from './builtinTypes'
export * from './standard-schema'
export * from './infer'

import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FormSchema, FormSchemaInput } from './types'

/** helper สำหรับ type inference / autocomplete เวลาเขียน schema ใน TS */
export function defineFormSchema<const T extends FormSchema>(schema: T): T
export function defineFormSchema<
  const T extends {
    fields: FormSchema
    schema?: StandardSchemaV1
    validate?: StandardSchemaV1
  },
>(config: T): T
export function defineFormSchema(schema: FormSchemaInput): FormSchemaInput {
  return schema
}
