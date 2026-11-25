import { describe, expect, it } from 'vitest'
import {
  useFormKit,
  useSchemaForm,
} from '../../src/runtime/composables/useSchemaForm'
import type {
  FormKitInstance,
  SchemaFormInstance,
} from '../../src/runtime/composables/useSchemaForm'
import {
  useFormKitRegistry,
  useSchemaFormRegistry,
} from '../../src/runtime/composables/useSchemaFormRegistry'
import {
  createRegistry,
} from '../../src/runtime/core/registry'
import type {
  FormKitRegistry,
  FormKitRegistryInstance,
  SchemaFormRegistry,
  SchemaFormRegistryInstance,
} from '../../src/runtime/core/registry'
import plugin from '../../src/runtime/plugin'

describe('deprecated API aliases', () => {
  it('useFormKit is the same function as useSchemaForm', () => {
    expect(useFormKit).toBe(useSchemaForm)
  })

  it('useFormKitRegistry is the same function as useSchemaFormRegistry', () => {
    expect(useFormKitRegistry).toBe(useSchemaFormRegistry)
  })

  it('useSchemaForm and useFormKit both create a working form instance', async () => {
    const schema = [
      { key: 'name', type: 'text' as const, rules: { required: true } },
    ]
    const modern = useSchemaForm(schema, { initialValues: { name: '' } })
    const legacy = useFormKit(schema, { initialValues: { name: 'Ada' } })

    expect(modern.values.value.name).toBe('')
    expect(legacy.values.value.name).toBe('Ada')
    expect(await modern.validate()).toBe(false)
    expect(await legacy.validate()).toBe(true)

    const modernTyped: SchemaFormInstance = modern
    const legacyTyped: FormKitInstance = legacy
    expect(modernTyped.validate).toBeTypeOf('function')
    expect(legacyTyped.validate).toBeTypeOf('function')
  })

  it('registry type aliases share createRegistry instances', () => {
    const registry = createRegistry({
      sources: { teams: async () => [{ label: 'A', value: 1 }] },
    })
    const asModern: SchemaFormRegistryInstance = registry
    const asLegacy: FormKitRegistryInstance = registry
    const modernShape: SchemaFormRegistry = {
      sources: asModern.sources,
      rules: asModern.rules,
      fields: asModern.fields,
    }
    const legacyShape: FormKitRegistry = modernShape

    expect(asLegacy.sources.teams).toBe(asModern.sources.teams)
    expect(legacyShape.sources).toBe(modernShape.sources)
  })

  it('plugin provides both $schemaForm and deprecated $formKit', () => {
    type Provide = {
      schemaForm: ReturnType<typeof createRegistry>
      formKit: ReturnType<typeof createRegistry>
    }
    const setup = (plugin as unknown as {
      setup: (...args: unknown[]) => { provide: Provide }
    }).setup
    const result = setup({}, {})

    expect(result.provide.schemaForm).toBe(result.provide.formKit)
    expect(result.provide.schemaForm.sources).toEqual({})
    expect(typeof result.provide.schemaForm.register).toBe('function')
  })
})
