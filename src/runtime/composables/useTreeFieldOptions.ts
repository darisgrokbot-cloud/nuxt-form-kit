import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { resolveTemplate } from '../core/template'
import type {
  FieldSchema,
  OptionItem,
  Primitive,
  TreeOptionItem,
  TreeOptionsConfig,
  TreeSourceFn,
} from '../core/types'
import {
  findTreeOption,
  flattenTree,
  normalizeTreeOptions,
  setTreeChildren,
} from '../core/tree'
import { isEmpty } from '../core/utils'
import type { SchemaFormInstance } from './useSchemaForm'
import type { FieldOptionsState } from './useFieldOptions'

export interface TreeFieldOptionsState extends FieldOptionsState {
  /** ต้นไม้เต็มรูปแบบ */
  treeItems: Ref<TreeOptionItem[]>
  /** โหลด children ของ node (lazy) */
  loadChildren: (node: TreeOptionItem) => Promise<void>
  /** value ของ node ที่กำลังโหลด children */
  loadingParent: Ref<Primitive | null>
}

function asArray(value: unknown): Primitive[] {
  if (isEmpty(value)) return []
  return (Array.isArray(value) ? value : [value]) as Primitive[]
}

export function useTreeFieldOptions(fieldRef: Ref<FieldSchema>, form: SchemaFormInstance): TreeFieldOptionsState {
  const field = computed(() => fieldRef.value)
  const key = computed(() => field.value.key)
  const cfg = computed<TreeOptionsConfig>(() => (field.value as { options?: TreeOptionsConfig }).options ?? {})

  const sourceFn = computed<TreeSourceFn | undefined>(() => {
    const src = cfg.value.source
    if (!src) return undefined
    if (typeof src === 'function') return src as TreeSourceFn
    const fn = form.sources.value[src]
    if (!fn) console.error(`[schema-form] source "${src}" is not registered (field "${key.value}")`)
    return fn as TreeSourceFn | undefined
  })

  const staticTree = computed(() => normalizeTreeOptions(cfg.value.items as unknown[] | undefined, cfg.value.map))
  const remoteTree = ref<TreeOptionItem[]>([])
  const selectedCache = ref<OptionItem[]>([])
  const loading = ref(false)
  const loadingParent = ref<Primitive | null>(null)
  const error = ref<string | null>(null)
  const searchTerm = ref('')
  const loaded = ref(false)
  let controller: AbortController | null = null

  const value = computed(() => form.state.value[key.value])
  const params = computed(() => resolveTemplate(cfg.value.params ?? {}, form.state.value) as Record<string, unknown>)
  const blocked = computed(() => form.isDependsOnBlocked(key.value))

  const treeItems = computed(() => (sourceFn.value ? remoteTree.value : staticTree.value))

  const flatItems = computed<OptionItem[]>(() => {
    const flat = flattenTree(treeItems.value).map(n => n.item)
    const selected = asArray(value.value)
    const missing = selectedCache.value.filter(o => selected.some(v => String(v) === String(o.value)))
    const seen = new Set(flat.map(o => String(o.value)))
    return [...flat, ...missing.filter(o => !seen.has(String(o.value)))]
  })

  function rememberSelected() {
    const selected = asArray(value.value)
    if (!selected.length) return
    const found: OptionItem[] = []
    for (const v of selected) {
      const opt = findTreeOption(treeItems.value, v) ?? selectedCache.value.find(o => String(o.value) === String(v))
      if (opt) found.push({ label: opt.label, value: opt.value, description: opt.description, icon: opt.icon, disabled: opt.disabled })
    }
    const seen = new Set(found.map(o => String(o.value)))
    selectedCache.value = [...found, ...selectedCache.value.filter(o => !seen.has(String(o.value)))]
  }

  function seedFromLabelFrom() {
    const from = cfg.value.labelFrom
    if (!from) return
    const labels = asArray(form.state.value[from])
    const selected = asArray(value.value)
    const seeded = selected
      .map((v, i) => ({ value: v, label: labels[i] === undefined ? undefined : String(labels[i]) }))
      .filter((o): o is OptionItem => o.label !== undefined)
    const seen = new Set(seeded.map(o => String(o.value)))
    selectedCache.value = [...seeded, ...selectedCache.value.filter(o => !seen.has(String(o.value)))]
  }

  async function loadRoot() {
    const fn = sourceFn.value
    if (!fn) return
    if (blocked.value) {
      controller?.abort()
      remoteTree.value = []
      loading.value = false
      return
    }

    controller?.abort()
    const current = new AbortController()
    controller = current
    loading.value = true
    error.value = null

    try {
      const result = await fn({
        search: '',
        params: params.value,
        values: form.state.value,
        selected: asArray(value.value),
        signal: current.signal,
        parent: undefined,
      })
      if (current.signal.aborted) return
      const raw = Array.isArray(result) ? result : (result?.items ?? [])
      remoteTree.value = normalizeTreeOptions(raw, cfg.value.map)
      loaded.value = true
      rememberSelected()
    }
    catch (e) {
      if (current.signal.aborted || (e as { name?: string })?.name === 'AbortError') return
      error.value = form.messages.value.loadError
      console.error(`[schema-form] failed to load tree options for "${key.value}"`, e)
    }
    finally {
      if (controller === current) {
        loading.value = false
        controller = null
      }
    }
  }

  async function loadChildren(node: TreeOptionItem) {
    const fn = sourceFn.value
    if (!fn || node.disabled) return
    if (node.children && node.children.length > 0) return

    const hasChildrenFlag = (node.raw as { hasChildren?: boolean } | undefined)?.hasChildren === true
    const isEmptyPlaceholder = Array.isArray(node.children) && node.children.length === 0
    if (!hasChildrenFlag && !isEmptyPlaceholder) return
    // children: [] โดยไม่มี hasChildren แปลว่าโหลดแล้วว่าง — ไม่โหลดซ้ำ
    if (isEmptyPlaceholder && !hasChildrenFlag) return

    loadingParent.value = node.value
    error.value = null
    const current = new AbortController()

    try {
      const result = await fn({
        search: '',
        params: params.value,
        values: form.state.value,
        selected: asArray(value.value),
        signal: current.signal,
        parent: node,
      })
      if (current.signal.aborted) return
      const raw = Array.isArray(result) ? result : (result?.items ?? [])
      const children = normalizeTreeOptions(raw, cfg.value.map)
      remoteTree.value = setTreeChildren(remoteTree.value, node.value, children)
      rememberSelected()
    }
    catch (e) {
      if (current.signal.aborted || (e as { name?: string })?.name === 'AbortError') return
      error.value = form.messages.value.loadError
      console.error(`[schema-form] failed to load tree children for "${key.value}"`, e)
    }
    finally {
      if (loadingParent.value === node.value) loadingParent.value = null
    }
  }

  function needsLoad(): boolean {
    if (!sourceFn.value) return false
    if (!form.isReadonly(key.value)) return true
    const selected = asArray(value.value)
    return selected.some(v => !findTreeOption(treeItems.value, v) && !selectedCache.value.some(o => String(o.value) === String(v)))
  }

  seedFromLabelFrom()

  onMounted(() => {
    if (needsLoad()) void loadRoot()
  })

  onBeforeUnmount(() => {
    controller?.abort()
  })

  watch(() => JSON.stringify([params.value, blocked.value]), () => {
    if (!sourceFn.value) return
    if (!loaded.value && form.isReadonly(key.value)) return
    void loadRoot()
  })

  watch(() => form.refreshTicks[key.value], () => {
    if (sourceFn.value) void loadRoot()
  })

  watch(value, () => rememberSelected())
  watch(() => cfg.value.labelFrom && form.state.value[cfg.value.labelFrom!], () => seedFromLabelFrom())

  return {
    items: flatItems,
    treeItems,
    loading,
    error,
    hasMore: computed(() => false),
    searchTerm,
    serverSearch: computed(() => false),
    loadMore: async () => {},
    reload: () => loadRoot(),
    labelOf: (v: unknown) => findTreeOption(treeItems.value, v)?.label
      ?? selectedCache.value.find(o => String(o.value) === String(v))?.label,
    loadChildren,
    loadingParent,
  }
}
