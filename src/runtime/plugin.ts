import { defineNuxtPlugin } from '#imports'
import { createRegistry } from './core/registry'

export default defineNuxtPlugin({
  name: 'schema-form:registry',
  enforce: 'pre',
  setup() {
    const registry = createRegistry()
    return {
      provide: {
        schemaForm: registry,
        /** @deprecated Use `$schemaForm` instead. */
        formKit: registry,
      },
    }
  },
})
