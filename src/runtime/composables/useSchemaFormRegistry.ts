import { useNuxtApp } from '#imports'
import type { SchemaFormRegistryInstance } from '../core/registry'

/**
 * Central app registry — register sources / rules / field types / translate.
 *
 * @example
 * // app/plugins/schema-form.ts
 * export default defineNuxtPlugin(() => {
 *   useSchemaFormRegistry().register({
 *     sources: { teams: ({ search }) => $fetch('/api/teams', { query: { search } }) },
 *   })
 * })
 */
export function useSchemaFormRegistry(): SchemaFormRegistryInstance {
  const app = useNuxtApp() as unknown as {
    $schemaForm?: SchemaFormRegistryInstance
    $formKit?: SchemaFormRegistryInstance
  }
  const registry = app.$schemaForm ?? app.$formKit
  if (!registry) {
    throw new Error('[schema-form] registry plugin is not installed')
  }
  return registry
}

/** @deprecated Use `useSchemaFormRegistry` instead. */
export const useFormKitRegistry = useSchemaFormRegistry
