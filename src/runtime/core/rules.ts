import type { CompareRule, Messages, RuleFn, RuleName, RuleResult, Rules, Values } from './types'
import { opLabels } from './messages'
import { format, getPath, isEmpty, toComparable } from './utils'

export interface RuleContext {
  messages: Messages
  locale: string
  /** rule ที่ลงทะเบียนไว้ (ใช้กับ rules.custom: ['name']) */
  customRules?: Record<string, RuleFn>
  /** แปลง key → label ใช้ในข้อความ compare */
  labelOf?: (key: string) => string
  /** บังคับ required จาก requiredWhen */
  required?: boolean
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/[^\s/$.?#].\S*$/i
// อักขระพิเศษที่ห้าม — ตัวอักษร ตัวเลข ช่องว่าง และ - _ . , ( ) / : ! ? @ # & ยังใช้ได้
export const SPECIAL_CHARS = ['<', '>', '{', '}', '[', ']', '\\', '|', '^', '~', '`', '$', '%', '*', '=', '+', ';', '"', '\'']

function msg(rules: Rules, ctx: RuleContext, name: RuleName, params: Record<string, unknown> = {}) {
  return format(rules.messages?.[name] ?? ctx.messages[name], params)
}

function lengthOf(value: unknown): number {
  if (typeof value === 'string') return [...value].length
  return 0
}

function compareValues(a: unknown, b: unknown, op: CompareRule['op']): boolean {
  const x = toComparable(a)
  const y = toComparable(b)
  if (x === null || y === null) return true // ว่างข้างใดข้างหนึ่ง = ไม่ตรวจ (ให้ required จัดการ)
  switch (op) {
    case '==': return x === y
    case '!=': return x !== y
    case '>': return x > y
    case '>=': return x >= y
    case '<': return x < y
    case '<=': return x <= y
    default: return true
  }
}

function checkSpecialChars(value: unknown, allow = ''): boolean {
  if (typeof value !== 'string' || value === '') return true
  const forbidden = SPECIAL_CHARS.filter(c => !allow.includes(c))
  return ![...value].some(c => forbidden.includes(c))
}

/** ตรวจ rules แบบ sync ทั้งหมด — คืนข้อความ error แรกที่เจอ */
export function validateSync(value: unknown, rules: Rules | undefined, values: Values, ctx: RuleContext): string | undefined {
  const r = rules ?? {}
  const required = ctx.required ?? Boolean(r.required)

  if (isEmpty(value)) {
    if (!required) return undefined
    return typeof r.required === 'string' ? r.required : msg(r, ctx, 'required')
  }

  const isNumber = typeof value === 'number'
  const isArray = Array.isArray(value)

  if (r.integer && isNumber && !Number.isInteger(value)) return msg(r, ctx, 'integer')
  if (r.min !== undefined && isNumber && value < r.min) return msg(r, ctx, 'min', { min: r.min })
  if (r.max !== undefined && isNumber && value > r.max) return msg(r, ctx, 'max', { max: r.max })
  if (r.minLength !== undefined && lengthOf(value) < r.minLength) return msg(r, ctx, 'minLength', { minLength: r.minLength })
  if (r.maxLength !== undefined && lengthOf(value) > r.maxLength) return msg(r, ctx, 'maxLength', { maxLength: r.maxLength })
  if (isArray && r.minItems !== undefined && value.length < r.minItems) return msg(r, ctx, 'minItems', { minItems: r.minItems })
  if (isArray && r.maxItems !== undefined && value.length > r.maxItems) return msg(r, ctx, 'maxItems', { maxItems: r.maxItems })

  if (r.email && typeof value === 'string' && !EMAIL.test(value)) return msg(r, ctx, 'email')
  if (r.url && typeof value === 'string' && !URL_RE.test(value)) return msg(r, ctx, 'url')

  if (r.pattern && typeof value === 'string') {
    const p = typeof r.pattern === 'string' ? { regex: r.pattern } : r.pattern
    if (!new RegExp(p.regex, p.flags).test(value)) return p.message ?? msg(r, ctx, 'pattern')
  }

  if (r.noSpecialChars) {
    const allow = typeof r.noSpecialChars === 'object' ? r.noSpecialChars.allow : ''
    if (!checkSpecialChars(value, allow)) return msg(r, ctx, 'noSpecialChars')
  }

  if (r.compare) {
    const list = Array.isArray(r.compare) ? r.compare : [r.compare]
    for (const c of list) {
      const other = getPath(values, c.field)
      if (!compareValues(value, other, c.op)) {
        return c.message ?? msg(r, ctx, 'compare', {
          op: opLabels[ctx.locale]?.[c.op] ?? c.op,
          other: ctx.labelOf?.(c.field) ?? c.field,
        })
      }
    }
  }

  return undefined
}

function toMessage(result: RuleResult): string | undefined {
  if (typeof result === 'string' && result !== '') return result
  return undefined
}

/** ตรวจ rules ทั้งหมดรวม custom (async) */
export async function validateValue(value: unknown, rules: Rules | undefined, values: Values, ctx: RuleContext): Promise<string | undefined> {
  const syncError = validateSync(value, rules, values, ctx)
  if (syncError) return syncError
  if (!rules?.custom?.length || isEmpty(value)) return undefined

  for (const rule of rules.custom) {
    const fn = typeof rule === 'function' ? rule : ctx.customRules?.[rule]
    if (!fn) {
      console.warn(`[schema-form] custom rule "${String(rule)}" is not registered`)
      continue
    }
    const error = toMessage(await fn(value, values))
    if (error) return error
  }
  return undefined
}
