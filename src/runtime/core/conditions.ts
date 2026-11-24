import type { Condition, FieldCondition, Values } from './types'
import { getPath, isEmpty, looseEqual, toComparable } from './utils'

function evaluateFieldCondition(cond: FieldCondition, values: Values): boolean {
  const value = getPath(values, cond.field)
  const checks: boolean[] = []

  if ('is' in cond) checks.push(looseEqual(value, cond.is))
  if ('isNot' in cond) checks.push(!looseEqual(value, cond.isNot))
  if (cond.in) checks.push(cond.in.some(v => looseEqual(value, v)))
  if (cond.notIn) checks.push(!cond.notIn.some(v => looseEqual(value, v)))
  if (cond.empty !== undefined) checks.push(isEmpty(value) === cond.empty)
  if ('includes' in cond) {
    checks.push(Array.isArray(value) && value.some(v => looseEqual(v, cond.includes)))
  }

  const comparable = toComparable(value)
  const numeric = typeof comparable === 'number'
  if (cond.gt !== undefined) checks.push(numeric && (comparable as number) > cond.gt)
  if (cond.gte !== undefined) checks.push(numeric && (comparable as number) >= cond.gte)
  if (cond.lt !== undefined) checks.push(numeric && (comparable as number) < cond.lt)
  if (cond.lte !== undefined) checks.push(numeric && (comparable as number) <= cond.lte)

  // { field: 'x' } เฉยๆ = มีค่า (truthy)
  if (checks.length === 0) return !isEmpty(value) && value !== false
  return checks.every(Boolean)
}

/**
 * ประเมินเงื่อนไข
 * @param fallback ค่าที่คืนเมื่อไม่ได้กำหนดเงื่อนไข (undefined)
 */
export function evaluateCondition(cond: Condition | undefined, values: Values, fallback = false): boolean {
  if (cond === undefined || cond === null) return fallback
  if (typeof cond === 'boolean') return cond
  if (typeof cond === 'function') return Boolean(cond(values))
  if ('all' in cond) return cond.all.every(c => evaluateCondition(c, values, true))
  if ('any' in cond) return cond.any.some(c => evaluateCondition(c, values, false))
  if ('not' in cond) return !evaluateCondition(cond.not, values, false)
  if ('field' in cond) return evaluateFieldCondition(cond, values)
  return fallback
}

/** key ของฟิลด์ทั้งหมดที่เงื่อนไขนี้อ้างถึง (ใช้ตรวจ schema) */
export function conditionFields(cond: Condition | undefined): string[] {
  if (!cond || typeof cond !== 'object') return []
  if ('all' in cond) return cond.all.flatMap(conditionFields)
  if ('any' in cond) return cond.any.flatMap(conditionFields)
  if ('not' in cond) return conditionFields(cond.not)
  if ('field' in cond) return [cond.field]
  return []
}
