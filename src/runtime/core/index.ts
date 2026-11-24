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

import type { FormSchema } from './types'

/** helper สำหรับ type inference / autocomplete เวลาเขียน schema ใน TS */
export function defineFormSchema<const T extends FormSchema>(schema: T): T {
  return schema
}
