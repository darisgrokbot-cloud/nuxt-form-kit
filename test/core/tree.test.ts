import { describe, expect, it } from 'vitest'
import {
  applyTreeToggle,
  collectDescendantValues,
  filterTree,
  findTreeOption,
  flattenTree,
  getCheckState,
  normalizeTreeOption,
  normalizeTreeOptions,
  resolveDefaultExpanded,
  setTreeChildren,
  syncCascadeParents,
  toggleTreeSelection,
} from '../../src/runtime/core/tree'
import type { TreeOptionItem } from '../../src/runtime/core/types'
import { emptyValueOf, validateSchema } from '../../src/runtime/core/schema'
import type { FieldSchema, FormSchema } from '../../src/runtime/core/types'

const sample: TreeOptionItem[] = [
  {
    label: 'อิเล็กทรอนิกส์',
    value: 'it',
    children: [
      {
        label: 'คอมพิวเตอร์',
        value: 'dev',
        children: [
          { label: 'โน้ตบุ๊ก', value: 'fe', description: 'Vue / Nuxt' },
          { label: 'เดสก์ท็อป', value: 'be', disabled: true },
        ],
      },
      { label: 'อุปกรณ์เครือข่าย', value: 'infra' },
    ],
  },
  {
    label: 'ของใช้ในบ้าน',
    value: 'hr',
    defaultExpanded: true,
    children: [
      { label: 'เฟอร์นิเจอร์', value: 'recruit' },
      { label: 'ของตกแต่ง', value: 'welfare', icon: 'i-lucide-heart' },
    ],
  },
]

describe('normalizeTreeOption', () => {
  it('normalizes nested children and common API keys', () => {
    const raw = {
      id: 1,
      name: 'Root',
      items: [
        { id: 2, name: 'Child', disabled: true, icon: 'i-lucide-folder' },
      ],
    }
    const opt = normalizeTreeOption(raw, { label: 'name', value: 'id', children: 'items' })
    expect(opt).toMatchObject({ label: 'Root', value: 1 })
    expect(opt.children).toHaveLength(1)
    expect(opt.children![0]).toMatchObject({ label: 'Child', value: 2, disabled: true, icon: 'i-lucide-folder' })
  })

  it('creates empty children placeholder when hasChildren is true', () => {
    const opt = normalizeTreeOption({ id: 'a', name: 'Lazy', hasChildren: true }, { label: 'name', value: 'id' })
    expect(opt.children).toEqual([])
  })

  it('normalizeTreeOptions handles undefined', () => {
    expect(normalizeTreeOptions(undefined)).toEqual([])
  })
})

describe('flattenTree / findTreeOption', () => {
  it('flattens with depth and path', () => {
    const flat = flattenTree(sample)
    expect(flat.map(n => n.item.value)).toEqual(['it', 'dev', 'fe', 'be', 'infra', 'hr', 'recruit', 'welfare'])
    expect(flat.find(n => n.item.value === 'fe')!.depth).toBe(2)
    expect(flat.find(n => n.item.value === 'fe')!.path.map(p => p.value)).toEqual(['it', 'dev', 'fe'])
    expect(flat.find(n => n.item.value === 'fe')!.isLeaf).toBe(true)
    expect(flat.find(n => n.item.value === 'dev')!.isLeaf).toBe(false)
  })

  it('finds nested nodes by loose equality', () => {
    expect(findTreeOption(sample, 'fe')?.label).toBe('โน้ตบุ๊ก')
    expect(findTreeOption(normalizeTreeOptions([{ id: 1, name: 'A' }], { value: 'id', label: 'name' }), '1')?.label).toBe('A')
  })
})

describe('selection — independent / leaf-only / cascade', () => {
  it('independent toggles only the clicked node', () => {
    expect(toggleTreeSelection(sample[0]!, [], 'independent', true)).toEqual(['it'])
    expect(toggleTreeSelection(sample[0]!, ['it'], 'independent', true)).toEqual([])
  })

  it('leaf-only rejects parent nodes in multiple mode', () => {
    expect(toggleTreeSelection(sample[0]!, [], 'leaf-only', true)).toEqual([])
    const leaf = findTreeOption(sample, 'fe')!
    expect(toggleTreeSelection(leaf, [], 'leaf-only', true)).toEqual(['fe'])
  })

  it('cascade selects descendants and syncs parents', () => {
    const dev = findTreeOption(sample, 'dev')!
    // Desktop (be) is disabled — only notebook (fe) is enabled under computers (+ network under it separately)
    const next = applyTreeToggle(sample, dev, [], 'cascade', true)
    expect(next).toContain('dev')
    expect(next).toContain('fe')
    expect(next).not.toContain('be')
  })

  it('cascade selecting all siblings checks the parent', () => {
    let selected: import('../../src/runtime/core/types').Primitive[] = ['recruit', 'welfare']
    selected = syncCascadeParents(selected, undefined, sample)
    expect(selected).toContain('hr')
  })

  it('cascade toggle off clears descendants', () => {
    const it = findTreeOption(sample, 'it')!
    const selected = applyTreeToggle(sample, it, ['it', 'dev', 'fe', 'infra'], 'cascade', true)
    expect(selected).toEqual([])
  })

  it('single select replaces the value', () => {
    const fe = findTreeOption(sample, 'fe')!
    expect(toggleTreeSelection(fe, ['infra'], 'independent', false)).toEqual(['fe'])
    expect(toggleTreeSelection(fe, ['fe'], 'independent', false)).toEqual([])
  })

  it('disabled nodes are ignored', () => {
    const be = findTreeOption(sample, 'be')!
    expect(toggleTreeSelection(be, [], 'independent', true)).toEqual([])
  })
})

describe('getCheckState / indeterminate', () => {
  it('reports indeterminate for partially selected parents in cascade', () => {
    // it → enabled descendants: dev, fe, infra — เลือกแค่ fe = บางส่วน
    expect(getCheckState(findTreeOption(sample, 'it')!, ['fe'], 'cascade')).toBe('indeterminate')
    // dev → enabled descendants: เฉพาะ fe (be disabled) — เลือก fe ครบ = checked
    expect(getCheckState(findTreeOption(sample, 'dev')!, ['fe'], 'cascade')).toBe('checked')
    // hr → เลือกแค่ recruit = บางส่วน
    expect(getCheckState(findTreeOption(sample, 'hr')!, ['recruit'], 'cascade')).toBe('indeterminate')
  })

  it('reports checked when all enabled descendants are selected', () => {
    // under hr: recruit + welfare (both enabled)
    expect(getCheckState(findTreeOption(sample, 'hr')!, ['hr', 'recruit', 'welfare'], 'cascade')).toBe('checked')
  })

  it('independent ignores children when checking parent', () => {
    expect(getCheckState(findTreeOption(sample, 'it')!, ['fe'], 'independent')).toBe('unchecked')
    expect(getCheckState(findTreeOption(sample, 'it')!, ['it'], 'independent')).toBe('checked')
  })
})

describe('filterTree', () => {
  it('keeps ancestors of matches and returns values to expand', () => {
    const { nodes, expanded } = filterTree(sample, 'โน้ต')
    expect(nodes).toHaveLength(1)
    expect(nodes[0]!.value).toBe('it')
    expect(nodes[0]!.children![0]!.children!.map(c => c.value)).toEqual(['fe'])
    expect(expanded).toEqual(expect.arrayContaining(['it', 'dev']))
  })

  it('matches description and returns original tree for empty query', () => {
    expect(filterTree(sample, '  ').nodes).toBe(sample)
    const { nodes } = filterTree(sample, 'Vue')
    expect(findTreeOption(nodes, 'fe')?.label).toBe('โน้ตบุ๊ก')
  })
})

describe('expand helpers', () => {
  it('resolveDefaultExpanded respects expandAll, defaultExpanded config and node flag', () => {
    expect(resolveDefaultExpanded(sample, { expandAll: true }).sort()).toEqual(['dev', 'hr', 'it'].sort())
    // รวมทั้ง defaultExpanded จาก config และ node.defaultExpanded
    expect(resolveDefaultExpanded(sample, { defaultExpanded: ['it'] }).sort()).toEqual(['hr', 'it'].sort())
    expect(resolveDefaultExpanded(sample)).toEqual(['hr'])
  })

  it('setTreeChildren replaces children immutably', () => {
    const next = setTreeChildren(sample, 'infra', [{ label: 'Network', value: 'net' }])
    expect(findTreeOption(sample, 'infra')?.children).toBeUndefined()
    expect(findTreeOption(next, 'infra')?.children).toEqual([{ label: 'Network', value: 'net' }])
    expect(next).not.toBe(sample)
  })

  it('collectDescendantValues skips disabled by default', () => {
    const it = findTreeOption(sample, 'it')!
    expect(collectDescendantValues(it)).toEqual(['dev', 'fe', 'infra'])
    expect(collectDescendantValues(it, true)).toEqual(['dev', 'fe', 'be', 'infra'])
  })
})

describe('schema integration for tree-select', () => {
  it('emptyValueOf uses [] for multiple tree-select', () => {
    expect(emptyValueOf({ key: 'a', type: 'tree-select', multiple: true, options: { items: [] } } as FieldSchema)).toEqual([])
    expect(emptyValueOf({ key: 'a', type: 'tree-select', options: { items: [] } } as FieldSchema)).toBeNull()
  })

  it('validateSchema requires options for tree-select', () => {
    const bad: FormSchema = [{ key: 'org', type: 'tree-select' } as never]
    const messages = validateSchema(bad).map(i => i.message)
    expect(messages).toContain('field "org" (tree-select) needs options.items or options.source')
  })

  it('validateSchema accepts tree-select with items', () => {
    const ok: FormSchema = [{
      key: 'org',
      type: 'tree-select',
      options: { items: [{ label: 'A', value: 'a', children: [{ label: 'B', value: 'b' }] }] },
    }]
    expect(validateSchema(ok).filter(i => i.level === 'error')).toEqual([])
  })
})
