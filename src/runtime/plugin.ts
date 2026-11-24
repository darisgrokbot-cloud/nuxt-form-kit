import { defineNuxtPlugin } from '#imports'
import { createRegistry } from './core/registry'

export default defineNuxtPlugin({
  name: 'form-kit:registry',
  enforce: 'pre',
  setup() {
    return {
      provide: {
        formKit: createRegistry(),
      },
    }
  },
})
