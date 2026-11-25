import { describe, expect, it } from 'vitest'
import { useSchemaForm } from '../../src/runtime/composables/useSchemaForm'
import { createRegistry } from '../../src/runtime/core/registry'
import plugin from '../../src/runtime/plugin'

describe('schema-form public API', () => {
  it('useSchemaForm creates a working form instance', async () => {
    const schema = [
      { key: 'name', type: 'text' as const, rules: { required: true } },
    ]
    const empty = useSchemaForm(schema, { initialValues: { name: '' } })
    const filled = useSchemaForm(schema, { initialValues: { name: 'Ada' } })

    expect(empty.values.value.name).toBe('')
    expect(filled.values.value.name).toBe('Ada')
    expect(await empty.validate()).toBe(false)
    expect(await filled.validate()).toBe(true)
  })

  it('plugin provides $schemaForm registry', () => {
    type Provide = {
      schemaForm: ReturnType<typeof createRegistry>
    }
    const setup = (plugin as unknown as {
      setup: (...args: unknown[]) => { provide: Provide }
    }).setup
    const result = setup({}, {})

    expect(result.provide.schemaForm.sources).toEqual({})
    expect(typeof result.provide.schemaForm.register).toBe('function')
    expect(Object.keys(result.provide)).toEqual(['schemaForm'])
  })
})
