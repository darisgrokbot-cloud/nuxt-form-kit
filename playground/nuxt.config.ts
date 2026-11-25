import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: false },
  compatibilityDate: '2026-11-01',
  alias: {
    '@stackcloud/schema-form': fileURLToPath(new URL('../src/module.ts', import.meta.url)),
  },
  schemaForm: {
    locale: 'th',
  },
  // Include component tests in the Nuxt TS context (vitest nuxt environment).
  typescript: {
    tsConfig: {
      include: ['../test/components/**/*'],
    },
  },
})
