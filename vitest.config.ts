import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

const playgroundDir = fileURLToPath(new URL('./playground', import.meta.url))
const nuxtImportsStub = fileURLToPath(new URL('./test/stubs/nuxt-imports.ts', import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '#imports': nuxtImportsStub,
          },
        },
        test: {
          name: 'core',
          include: ['test/core/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'components',
          include: ['test/components/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              rootDir: playgroundDir,
              domEnvironment: 'happy-dom' as const,
              overrides: {
                // Keep component tests lean: no app pages / heavy CSS needed.
                schemaForm: {
                  locale: 'en',
                  css: false,
                },
              },
            },
          },
        },
      }),
    ],
  },
})
