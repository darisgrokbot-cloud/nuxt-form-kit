import { describe, expect, it } from 'vitest'
import { conditionFields, evaluateCondition } from '../../src/runtime/core/conditions'

const values = {
  type: 'person',
  age: 32,
  amount: '150',
  tags: ['urgent', 'hr'],
  empty_text: '',
  empty_list: [],
  flag: true,
  off: false,
  start: '2026-01-10',
  address: { city: 'BKK' },
}

describe('evaluateCondition', () => {
  it('returns fallback when condition is undefined', () => {
    expect(evaluateCondition(undefined, values)).toBe(false)
    expect(evaluateCondition(undefined, values, true)).toBe(true)
  })

  it('supports boolean and function conditions', () => {
    expect(evaluateCondition(true, values)).toBe(true)
    expect(evaluateCondition(false, values, true)).toBe(false)
    expect(evaluateCondition(v => v.age > 30, values)).toBe(true)
  })

  it('is / isNot with loose equality between string and number', () => {
    expect(evaluateCondition({ field: 'type', is: 'person' }, values)).toBe(true)
    expect(evaluateCondition({ field: 'type', is: 'company' }, values)).toBe(false)
    expect(evaluateCondition({ field: 'amount', is: 150 }, values)).toBe(true)
    expect(evaluateCondition({ field: 'type', isNot: 'company' }, values)).toBe(true)
    expect(evaluateCondition({ field: 'flag', is: true }, values)).toBe(true)
  })

  it('in / notIn', () => {
    expect(evaluateCondition({ field: 'type', in: ['person', 'x'] }, values)).toBe(true)
    expect(evaluateCondition({ field: 'type', notIn: ['person'] }, values)).toBe(false)
  })

  it('numeric comparisons (number, numeric string and ISO date)', () => {
    expect(evaluateCondition({ field: 'age', gt: 30 }, values)).toBe(true)
    expect(evaluateCondition({ field: 'age', gte: 32, lte: 32 }, values)).toBe(true)
    expect(evaluateCondition({ field: 'age', lt: 30 }, values)).toBe(false)
    expect(evaluateCondition({ field: 'amount', gte: 100 }, values)).toBe(true)
    expect(evaluateCondition({ field: 'type', gt: 1 }, values)).toBe(false)
    expect(evaluateCondition({ field: 'missing', gt: 1 }, values)).toBe(false)
  })

  it('empty', () => {
    expect(evaluateCondition({ field: 'empty_text', empty: true }, values)).toBe(true)
    expect(evaluateCondition({ field: 'empty_list', empty: true }, values)).toBe(true)
    expect(evaluateCondition({ field: 'missing', empty: true }, values)).toBe(true)
    expect(evaluateCondition({ field: 'type', empty: false }, values)).toBe(true)
  })

  it('includes on arrays', () => {
    expect(evaluateCondition({ field: 'tags', includes: 'hr' }, values)).toBe(true)
    expect(evaluateCondition({ field: 'tags', includes: 'it' }, values)).toBe(false)
    expect(evaluateCondition({ field: 'type', includes: 'p' }, values)).toBe(false)
  })

  it('bare { field } means truthy / not empty', () => {
    expect(evaluateCondition({ field: 'flag' }, values)).toBe(true)
    expect(evaluateCondition({ field: 'off' }, values)).toBe(false)
    expect(evaluateCondition({ field: 'empty_text' }, values)).toBe(false)
  })

  it('combines operators in one condition with AND', () => {
    expect(evaluateCondition({ field: 'age', gte: 18, lt: 60, isNot: 0 }, values)).toBe(true)
    expect(evaluateCondition({ field: 'age', gte: 18, lt: 20 }, values)).toBe(false)
  })

  it('all / any / not and nesting', () => {
    expect(evaluateCondition({ all: [{ field: 'type', is: 'person' }, { field: 'age', gt: 30 }] }, values)).toBe(true)
    expect(evaluateCondition({ all: [{ field: 'type', is: 'person' }, { field: 'age', gt: 40 }] }, values)).toBe(false)
    expect(evaluateCondition({ any: [{ field: 'type', is: 'company' }, { field: 'age', gt: 30 }] }, values)).toBe(true)
    expect(evaluateCondition({ not: { field: 'type', is: 'company' } }, values)).toBe(true)
    expect(evaluateCondition({ any: [{ not: { field: 'flag' } }, { all: [{ field: 'tags', includes: 'hr' }] }] }, values)).toBe(true)
    expect(evaluateCondition({ all: [] }, values)).toBe(true)
    expect(evaluateCondition({ any: [] }, values)).toBe(false)
  })

  it('reads dotted paths', () => {
    expect(evaluateCondition({ field: 'address.city', is: 'BKK' }, values)).toBe(true)
    expect(evaluateCondition({ field: 'address.zip.code', empty: true }, values)).toBe(true)
  })
})

describe('conditionFields', () => {
  it('collects referenced keys from nested conditions', () => {
    expect(conditionFields({ all: [{ field: 'a' }, { any: [{ field: 'b' }, { not: { field: 'c' } }] }] })).toEqual(['a', 'b', 'c'])
    expect(conditionFields(true)).toEqual([])
    expect(conditionFields(() => true)).toEqual([])
  })
})
