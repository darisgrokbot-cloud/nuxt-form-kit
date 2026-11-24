import {
  addComponentsDir, addImports, addImportsDir, addPlugin, addTemplate, createResolver, defineNuxtModule,
} from '@nuxt/kit'
import type { Messages } from './runtime/core/types'

export interface ModuleOptions {
  /** prefix ของ component เช่น Fk → <FkForm> (default: 'Fk') */
  prefix: string
  /** ภาษาของข้อความ validation: 'th' | 'en' (default: 'th') */
  locale: string
  /** override ข้อความ validation ทั้งแอป */
  messages?: Partial<Messages>
  /**
   * ใส่ CSS ของ Tailwind + Nuxt UI ให้อัตโนมัติ (default: true)
   * ถ้าแอปมี main.css ที่ import tailwindcss / @nuxt/ui เองอยู่แล้ว ให้ตั้งเป็น false
   * แล้วเพิ่ม @source ตาม README
   */
  css: boolean
}

export type * from './runtime/core/types'
export type { FormKitInstance, UseFormKitOptions } from './runtime/composables/useFormKit'
export type { FieldOptionsState } from './runtime/composables/useFieldOptions'
export type { FieldComponentProps, FieldOptionsView } from './runtime/internal/types'
export type { FormKitRegistry, RegisterOptions } from './runtime/core/registry'
export type { PayloadOptions, SchemaIssue } from './runtime/core/schema'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-form-kit',
    configKey: 'formKit',
    compatibility: { nuxt: '>=4.0.0' },
  },
  defaults: {
    prefix: 'Fk',
    locale: 'th',
    css: true,
  },
  moduleDependencies: {
    '@nuxt/ui': {},
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = resolve('./runtime')

    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.formKit = {
      locale: options.locale,
      messages: options.messages ?? {},
      ...(publicConfig.formKit as object | undefined),
    }

    addPlugin(resolve('./runtime/plugin'))

    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: options.prefix,
      pathPrefix: false,
    })

    addImportsDir(resolve('./runtime/composables'))
    addImports([
      { name: 'defineFormSchema', from: resolve('./runtime/core/index') },
    ])

    nuxt.options.build.transpile.push(runtimeDir)

    if (options.css) {
      const toPosix = (p: string) => p.replaceAll('\\', '/')
      const template = addTemplate({
        filename: 'form-kit.css',
        write: true,
        getContents: () => [
          '@import "tailwindcss";',
          '@import "@nuxt/ui";',
          // ให้ Tailwind scan class ที่ใช้ใน component ของ form-kit
          // ต้องเป็น absolute path — Tailwind ใน Nuxt resolve @source จาก root ของแอป ไม่ใช่จากไฟล์ CSS
          `@source "${toPosix(runtimeDir)}";`,
          '',
        ].join('\n'),
      })
      nuxt.options.css.unshift(template.dst)
    }
  },
})
