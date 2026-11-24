import type { Condition, FieldSchema, FormSchema, LayoutNode, SchemaNode, Values } from './types'
import { conditionFields, evaluateCondition } from './conditions'
import { templateFields } from './template'
import { clone, isEmpty } from './utils'

const LAYOUT_TYPES = new Set(['section', 'row', 'slot'])
const MULTI_TYPES = new Set(['checkbox-group'])

export function isLayoutNode(node: SchemaNode): node is LayoutNode {
  return LAYOUT_TYPES.has(node.type)
}

export function isField(node: SchemaNode): node is FieldSchema {
  return !isLayoutNode(node) && typeof (node as FieldSchema).key === 'string'
}

export interface FlatField {
  field: FieldSchema
  /** เงื่อนไข visibleWhen ของ node แม่ทั้งหมด (section/row) */
  ancestors: Condition[]
}

/** แปลง tree → รายการฟิลด์แบบแบน พร้อมเงื่อนไขของแม่ */
export function flattenFields(schema: FormSchema, ancestors: Condition[] = []): FlatField[] {
  const out: FlatField[] = []
  for (const node of schema) {
    if (isField(node)) {
      out.push({ field: node, ancestors })
    }
    else if ((node.type === 'section' || node.type === 'row') && Array.isArray(node.children)) {
      const next = node.visibleWhen === undefined ? ancestors : [...ancestors, node.visibleWhen]
      out.push(...flattenFields(node.children, next))
    }
  }
  return out
}

/** ฟิลด์นี้มองเห็นอยู่หรือไม่ (รวมแม่ทุกชั้น) */
export function isFieldVisible(flat: FlatField, values: Values): boolean {
  if (!evaluateCondition(flat.field.visibleWhen, values, true)) return false
  return flat.ancestors.every(c => evaluateCondition(c, values, true))
}

export function isMultiple(field: FieldSchema): boolean {
  return MULTI_TYPES.has(field.type) || Boolean((field as { multiple?: boolean }).multiple)
}

/** ค่าว่างตามชนิดของฟิลด์ */
export function emptyValueOf(field: FieldSchema): unknown {
  if (isMultiple(field)) return []
  if (field.type === 'checkbox' || field.type === 'switch') return false
  if (field.type === 'date-range') return { start: null, end: null }
  return null
}

/** ค่าเริ่มต้นของฟอร์ม: defaultValue → ค่าว่างตามชนิด แล้วทับด้วย initial */
export function buildInitialValues(schema: FormSchema, initial: Values = {}): Values {
  const out: Values = {}
  for (const { field } of flattenFields(schema)) {
    out[field.key] = field.defaultValue === undefined ? emptyValueOf(field) : clone(field.defaultValue)
  }
  for (const [k, v] of Object.entries(initial)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

export interface SchemaIssue {
  level: 'error' | 'warning'
  message: string
}

function referencedFields(field: FieldSchema): string[] {
  const refs = [
    ...conditionFields(field.visibleWhen),
    ...conditionFields(field.requiredWhen),
    ...conditionFields(field.disabledWhen),
    ...conditionFields(field.readonlyWhen),
  ]
  const options = (field as { options?: { dependsOn?: string[], params?: unknown, labelFrom?: string } }).options
  if (options?.dependsOn) refs.push(...options.dependsOn)
  if (options?.params) refs.push(...templateFields(options.params))
  const compare = field.rules?.compare
  if (compare) refs.push(...(Array.isArray(compare) ? compare : [compare]).map(c => c.field))
  return refs
}

function findCycle(graph: Map<string, string[]>): string[] | null {
  const state = new Map<string, 1 | 2>()
  const stack: string[] = []
  const visit = (node: string): string[] | null => {
    if (state.get(node) === 2) return null
    if (state.get(node) === 1) return [...stack.slice(stack.indexOf(node)), node]
    state.set(node, 1)
    stack.push(node)
    for (const next of graph.get(node) ?? []) {
      const cycle = visit(next)
      if (cycle) return cycle
    }
    stack.pop()
    state.set(node, 2)
    return null
  }
  for (const node of graph.keys()) {
    const cycle = visit(node)
    if (cycle) return cycle
  }
  return null
}

/**
 * ตรวจ schema ก่อนใช้งาน: key ซ้ำ, อ้างฟิลด์ที่ไม่มี, dependsOn วนลูป, ฟิลด์ตัวเลือกไม่มี options
 */
export function validateSchema(schema: FormSchema, knownTypes?: Set<string>): SchemaIssue[] {
  const issues: SchemaIssue[] = []
  const flat = flattenFields(schema)
  const keys = new Set<string>()

  for (const { field } of flat) {
    if (keys.has(field.key)) issues.push({ level: 'error', message: `duplicate field key "${field.key}"` })
    keys.add(field.key)
    if (knownTypes && !knownTypes.has(field.type)) {
      issues.push({ level: 'error', message: `unknown field type "${field.type}" on "${field.key}"` })
    }
    const needsOptions = ['select', 'autocomplete', 'radio', 'checkbox-group', 'tree-select'].includes(field.type)
    const options = (field as { options?: { items?: unknown, source?: unknown } }).options
    if (needsOptions && !options?.items && !options?.source) {
      issues.push({ level: 'error', message: `field "${field.key}" (${field.type}) needs options.items or options.source` })
    }
  }

  const graph = new Map<string, string[]>()
  for (const { field } of flat) {
    for (const ref of referencedFields(field)) {
      if (!keys.has(ref)) {
        issues.push({ level: 'warning', message: `field "${field.key}" references unknown field "${ref}"` })
      }
    }
    const deps = (field as { options?: { dependsOn?: string[] } }).options?.dependsOn ?? []
    graph.set(field.key, deps)
  }

  const cycle = findCycle(graph)
  if (cycle) issues.push({ level: 'error', message: `dependsOn cycle: ${cycle.join(' → ')}` })

  return issues
}

/** ฟิลด์ที่ต้องถูกล้างค่าเมื่อ key เปลี่ยน (ไล่ลูกหลานทุกชั้น) */
export function dependentsOf(schema: FormSchema, key: string): string[] {
  const flat = flattenFields(schema)
  const out: string[] = []
  const queue = [key]
  while (queue.length) {
    const current = queue.shift()!
    for (const { field } of flat) {
      const deps = (field as { options?: { dependsOn?: string[] } }).options?.dependsOn
      if (deps?.includes(current) && !out.includes(field.key)) {
        out.push(field.key)
        queue.push(field.key)
      }
    }
  }
  return out
}

export interface PayloadOptions {
  /** ตัดฟิลด์ที่ถูกซ่อนออก (default false) */
  omitHidden?: boolean
  /** ตัดค่าว่างออก (default false) */
  omitEmpty?: boolean
  /** แปลง '' → null (default true) */
  emptyStringToNull?: boolean
}

/** ค่าพร้อมส่ง API — เฉพาะ key ที่อยู่ใน schema + key อื่นที่มีใน values (เช่น id) */
export function buildPayload(schema: FormSchema, values: Values, opts: PayloadOptions = {}): Values {
  const omitHidden = opts.omitHidden ?? false
  const omitEmpty = opts.omitEmpty ?? false
  const emptyToNull = opts.emptyStringToNull ?? true
  const out: Values = clone(values) ?? {}

  for (const flat of flattenFields(schema)) {
    const key = flat.field.key
    if (omitHidden && !isFieldVisible(flat, values)) {
      delete out[key]
      continue
    }
    if (emptyToNull && out[key] === '') out[key] = null
    if (omitEmpty && isEmpty(out[key])) delete out[key]
  }
  return out
}
