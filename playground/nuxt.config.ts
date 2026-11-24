import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: false },
  compatibilityDate: '2026-11-01',
  alias: {
    'nuxt-form-kit': fileURLToPath(new URL('../src/module.ts', import.meta.url)),
  },
  formKit: {
    locale: 'th',
  },
})
