import type { Values } from './types'
import { getPath } from './utils'

const WHOLE = /^\{\{\s*([\w.]+)\s*\}\}$/
const PART = /\{\{\s*([\w.]+)\s*\}\}/g

/**
 * แทน "{{key}}" ด้วยค่าจากฟอร์ม
 * - ถ้าทั้ง string เป็น template เดียว จะคืนค่าตามชนิดจริง (number/array/null)
 * - ถ้าปนกับข้อความ จะต่อเป็น string
 */
export function resolveTemplate(input: unknown, values: Values): unknown {
  if (typeof input === 'string') {
    const whole = WHOLE.exec(input)
    if (whole) return getPath(values, whole[1]!) ?? null
    if (!input.includes('{{')) return input
    return input.replaceAll(PART, (_, k: string) => {
      const v = getPath(values, k)
      return v === null || v === undefined ? '' : String(v)
    })
  }
  if (Array.isArray(input)) return input.map(v => resolveTemplate(v, values))
  if (input && typeof input === 'object') {
    return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, resolveTemplate(v, values)]))
  }
  return input
}

/** key ทั้งหมดที่ template อ้างถึง */
export function templateFields(input: unknown): string[] {
  if (typeof input === 'string') return [...input.matchAll(PART)].map(m => m[1]!.split('.')[0]!)
  if (Array.isArray(input)) return input.flatMap(templateFields)
  if (input && typeof input === 'object') return Object.values(input).flatMap(templateFields)
  return []
}
