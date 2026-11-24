import { describe, expect, it } from 'vitest'
import { resolveMessages } from '../../src/runtime/core/messages'
import { validateSync, validateValue } from '../../src/runtime/core/rules'
import type { RuleContext } from '../../src/runtime/core/rules'

const ctx = (extra: Partial<RuleContext> = {}): RuleContext => ({
  messages: resolveMessages('th'),
  locale: 'th',
  ...extra,
})

describe('validateSync — required', () => {
  it('fails on empty values only when required', () => {
    for (const empty of [null, undefined, '', '   ', []]) {
      expect(validateSync(empty, { required: true }, {}, ctx())).toBe('จำเป็นต้องระบุ')
      expect(validateSync(empty, {}, {}, ctx())).toBeUndefined()
    }
  })

  it('treats 0 and false as non-empty', () => {
    expect(validateSync(0, { required: true }, {}, ctx())).toBeUndefined()
    expect(validateSync(false, { required: true }, {}, ctx())).toBeUndefined()
  })

  it('uses custom required message', () => {
    expect(validateSync('', { required: 'กรุณายอมรับ' }, {}, ctx())).toBe('กรุณายอมรับ')
  })

  it('ctx.required (requiredWhen) overrides rules.required', () => {
    expect(validateSync('', {}, {}, ctx({ required: true }))).toBe('จำเป็นต้องระบุ')
    expect(validateSync('', { required: true }, {}, ctx({ required: false }))).toBeUndefined()
  })

  it('empty date-range is empty', () => {
    expect(validateSync({ start: null, end: null }, { required: true }, {}, ctx())).toBe('จำเป็นต้องระบุ')
  })

  it('skips all other rules on empty optional values', () => {
    expect(validateSync('', { minLength: 3, email: true, pattern: '^x$' }, {}, ctx())).toBeUndefined()
  })
})

describe('validateSync — numbers', () => {
  it('min / max / integer', () => {
    expect(validateSync(5, { min: 10 }, {}, ctx())).toBe('ต้องไม่น้อยกว่า 10')
    expect(validateSync(50, { max: 10 }, {}, ctx())).toBe('ต้องไม่มากกว่า 10')
    expect(validateSync(10, { min: 10, max: 10 }, {}, ctx())).toBeUndefined()
    expect(validateSync(1.5, { integer: true }, {}, ctx())).toBe('ต้องเป็นจำนวนเต็ม')
    expect(validateSync(2, { integer: true }, {}, ctx())).toBeUndefined()
  })
})

describe('validateSync — strings', () => {
  it('minLength / maxLength count Thai characters by code point', () => {
    expect(validateSync('ab', { minLength: 3 }, {}, ctx())).toBe('ต้องมีอย่างน้อย 3 ตัวอักษร')
    expect(validateSync('สวัสดี', { maxLength: 6 }, {}, ctx())).toBeUndefined()
    expect(validateSync('สวัสดีครับ', { maxLength: 6 }, {}, ctx())).toBe('ต้องไม่เกิน 6 ตัวอักษร')
  })

  it('email / url', () => {
    expect(validateSync('a@b.co', { email: true }, {}, ctx())).toBeUndefined()
    expect(validateSync('a@b', { email: true }, {}, ctx())).toBe('รูปแบบอีเมลไม่ถูกต้อง')
    expect(validateSync('https://x.com/a', { url: true }, {}, ctx())).toBeUndefined()
    expect(validateSync('x.com', { url: true }, {}, ctx())).toBe('รูปแบบ URL ไม่ถูกต้อง')
  })

  it('pattern as string or object with message/flags', () => {
    expect(validateSync('ABC-123', { pattern: '^[A-Z]{3}-\\d{3}$' }, {}, ctx())).toBeUndefined()
    expect(validateSync('abc', { pattern: '^\\d+$' }, {}, ctx())).toBe('รูปแบบไม่ถูกต้อง')
    expect(validateSync('abc', { pattern: { regex: '^ABC$', flags: 'i' } }, {}, ctx())).toBeUndefined()
    expect(validateSync('x', { pattern: { regex: '^\\d$', message: 'ตัวเลขเท่านั้น' } }, {}, ctx())).toBe('ตัวเลขเท่านั้น')
  })

  it('noSpecialChars with allow list', () => {
    expect(validateSync('ชื่อ (สาขา) - 1/2, ok!', { noSpecialChars: true }, {}, ctx())).toBeUndefined()
    expect(validateSync('<script>', { noSpecialChars: true }, {}, ctx())).toBe('ห้ามใช้อักขระพิเศษ')
    expect(validateSync('50%', { noSpecialChars: true }, {}, ctx())).toBe('ห้ามใช้อักขระพิเศษ')
    expect(validateSync('50%', { noSpecialChars: { allow: '%' } }, {}, ctx())).toBeUndefined()
  })
})

describe('validateSync — arrays', () => {
  it('minItems / maxItems', () => {
    expect(validateSync(['a'], { minItems: 2 }, {}, ctx())).toBe('ต้องเลือกอย่างน้อย 2 รายการ')
    expect(validateSync(['a', 'b', 'c'], { maxItems: 2 }, {}, ctx())).toBe('เลือกได้ไม่เกิน 2 รายการ')
    expect(validateSync(['a', 'b'], { minItems: 2, maxItems: 2 }, {}, ctx())).toBeUndefined()
  })
})

describe('validateSync — compare', () => {
  const labelOf = (k: string) => ({ start_date: 'วันเริ่ม', salary: 'เงินเดือน' }[k] ?? k)

  it('compares dates (ISO) across fields', () => {
    const values = { start_date: '2026-05-10' }
    expect(validateSync('2026-05-09', { compare: { field: 'start_date', op: '>=' } }, values, ctx({ labelOf }))).toBe('ต้องไม่น้อยกว่า วันเริ่ม')
    expect(validateSync('2026-05-10', { compare: { field: 'start_date', op: '>=' } }, values, ctx({ labelOf }))).toBeUndefined()
  })

  it('compares numbers and uses custom message', () => {
    expect(validateSync(200, { compare: { field: 'salary', op: '<=', message: 'โบนัสเกิน' } }, { salary: 100 }, ctx())).toBe('โบนัสเกิน')
    expect(validateSync(50, { compare: { field: 'salary', op: '<=' } }, { salary: 100 }, ctx())).toBeUndefined()
  })

  it('skips compare when the other field is empty', () => {
    expect(validateSync(5, { compare: { field: 'salary', op: '<' } }, { salary: null }, ctx())).toBeUndefined()
  })

  it('supports multiple compare rules and all operators', () => {
    const v = { a: 5 }
    expect(validateSync(5, { compare: { field: 'a', op: '==' } }, v, ctx())).toBeUndefined()
    expect(validateSync(5, { compare: { field: 'a', op: '!=' } }, v, ctx())).toBeTruthy()
    expect(validateSync(6, { compare: { field: 'a', op: '>' } }, v, ctx())).toBeUndefined()
    expect(validateSync(4, { compare: { field: 'a', op: '<' } }, v, ctx())).toBeUndefined()
    expect(validateSync(4, { compare: [{ field: 'a', op: '<' }, { field: 'a', op: '>=', message: 'second' }] }, v, ctx())).toBe('second')
  })

  it('english messages', () => {
    const en: RuleContext = { messages: resolveMessages('en'), locale: 'en', labelOf }
    expect(validateSync('2026-01-01', { compare: { field: 'start_date', op: '>=' } }, { start_date: '2026-02-01' }, en)).toBe('Must be on or after วันเริ่ม')
    expect(validateSync('', { required: true }, {}, en)).toBe('This field is required')
  })
})

describe('validateSync — message overrides', () => {
  it('rules.messages overrides built-in text and keeps placeholders', () => {
    expect(validateSync(1, { min: 3, messages: { min: 'อย่างน้อย {min} ดาว' } }, {}, ctx())).toBe('อย่างน้อย 3 ดาว')
  })

  it('resolveMessages merges overrides and falls back to th', () => {
    expect(resolveMessages('xx').required).toBe('จำเป็นต้องระบุ')
    expect(resolveMessages('en', { required: 'Required!' }).required).toBe('Required!')
  })
})

describe('validateValue — custom (async) rules', () => {
  it('runs registered and inline rules, returns the first error', async () => {
    const customRules = { notAdmin: (v: string) => v !== 'admin' || 'ห้ามใช้ admin' }
    expect(await validateValue('admin', { custom: ['notAdmin'] }, {}, ctx({ customRules }))).toBe('ห้ามใช้ admin')
    expect(await validateValue('bob', { custom: ['notAdmin'] }, {}, ctx({ customRules }))).toBeUndefined()
    const asyncRule = async (v: string) => (v.length > 2 ? true : 'สั้นไป')
    expect(await validateValue('ab', { custom: [asyncRule] }, {}, ctx())).toBe('สั้นไป')
  })

  it('custom rules receive all values', async () => {
    const rule = (v: number, values: Record<string, number>) => v <= values.limit! || 'เกินวงเงิน'
    expect(await validateValue(10, { custom: [rule] }, { limit: 5 }, ctx())).toBe('เกินวงเงิน')
  })

  it('sync errors win and custom rules are skipped on empty values', async () => {
    let called = false
    const rule = () => {
      called = true
      return 'x'
    }
    expect(await validateValue('', { required: true, custom: [rule] }, {}, ctx())).toBe('จำเป็นต้องระบุ')
    expect(await validateValue('', { custom: [rule] }, {}, ctx())).toBeUndefined()
    expect(called).toBe(false)
  })

  it('warns and ignores unknown rule names', async () => {
    expect(await validateValue('x', { custom: ['nope'] }, {}, ctx())).toBeUndefined()
  })
})
