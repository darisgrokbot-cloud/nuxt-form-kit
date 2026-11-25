import { describe, expect, it } from 'vitest'
import { spanClass } from '../../src/runtime/core/layout'
import {
  findOption, mergeOptions, normalizeOption, normalizeOptions, normalizeSourceResult, searchConfig,
} from '../../src/runtime/core/options'
import { createRegistry } from '../../src/runtime/core/registry'
import { resolveTemplate, templateFields } from '../../src/runtime/core/template'
import { debounce, format, isEmpty, looseEqual, toComparable } from '../../src/runtime/core/utils'

describe('normalizeOption', () => {
  it('handles primitives', () => {
    expect(normalizeOption('A')).toEqual({ label: 'A', value: 'A' })
    expect(normalizeOption(3)).toEqual({ label: '3', value: 3 })
  })

  it('guesses label/value keys from common API shapes', () => {
    expect(normalizeOption({ id: 1, name: 'ทีม 1' })).toMatchObject({ label: 'ทีม 1', value: 1 })
    expect(normalizeOption({ value: 'x', title: 'X' })).toMatchObject({ label: 'X', value: 'x' })
    expect(normalizeOption({ code: 'TH', text: 'ไทย' })).toMatchObject({ label: 'ไทย', value: 'TH' })
  })

  it('uses explicit map and keeps raw data', () => {
    const raw = { emp_id: 9, full_name: 'สมชาย', email: 'a@b.c', disabled: true }
    const opt = normalizeOption(raw, { label: 'full_name', value: 'emp_id', description: 'email' })
    expect(opt).toEqual({ label: 'สมชาย', value: 9, description: 'a@b.c', disabled: true, raw })
  })

  it('falls back to value as label', () => {
    expect(normalizeOption({ id: 5 })).toMatchObject({ label: '5', value: 5 })
  })

  it('normalizeOptions handles undefined', () => {
    expect(normalizeOptions(undefined)).toEqual([])
  })
})

describe('normalizeSourceResult', () => {
  it('accepts arrays and guesses hasMore from page size', () => {
    expect(normalizeSourceResult([1, 2], 2)).toEqual({ items: [1, 2], hasMore: true })
    expect(normalizeSourceResult([1], 2)).toEqual({ items: [1], hasMore: false })
  })

  it('accepts { items, hasMore }', () => {
    expect(normalizeSourceResult({ items: [1], hasMore: true }, 20)).toEqual({ items: [1], hasMore: true })
    expect(normalizeSourceResult({ items: [] } as never, 20)).toEqual({ items: [], hasMore: false })
  })
})

describe('mergeOptions / findOption', () => {
  it('dedupes by value (string compare)', () => {
    const merged = mergeOptions([{ label: 'a', value: 1 }], [{ label: 'a2', value: '1' }, { label: 'b', value: 2 }])
    expect(merged.map(o => o.label)).toEqual(['a', 'b'])
    expect(findOption(merged, '2')?.label).toBe('b')
  })
})

describe('searchConfig', () => {
  it('defaults to search for autocomplete only', () => {
    expect(searchConfig(undefined, true)).toEqual({ minChars: 0, debounce: 300 })
    expect(searchConfig(undefined, false)).toBeNull()
    expect(searchConfig({ search: { minChars: 2 } }, false)).toEqual({ minChars: 2, debounce: 300 })
    expect(searchConfig({ search: false }, true)).toBeNull()
  })
})

describe('resolveTemplate', () => {
  const values = { a: 5, b: null, list: [1, 2], nested: { x: 'y' } }
  it('keeps the real type for whole templates', () => {
    expect(resolveTemplate('{{a}}', values)).toBe(5)
    expect(resolveTemplate('{{ list }}', values)).toEqual([1, 2])
    expect(resolveTemplate('{{b}}', values)).toBeNull()
    expect(resolveTemplate('{{missing}}', values)).toBeNull()
  })

  it('interpolates strings and walks objects/arrays', () => {
    expect(resolveTemplate('id-{{a}}-{{b}}', values)).toBe('id-5-')
    expect(resolveTemplate({ q: { id: '{{nested.x}}' }, arr: ['{{a}}', 'x'], n: 1 }, values)).toEqual({ q: { id: 'y' }, arr: [5, 'x'], n: 1 })
  })

  it('templateFields lists referenced root keys', () => {
    expect(templateFields({ a: '{{a}}', b: 'x{{nested.x}}{{c}}' })).toEqual(['a', 'nested', 'c'])
  })
})

describe('spanClass', () => {
  it('maps spans to static tailwind classes', () => {
    expect(spanClass(undefined)).toBe('col-span-12')
    expect(spanClass(6)).toBe('col-span-6')
    expect(spanClass(20)).toBe('col-span-12')
    expect(spanClass({ base: 12, md: 6, xl: 4 })).toBe('col-span-12 md:col-span-6 xl:col-span-4')
    expect(spanClass({ md: 3 })).toBe('col-span-12 md:col-span-3')
  })
})

describe('utils', () => {
  it('isEmpty', () => {
    expect([null, undefined, '', ' ', [], { start: null, end: '' }].every(isEmpty)).toBe(true)
    expect([0, false, 'a', [0], {}, { start: '2026-01-01', end: null }].some(isEmpty)).toBe(false)
  })

  it('looseEqual', () => {
    expect(looseEqual(1, '1')).toBe(true)
    expect(looseEqual(null, undefined)).toBe(false)
    expect(looseEqual([1], [1])).toBe(true)
  })

  it('toComparable', () => {
    expect(toComparable('2026-01-02')).toBeGreaterThan(toComparable('2026-01-01') as number)
    expect(toComparable('12')).toBe(12)
    expect(toComparable('')).toBeNull()
  })

  it('format keeps unknown placeholders', () => {
    expect(format('{a} {b}', { a: 1 })).toBe('1 {b}')
  })

  it('debounce runs once with the last args', async () => {
    const calls: number[] = []
    const fn = debounce((n: number) => calls.push(n), 10)
    fn(1)
    fn(2)
    fn(3)
    await new Promise(r => setTimeout(r, 30))
    expect(calls).toEqual([3])
  })
})

describe('registry', () => {
  it('registers and merges entries', () => {
    const r = createRegistry({ sources: { a: () => [] } })
    r.register({ sources: { b: () => [] }, rules: { x: () => true }, translate: s => `t:${s}` })
    expect(Object.keys(r.sources)).toEqual(['a', 'b'])
    expect(Object.keys(r.rules)).toEqual(['x'])
    expect(r.translate?.('k')).toBe('t:k')
  })
})
