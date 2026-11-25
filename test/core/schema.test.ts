import { describe, expect, it } from 'vitest'
import {
  buildInitialValues, buildPayload, dependentsOf, emptyValueOf, flattenFields, isFieldVisible, validateSchema,
} from '../../src/runtime/core/schema'
import type { FieldSchema, FormSchema } from '../../src/runtime/core/types'

const schema: FormSchema = [
  {
    type: 'section',
    title: 'A',
    visibleWhen: { field: 'show_section', is: true },
    children: [
      { key: 'name', type: 'text' },
      { type: 'row', visibleWhen: { field: 'show_row' }, children: [{ key: 'nested', type: 'number', defaultValue: 5 }] },
    ],
  },
  { key: 'show_section', type: 'switch', defaultValue: true },
  { key: 'show_row', type: 'checkbox' },
  { key: 'tags', type: 'checkbox-group', options: { items: ['a'] } },
  { key: 'langs', type: 'select', multiple: true, options: { items: ['th'] } },
  { key: 'range', type: 'date-range' },
  { key: 'province', type: 'select', options: { source: 'p' } },
  { key: 'district', type: 'select', options: { source: 'd', dependsOn: ['province'] } },
  { key: 'subdistrict', type: 'select', options: { source: 's', dependsOn: ['district'] } },
  { key: 'other', type: 'select', options: { source: 'o', dependsOn: ['province'] } },
  { type: 'slot', name: 'extra' },
]

describe('flattenFields', () => {
  it('flattens nested sections/rows and skips layout-only nodes', () => {
    const keys = flattenFields(schema).map(f => f.field.key)
    expect(keys).toEqual(['name', 'nested', 'show_section', 'show_row', 'tags', 'langs', 'range', 'province', 'district', 'subdistrict', 'other'])
  })

  it('keeps ancestor conditions', () => {
    const nested = flattenFields(schema).find(f => f.field.key === 'nested')!
    expect(nested.ancestors).toHaveLength(2)
  })
})

describe('isFieldVisible', () => {
  const flat = flattenFields(schema)
  const nested = flat.find(f => f.field.key === 'nested')!
  it('hides a field when any ancestor is hidden', () => {
    expect(isFieldVisible(nested, { show_section: true, show_row: true })).toBe(true)
    expect(isFieldVisible(nested, { show_section: false, show_row: true })).toBe(false)
    expect(isFieldVisible(nested, { show_section: true, show_row: false })).toBe(false)
  })
})

describe('emptyValueOf / buildInitialValues', () => {
  it('uses type-aware empty values', () => {
    const f = (x: Partial<FieldSchema>) => x as FieldSchema
    expect(emptyValueOf(f({ type: 'text' }))).toBeNull()
    expect(emptyValueOf(f({ type: 'checkbox' }))).toBe(false)
    expect(emptyValueOf(f({ type: 'switch' }))).toBe(false)
    expect(emptyValueOf(f({ type: 'checkbox-group' }))).toEqual([])
    expect(emptyValueOf(f({ type: 'tags' }))).toEqual([])
    expect(emptyValueOf(f({ type: 'file', multiple: true } as never))).toEqual([])
    expect(emptyValueOf(f({ type: 'file' }))).toBeNull()
    expect(emptyValueOf(f({ type: 'select', multiple: true } as never))).toEqual([])
    expect(emptyValueOf(f({ type: 'date-range' }))).toEqual({ start: null, end: null })
    expect(emptyValueOf(f({ type: 'time' }))).toBeNull()
    expect(emptyValueOf(f({ type: 'datetime' }))).toBeNull()
    expect(emptyValueOf(f({ type: 'slider' }))).toBeNull()
    expect(emptyValueOf(f({ type: 'pin' }))).toBeNull()
  })

  it('applies defaultValue and lets initial values win (including extra keys)', () => {
    const values = buildInitialValues(schema, { name: 'x', id: 9, show_section: false })
    expect(values).toMatchObject({ name: 'x', nested: 5, show_section: false, show_row: false, tags: [], langs: [], id: 9 })
  })

  it('does not share default object references', () => {
    const s: FormSchema = [{ key: 'list', type: 'checkbox-group', defaultValue: ['a'], options: { items: ['a'] } }]
    const a = buildInitialValues(s)
    const b = buildInitialValues(s)
    ;(a.list as string[]).push('b')
    expect(b.list).toEqual(['a'])
  })
})

describe('dependentsOf', () => {
  it('returns all descendants transitively', () => {
    expect(dependentsOf(schema, 'province')).toEqual(['district', 'other', 'subdistrict'])
    expect(dependentsOf(schema, 'district')).toEqual(['subdistrict'])
    expect(dependentsOf(schema, 'name')).toEqual([])
  })
})

describe('validateSchema', () => {
  it('passes a correct schema', () => {
    expect(validateSchema(schema).filter(i => i.level === 'error')).toEqual([])
  })

  it('detects duplicate keys, missing options, unknown refs, unknown types and cycles', () => {
    const bad: FormSchema = [
      { key: 'a', type: 'text' },
      { key: 'a', type: 'text' },
      { key: 'b', type: 'select' } as never,
      { key: 'c', type: 'text', visibleWhen: { field: 'ghost' } },
      { key: 'd', type: 'weird' },
      { key: 'x', type: 'select', options: { source: 's', dependsOn: ['y'] } },
      { key: 'y', type: 'select', options: { source: 's', dependsOn: ['x'] } },
    ]
    const messages = validateSchema(bad, new Set(['text', 'select'])).map(i => i.message)
    expect(messages).toContain('duplicate field key "a"')
    expect(messages).toContain('field "b" (select) needs options.items or options.source')
    expect(messages).toContain('field "c" references unknown field "ghost"')
    expect(messages).toContain('unknown field type "weird" on "d"')
    expect(messages.some(m => m.startsWith('dependsOn cycle'))).toBe(true)
  })

  it('warns on unknown fields in params templates and compare rules', () => {
    const s: FormSchema = [
      { key: 'a', type: 'select', options: { source: 's', params: { q: '{{missing}}' } } },
      { key: 'b', type: 'date', rules: { compare: { field: 'nope', op: '>=' } } },
    ]
    const messages = validateSchema(s).map(i => i.message)
    expect(messages).toContain('field "a" references unknown field "missing"')
    expect(messages).toContain('field "b" references unknown field "nope"')
  })
})

describe('buildPayload', () => {
  const values = { name: '', nested: 3, show_section: false, show_row: true, id: 7, tags: [] }

  it('converts empty strings to null and keeps extra keys', () => {
    expect(buildPayload(schema, values)).toMatchObject({ name: null, id: 7 })
  })

  it('omits hidden fields when asked', () => {
    const payload = buildPayload(schema, values, { omitHidden: true })
    expect(payload).not.toHaveProperty('name')
    expect(payload).not.toHaveProperty('nested')
    expect(payload.id).toBe(7)
  })

  it('omits empty values when asked', () => {
    const payload = buildPayload(schema, values, { omitEmpty: true })
    expect(payload).not.toHaveProperty('tags')
    expect(payload).not.toHaveProperty('name')
  })

  it('does not mutate the input', () => {
    const input = { name: '' }
    buildPayload(schema, input)
    expect(input.name).toBe('')
  })
})
