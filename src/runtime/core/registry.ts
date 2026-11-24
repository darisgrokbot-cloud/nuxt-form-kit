import type { Component } from 'vue'
import type { RuleFn, SourceFn } from './types'

export interface FormKitRegistry {
  sources: Record<string, SourceFn>
  rules: Record<string, RuleFn>
  /** field type เพิ่มเติม: ชื่อ type → component */
  fields: Record<string, Component>
  /** แปลข้อความ label/placeholder/hint (เช่นส่ง i18n key แล้วแปลด้วย $t) */
  translate?: (text: string) => string
}

export interface RegisterOptions {
  sources?: Record<string, SourceFn>
  rules?: Record<string, RuleFn>
  fields?: Record<string, Component>
  translate?: (text: string) => string
}

export function createRegistry(initial: RegisterOptions = {}) {
  const registry: FormKitRegistry = {
    sources: { ...initial.sources },
    rules: { ...initial.rules },
    fields: { ...initial.fields },
    translate: initial.translate,
  }

  function register(opts: RegisterOptions) {
    Object.assign(registry.sources, opts.sources)
    Object.assign(registry.rules, opts.rules)
    Object.assign(registry.fields, opts.fields)
    if (opts.translate) registry.translate = opts.translate
  }

  return Object.assign(registry, { register })
}

export type FormKitRegistryInstance = ReturnType<typeof createRegistry>
