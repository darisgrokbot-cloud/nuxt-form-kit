import type { Values } from './types'

/** ค่าว่างตามความหมายของฟอร์ม: null, undefined, '', [], { start: null, end: null } */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object' && value !== null && 'start' in value && 'end' in value) {
    const range = value as { start: unknown, end: unknown }
    return isEmpty(range.start) && isEmpty(range.end)
  }
  return false
}

/** อ่านค่าแบบ path เช่น "address.city" */
export function getPath(values: Values, path: string): any {
  if (!path.includes('.')) return values?.[path]
  let cur: any = values
  for (const part of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    cur = cur[part]
  }
  return cur
}

export function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || a === undefined || b === undefined) return false
  if (typeof a === 'object' || typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b)
  // "1" กับ 1 ถือว่าเท่ากัน (ค่าจาก API มักเป็น string)
  return String(a) === String(b)
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isNaN(value) ? null : value
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

/** ค่าที่เทียบกันได้: ตัวเลข หรือวันที่ ISO → timestamp */
export function toComparable(value: unknown): number | string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const t = Date.parse(value)
      if (!Number.isNaN(t)) return t
    }
    const n = Number(value)
    return Number.isNaN(n) ? value : n
  }
  if (value instanceof Date) return value.getTime()
  return String(value)
}

export function format(template: string, params: Record<string, unknown> = {}): string {
  return template.replaceAll(/\{(\w+)\}/g, (_, k: string) => (params[k] === undefined ? `{${k}}` : String(params[k])))
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      fn(...args)
    }, wait)
  }
  run.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
  }
  return run
}

export function clone<T>(value: T): T {
  if (value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

/** JSON.stringify ที่เรียง key — ใช้เทียบ object โดยไม่สนลำดับ key */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
    }
    return v
  })
}
