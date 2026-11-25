import {
  addComponentsDir, addImports, addImportsDir, addPlugin, addTemplate, createResolver, defineNuxtModule,
} from '@nuxt/kit'
import { defu } from 'defu'
import type { GridResponsive, Messages } from './runtime/core/types'

export interface ModuleOptions {
  /** Component prefix, e.g. Sf → <SfForm> (default: 'Sf') */
  prefix: string
  /** Validation message locale: 'th' | 'en' (default: 'th') */
  locale: string
  /** Override validation messages app-wide */
  messages?: Partial<Messages>
  /**
   * Inject Tailwind + Nuxt UI CSS automatically (default: true).
   * Set false if the app already imports tailwindcss / @nuxt/ui, then add @source
   * for this package as described in the README.
   */
  css: boolean
  /**
   * 12-column grid responsive behavior (default: viewport).
   * Use `container` when forms sit in narrow panels on wide screens.
   * Overridable per form via the `responsive` prop on `<SfForm>`.
   */
  grid: {
    responsive: GridResponsive
  }
}

export type * from './runtime/core/types'
export type {
  SchemaFormInstance, UseSchemaFormOptions,
} from './runtime/composables/useSchemaForm'
export type { FieldOptionsState } from './runtime/composables/useFieldOptions'
export type { FieldComponentProps, FieldOptionsView } from './runtime/internal/types'
export type {
  SchemaFormRegistry, RegisterOptions,
} from './runtime/core/registry'
export type { PayloadOptions, SchemaIssue } from './runtime/core/schema'

const defaults: ModuleOptions = {
  prefix: 'Sf',
  locale: 'th',
  css: true,
  grid: {
    responsive: 'viewport',
  },
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@stackcloud/schema-form',
    configKey: 'schemaForm',
    compatibility: { nuxt: '>=4.0.0' },
  },
  defaults,
  moduleDependencies: {
    '@nuxt/ui': {},
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = resolve('./runtime')

    const nuxtOpts = nuxt.options as typeof nuxt.options & {
      schemaForm?: Partial<ModuleOptions>
    }

    const resolved = defu(nuxtOpts.schemaForm, options, defaults) as ModuleOptions

    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    const formPublic = defu(
      publicConfig.schemaForm as object | undefined,
      {
        locale: resolved.locale,
        messages: resolved.messages ?? {},
        grid: {
          responsive: resolved.grid.responsive,
        },
      },
    )
    publicConfig.schemaForm = formPublic

    addPlugin(resolve('./runtime/plugin'))

    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: resolved.prefix,
      pathPrefix: false,
    })

    addImportsDir(resolve('./runtime/composables'))
    addImports([
      { name: 'defineFormSchema', from: resolve('./runtime/core/index') },
    ])

    nuxt.options.build.transpile.push(runtimeDir)

    if (resolved.css) {
      const toPosix = (p: string) => p.replaceAll('\\', '/')
      const template = addTemplate({
        filename: 'schema-form.css',
        write: true,
        getContents: () => [
          '@import "tailwindcss";',
          '@import "@nuxt/ui";',
          `@source "${toPosix(runtimeDir)}";`,
          '',
        ].join('\n'),
      })
      nuxt.options.css.unshift(template.dst)
    }
  },
})
