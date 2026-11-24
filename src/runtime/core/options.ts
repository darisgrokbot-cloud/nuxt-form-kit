import type { OptionItem, OptionsConfig, Primitive, SourceResult } from './types'

const LABEL_KEYS = ['label', 'name', 'title', 'text']
const VALUE_KEYS = ['value', 'id', 'code', 'key']

function pick(obj: Record<string, unknown>, preferred: string | undefined, fallbacks: string[]): unknown {
  if (preferred) return obj[preferred]
  for (const k of fallbacks) {
    if (obj[k] !== undefined) return obj[k]
  }
  return undefined
}

/** แปลงข้อมูลดิบ (primitive / object จาก API) → OptionItem */
export function normalizeOption(raw: unknown, map?: OptionsConfig['map']): OptionItem {
  if (raw === null || typeof raw !== 'object') {
    return { label: String(raw ?? ''), value: raw as Primitive }
  }
  const obj = raw as Record<string, unknown>
  const value = pick(obj, map?.value, VALUE_KEYS) as Primitive
  const label = pick(obj, map?.label, LABEL_KEYS)
  const description = map?.description ? obj[map.description] : obj.description
  const item: OptionItem = {
    label: label === undefined || label === null ? String(value ?? '') : String(label),
    value: value ?? null,
    raw,
  }
  if (description !== undefined && description !== null) item.description = String(description)
  if (obj.disabled === true) item.disabled = true
  if (typeof obj.icon === 'string') item.icon = obj.icon
  return item
}

export function normalizeOptions(list: unknown[] | undefined, map?: OptionsConfig['map']): OptionItem[] {
  return (list ?? []).map(raw => normalizeOption(raw, map))
}

/** รับผลจาก source ได้ทั้ง array และ { items, hasMore } */
export function normalizeSourceResult(result: SourceResult, pageSize: number): { items: unknown[], hasMore: boolean } {
  if (Array.isArray(result)) return { items: result, hasMore: result.length >= pageSize }
  const items = Array.isArray(result?.items) ? result.items : []
  return { items, hasMore: result?.hasMore ?? items.length >= pageSize }
}

/** รวม option ใหม่เข้าของเดิม โดยไม่ให้ value ซ้ำ */
export function mergeOptions(base: OptionItem[], extra: OptionItem[]): OptionItem[] {
  const seen = new Set(base.map(o => String(o.value)))
  return [...base, ...extra.filter(o => !seen.has(String(o.value)))]
}

export function findOption(options: OptionItem[], value: unknown): OptionItem | undefined {
  return options.find(o => String(o.value) === String(value))
}

export function searchConfig(options: OptionsConfig | undefined, isAutocomplete: boolean) {
  const s = options?.search ?? isAutocomplete
  if (!s) return null
  const cfg = typeof s === 'object' ? s : {}
  return { minChars: cfg.minChars ?? 0, debounce: cfg.debounce ?? 300 }
}
