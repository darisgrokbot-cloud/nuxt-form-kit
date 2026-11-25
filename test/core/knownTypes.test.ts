import { describe, expect, it } from 'vitest'
import { BUILTIN_FIELD_TYPES, knownFieldTypes } from '../../src/runtime/core/builtinTypes'
import { validateSchema } from '../../src/runtime/core/schema'
import type { FormSchema } from '../../src/runtime/core/types'

describe('knownFieldTypes', () => {
  it('includes all builtin field types', () => {
    const known = knownFieldTypes()
    for (const type of BUILTIN_FIELD_TYPES) {
      expect(known.has(type)).toBe(true)
    }
  })

  it('merges custom registry field types', () => {
    const known = knownFieldTypes({ rating: {} as never, 'star-rating': {} as never })
    expect(known.has('rating')).toBe(true)
    expect(known.has('star-rating')).toBe(true)
    expect(known.has('text')).toBe(true)
  })
})

describe('validateSchema with real known types', () => {
  it('accepts builtin types and rejects unknown ones (as useSchemaForm does in dev)', () => {
    const known = knownFieldTypes()
    const ok: FormSchema = [
      { key: 'name', type: 'text', rules: { required: true } },
      { key: 'level', type: 'select', options: { items: ['a'] } },
    ]
    expect(validateSchema(ok, known).filter(i => i.level === 'error')).toEqual([])

    const bad: FormSchema = [
      { key: 'score', type: 'weird-type' as 'text' },
    ]
    const messages = validateSchema(bad, known).map(i => i.message)
    expect(messages).toContain('unknown field type "weird-type" on "score"')
  })

  it('allows custom registry types when passed through knownFieldTypes', () => {
    const known = knownFieldTypes({ rating: {} as never })
    const schema: FormSchema = [
      { key: 'score', type: 'rating' as 'text' },
    ]
    expect(validateSchema(schema, known).filter(i => i.message.includes('unknown field type'))).toEqual([])
  })
})
