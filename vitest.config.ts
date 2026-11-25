import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#imports': fileURLToPath(new URL('./test/stubs/nuxt-imports.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/core/**/*.test.ts'],
    environment: 'node',
  },
})
