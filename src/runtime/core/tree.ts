import type {
  OptionsConfig,
  Primitive,
  TreeOptionItem,
  TreeOptionsConfig,
  TreeSelectMode,
} from './types'
import { looseEqual } from './utils'

const LABEL_KEYS = ['label', 'name', 'title', 'text']
const VALUE_KEYS = ['value', 'id', 'code', 'key']
const CHILDREN_KEYS = ['children', 'items', 'nodes']

function pick(obj: Record<string, unknown>, preferred: string | undefined, fallbacks: string[]): unknown {
  if (preferred) return obj[preferred]
  for (const k of fallbacks) {
    if (obj[k] !== undefined) return obj[k]
  }
  return undefined
}

export type TreeMap = NonNullable<TreeOptionsConfig['map']>

/** แปลงข้อมูลดิบ → TreeOptionItem (รวม children แบบ recursive) */
export function normalizeTreeOption(raw: unknown, map?: TreeMap): TreeOptionItem {
  if (raw === null || typeof raw !== 'object') {
    return { label: String(raw ?? ''), value: raw as Primitive }
  }
  const obj = raw as Record<string, unknown>
  const value = pick(obj, map?.value, VALUE_KEYS) as Primitive
  const label = pick(obj, map?.label, LABEL_KEYS)
  const description = map?.description ? obj[map.description] : obj.description
  const item: TreeOptionItem = {
    label: label === undefined || label === null ? String(value ?? '') : String(label),
    value: value ?? null,
    raw,
  }
  if (description !== undefined && description !== null) item.description = String(description)
  if (obj.disabled === true) item.disabled = true
  if (typeof obj.icon === 'string') item.icon = obj.icon
  if (obj.defaultExpanded === true) item.defaultExpanded = true

  const childrenRaw = pick(obj, map?.children, CHILDREN_KEYS)
  if (Array.isArray(childrenRaw)) {
    item.children = childrenRaw.map(child => normalizeTreeOption(child, map))
  }
  else if (obj.hasChildren === true || obj.isLeaf === false) {
    // placeholder สำหรับ lazy-load — มี children ว่าง = กางได้
    item.children = []
  }

  return item
}

export function normalizeTreeOptions(list: unknown[] | undefined, map?: TreeMap): TreeOptionItem[] {
  return (list ?? []).map(raw => normalizeTreeOption(raw, map))
}

export interface FlatTreeNode {
  item: TreeOptionItem
  depth: number
  parent?: TreeOptionItem
  path: TreeOptionItem[]
  /** เป็น leaf (ไม่มี children หรือ children ว่างและไม่ใช่ lazy placeholder ที่ยังไม่โหลด) */
  isLeaf: boolean
}

function isLeafNode(item: TreeOptionItem): boolean {
  if (!Array.isArray(item.children)) return true
  if (item.children.length > 0) return false
  return !(item.raw as { hasChildren?: boolean } | undefined)?.hasChildren
}

/** แบน tree เป็นรายการพร้อม depth / path / parent */
export function flattenTree(nodes: TreeOptionItem[], parent?: TreeOptionItem, path: TreeOptionItem[] = []): FlatTreeNode[] {
  const out: FlatTreeNode[] = []
  for (const item of nodes) {
    const currentPath = [...path, item]
    out.push({ item, depth: path.length, parent, path: currentPath, isLeaf: isLeafNode(item) })
    if (item.children?.length) {
      out.push(...flattenTree(item.children, item, currentPath))
    }
  }
  return out
}

export function findTreeOption(nodes: TreeOptionItem[], value: unknown): TreeOptionItem | undefined {
  for (const node of nodes) {
    if (looseEqual(node.value, value)) return node
    if (node.children?.length) {
      const found = findTreeOption(node.children, value)
      if (found) return found
    }
  }
  return undefined
}

export function collectTreeValues(nodes: TreeOptionItem[], includeDisabled = false): Primitive[] {
  const out: Primitive[] = []
  for (const node of nodes) {
    if (includeDisabled || !node.disabled) out.push(node.value)
    if (node.children?.length) out.push(...collectTreeValues(node.children, includeDisabled))
  }
  return out
}

/** รวบรวม descendant values ทั้งหมดของ node */
export function collectDescendantValues(node: TreeOptionItem, includeDisabled = false): Primitive[] {
  if (!node.children?.length) return []
  return collectTreeValues(node.children, includeDisabled)
}

function valueKey(v: unknown): string {
  return String(v)
}

function hasValue(selected: Primitive[], value: Primitive): boolean {
  return selected.some(v => looseEqual(v, value))
}

/** สถานะการเลือกของ node สำหรับแสดง checkbox / indeterminate */
export type CheckState = 'checked' | 'unchecked' | 'indeterminate'

export function getCheckState(
  node: TreeOptionItem,
  selected: Primitive[],
  mode: TreeSelectMode,
): CheckState {
  if (mode === 'independent' || mode === 'leaf-only') {
    return hasValue(selected, node.value) ? 'checked' : 'unchecked'
  }

  // cascade
  if (!node.children?.length) {
    return hasValue(selected, node.value) ? 'checked' : 'unchecked'
  }

  const descendants = collectDescendantValues(node, true)
  if (!descendants.length) {
    return hasValue(selected, node.value) ? 'checked' : 'unchecked'
  }

  const enabled = collectDescendantValues(node, false)
  const selectedCount = enabled.filter(v => hasValue(selected, v)).length
  if (selectedCount === 0) {
    // parent อาจถูกเลือกเองโดยไม่มีลูก (edge) หรือยังไม่เลือก
    return hasValue(selected, node.value) && enabled.length === 0 ? 'checked' : 'unchecked'
  }
  if (selectedCount === enabled.length) return 'checked'
  return 'indeterminate'
}

/**
 * คำนวณค่าใหม่เมื่อ toggle หนึ่ง node
 * - cascade: เลือก/ยกเลิก parent → ลูกทั้งหมด; เก็บเฉพาะ leaf (+ parent ที่เลือกครบ) ตาม convention เก็บทุก node ที่ checked
 * - independent: toggle เฉพาะค่าของ node
 * - leaf-only: toggle ได้เฉพาะ leaf
 */
export function toggleTreeSelection(
  node: TreeOptionItem,
  selected: Primitive[],
  mode: TreeSelectMode,
  multiple: boolean,
): Primitive[] {
  if (node.disabled) return [...selected]

  if (mode === 'leaf-only' && node.children && node.children.length > 0) {
    return [...selected]
  }

  const isSelected = hasValue(selected, node.value)

  if (!multiple) {
    if (mode === 'leaf-only' && node.children && (node.children.length > 0 || (node.raw as { hasChildren?: boolean })?.hasChildren)) {
      return [...selected]
    }
    return isSelected ? [] : [node.value]
  }

  if (mode === 'independent' || mode === 'leaf-only') {
    if (isSelected) return selected.filter(v => !looseEqual(v, node.value))
    return [...selected, node.value]
  }

  // cascade multiple
  const descendants = collectDescendantValues(node, false)
  const targets = [node.value, ...descendants]
  const allChecked = targets.every(v => hasValue(selected, v))

  if (allChecked) {
    return selected.filter(v => !targets.some(t => looseEqual(t, v)))
  }

  const next = [...selected]
  for (const t of targets) {
    if (!hasValue(next, t)) next.push(t)
  }
  // sync ancestors: if all siblings checked, check parent — handled by syncCascadeParents
  return syncCascadeParents(next, node)
}

/** หลังเลือก cascade — อัปเดตสถานะ parent ตามลูก */
export function syncCascadeParents(selected: Primitive[], hint?: TreeOptionItem, roots?: TreeOptionItem[]): Primitive[] {
  // เมื่อไม่มี roots ให้คืนค่าตาม selected (เรียกจากภายนอกพร้อม roots เพื่อ sync ทั้งต้น)
  if (!roots?.length) return selected
  let next = [...selected]

  function walk(nodes: TreeOptionItem[]) {
    for (const node of nodes) {
      if (node.children?.length) {
        walk(node.children)
        const enabled = collectDescendantValues(node, false)
        if (!enabled.length) continue
        const all = enabled.every(v => hasValue(next, v))
        if (all && !node.disabled) {
          if (!hasValue(next, node.value)) next.push(node.value)
        }
        else {
          next = next.filter(v => !looseEqual(v, node.value))
        }
      }
    }
  }
  walk(roots)
  void hint
  return next
}

/** toggle + sync ทั้งต้นไม้ */
export function applyTreeToggle(
  roots: TreeOptionItem[],
  node: TreeOptionItem,
  selected: Primitive[],
  mode: TreeSelectMode,
  multiple: boolean,
): Primitive[] {
  const toggled = toggleTreeSelection(node, selected, mode, multiple)
  if (mode === 'cascade' && multiple) return syncCascadeParents(toggled, node, roots)
  return toggled
}

/**
 * กรอง tree ตามคำค้น — คง ancestor path ของ node ที่ตรง
 * คืน tree ใหม่ (shallow clone) และชุด value ที่ควรกาง
 */
export function filterTree(
  nodes: TreeOptionItem[],
  query: string,
): { nodes: TreeOptionItem[], expanded: Primitive[] } {
  const q = query.trim().toLowerCase()
  if (!q) return { nodes, expanded: [] }

  const expanded: Primitive[] = []

  function match(item: TreeOptionItem): boolean {
    return item.label.toLowerCase().includes(q)
      || (item.description?.toLowerCase().includes(q) ?? false)
      || String(item.value).toLowerCase().includes(q)
  }

  function walk(list: TreeOptionItem[]): TreeOptionItem[] {
    const out: TreeOptionItem[] = []
    for (const item of list) {
      const childResult = item.children?.length ? walk(item.children) : []
      const selfMatch = match(item)
      if (selfMatch || childResult.length) {
        const clone: TreeOptionItem = { ...item }
        if (item.children) {
          clone.children = childResult.length ? childResult : (selfMatch ? item.children : [])
        }
        out.push(clone)
        if (childResult.length || (selfMatch && item.children?.length)) {
          expanded.push(item.value)
        }
      }
    }
    return out
  }

  return { nodes: walk(nodes), expanded }
}

/** ค่า value ที่ควรกางตาม defaultExpanded / expandAll / node.defaultExpanded */
export function resolveDefaultExpanded(
  nodes: TreeOptionItem[],
  opts: { expandAll?: boolean, defaultExpanded?: Primitive[] } = {},
): Primitive[] {
  if (opts.expandAll) return collectTreeValues(nodes, true).filter((v) => {
    const n = findTreeOption(nodes, v)
    return Boolean(n?.children?.length)
  })

  const fromConfig = new Set((opts.defaultExpanded ?? []).map(valueKey))
  const fromNodes: Primitive[] = []

  function walk(list: TreeOptionItem[]) {
    for (const item of list) {
      if (item.defaultExpanded || fromConfig.has(valueKey(item.value))) {
        if (item.children?.length) fromNodes.push(item.value)
      }
      if (item.children?.length) walk(item.children)
    }
  }
  walk(nodes)
  return fromNodes
}

/** อัปเดต children ของ node ใน tree (immutable) */
export function setTreeChildren(
  nodes: TreeOptionItem[],
  parentValue: Primitive,
  children: TreeOptionItem[],
): TreeOptionItem[] {
  return nodes.map((node) => {
    if (looseEqual(node.value, parentValue)) {
      return { ...node, children }
    }
    if (node.children?.length) {
      return { ...node, children: setTreeChildren(node.children, parentValue, children) }
    }
    return node
  })
}

/** ใช้กับ OptionsConfig.map ทั่วไปเมื่อต้องการ map แบบ tree */
export function asTreeMap(map?: OptionsConfig['map'] & { children?: string }): TreeMap | undefined {
  return map
}
