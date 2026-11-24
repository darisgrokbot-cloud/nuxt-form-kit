import { useNuxtApp } from '#imports'
import type { FormKitRegistryInstance } from '../core/registry'

/**
 * registry กลางของแอป — ใช้ลงทะเบียน source / rule / field type / translate
 *
 * @example
 * // app/plugins/form-kit.ts
 * export default defineNuxtPlugin(() => {
 *   useFormKitRegistry().register({
 *     sources: { departments: ({ search }) => $fetch('/api/departments', { query: { search } }) },
 *   })
 * })
 */
export function useFormKitRegistry(): FormKitRegistryInstance {
  return (useNuxtApp() as unknown as { $formKit: FormKitRegistryInstance }).$formKit
}
