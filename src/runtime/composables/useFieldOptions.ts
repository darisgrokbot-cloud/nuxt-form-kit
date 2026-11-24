import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { findOption, mergeOptions, normalizeOptions, normalizeSourceResult, searchConfig } from '../core/options'
import { resolveTemplate } from '../core/template'
import type { FieldSchema, OptionItem, OptionsConfig, Primitive, SourceFn } from '../core/types'
import { debounce, isEmpty } from '../core/utils'
import type { FormKitInstance } from './useFormKit'

export interface FieldOptionsState {
  items: Ref<OptionItem[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  hasMore: Ref<boolean>
  searchTerm: Ref<string>
  /** ค้นหาฝั่ง server หรือไม่ (ถ้าใช่ ต้องปิด filter ของ component) */
  serverSearch: Ref<boolean>
  loadMore: () => Promise<void>
  reload: () => Promise<void>
  labelOf: (value: unknown) => string | undefined
}

function asArray(value: unknown): Primitive[] {
  if (isEmpty(value)) return []
  return (Array.isArray(value) ? value : [value]) as Primitive[]
}

export function useFieldOptions(fieldRef: Ref<FieldSchema>, form: FormKitInstance): FieldOptionsState {
  const field = computed(() => fieldRef.value)
  const key = computed(() => field.value.key)
  const cfg = computed<OptionsConfig>(() => (field.value as { options?: OptionsConfig }).options ?? {})
  const isAutocomplete = computed(() => field.value.type === 'autocomplete')
  const search = computed(() => searchConfig(cfg.value, isAutocomplete.value))
  const pageSize = computed(() => cfg.value.pageSize ?? 20)

  const sourceFn = computed<SourceFn | undefined>(() => {
    const src = cfg.value.source
    if (!src) return undefined
    if (typeof src === 'function') return src
    const fn = form.sources.value[src]
    if (!fn) console.error(`[form-kit] source "${src}" is not registered (field "${key.value}")`)
    return fn
  })

  const staticItems = computed(() => normalizeOptions(cfg.value.items as unknown[] | undefined, cfg.value.map))
  const remoteItems = ref<OptionItem[]>([])
  const selectedCache = ref<OptionItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(false)
  const searchTerm = ref('')
  const loaded = ref(false)
  let page = 1
  let controller: AbortController | null = null

  const value = computed(() => form.state.value[key.value])
  const params = computed(() => resolveTemplate(cfg.value.params ?? {}, form.state.value) as Record<string, unknown>)
  const blocked = computed(() => form.isDependsOnBlocked(key.value))

  const baseItems = computed(() => (sourceFn.value ? remoteItems.value : staticItems.value))

  /** รวม item ที่ถูกเลือกอยู่ไว้เสมอ เพื่อให้ component แสดง label ได้แม้ไม่อยู่ในผลค้นหา */
  const items = computed(() => {
    const selected = asArray(value.value)
    const missing = selectedCache.value.filter(o => selected.some(v => String(v) === String(o.value)))
    return mergeOptions(baseItems.value, missing)
  })

  function rememberSelected() {
    const selected = asArray(value.value)
    if (!selected.length) return
    const found: OptionItem[] = []
    for (const v of selected) {
      const opt = findOption(baseItems.value, v) ?? findOption(selectedCache.value, v)
      if (opt) found.push(opt)
    }
    selectedCache.value = mergeOptions(found, selectedCache.value)
  }

  function seedFromLabelFrom() {
    const from = cfg.value.labelFrom
    if (!from) return
    const labels = asArray(form.state.value[from])
    const selected = asArray(value.value)
    const seeded = selected
      .map((v, i) => ({ value: v, label: labels[i] === undefined ? undefined : String(labels[i]) }))
      .filter((o): o is OptionItem => o.label !== undefined)
    selectedCache.value = mergeOptions(selectedCache.value, seeded)
  }

  function autoSelect() {
    if (!cfg.value.autoSelectSingle || form.isReadonly(key.value) || !isEmpty(value.value)) return
    if (searchTerm.value) return
    const enabled = baseItems.value.filter(o => !o.disabled)
    if (enabled.length !== 1) return
    const only = enabled[0]!.value
    const multiple = Array.isArray(value.value) || Boolean((field.value as { multiple?: boolean }).multiple)
    form.setValue(key.value, multiple ? [only] : only)
  }

  async function load(append = false) {
    const fn = sourceFn.value
    if (!fn) {
      autoSelect()
      return
    }
    if (blocked.value) {
      controller?.abort()
      remoteItems.value = []
      hasMore.value = false
      loading.value = false
      return
    }

    controller?.abort()
    const current = new AbortController()
    controller = current
    loading.value = true
    error.value = null
    const nextPage = append ? page + 1 : 1

    try {
      const result = await fn({
        search: searchTerm.value,
        page: nextPage,
        pageSize: pageSize.value,
        params: params.value,
        values: form.state.value,
        selected: asArray(value.value),
        signal: current.signal,
      })
      if (current.signal.aborted) return
      const { items: raw, hasMore: more } = normalizeSourceResult(result, pageSize.value)
      const normalized = normalizeOptions(raw, cfg.value.map)
      remoteItems.value = append ? mergeOptions(remoteItems.value, normalized) : normalized
      page = nextPage
      hasMore.value = more
      loaded.value = true
      rememberSelected()
      autoSelect()
    }
    catch (e) {
      if (current.signal.aborted || (e as { name?: string })?.name === 'AbortError') return
      error.value = form.messages.value.loadError
      console.error(`[form-kit] failed to load options for "${key.value}"`, e)
    }
    finally {
      if (controller === current) {
        loading.value = false
        controller = null
      }
    }
  }

  const debouncedLoad = debounce(() => {
    void load()
  }, search.value?.debounce ?? 300)

  /** ใน view mode ไม่ต้องโหลด ถ้ารู้ label อยู่แล้ว */
  function needsLoad(): boolean {
    if (!sourceFn.value) return false
    if (!form.isReadonly(key.value)) return true
    const selected = asArray(value.value)
    return selected.some(v => !findOption(items.value, v))
  }

  // seed label ตั้งแต่ setup — component ลูก (InputMenu) อ่าน items ตอน mount
  seedFromLabelFrom()

  onMounted(() => {
    if (needsLoad()) void load()
    else autoSelect()
  })

  onBeforeUnmount(() => {
    debouncedLoad.cancel()
    controller?.abort()
  })

  // ค้นหาฝั่ง server
  watch(searchTerm, (term) => {
    if (!search.value || !sourceFn.value) return
    if (term.length > 0 && term.length < search.value.minChars) return
    debouncedLoad()
  })

  // params / แม่ (dependsOn) เปลี่ยน → โหลดใหม่
  watch(() => JSON.stringify([params.value, blocked.value]), () => {
    if (!loaded.value && form.isReadonly(key.value)) return
    void load()
  })

  // refreshOptions() จาก form instance
  watch(() => form.refreshTicks[key.value], () => {
    void load()
  })

  // static items เปลี่ยน (เช่นมาจาก ref) → ลอง autoSelect
  watch(staticItems, () => {
    if (!sourceFn.value) autoSelect()
  })

  // ค่าถูกตั้งจากโค้ด (เช่น setValue) แต่ยังไม่รู้ label → โหลดใหม่โดยส่ง selected ไปให้ source
  watch(value, () => {
    rememberSelected()
    const unknown = asArray(value.value).some(v => !findOption(items.value, v))
    if (unknown && sourceFn.value && !loading.value) void load()
  })
  watch(() => cfg.value.labelFrom && form.state.value[cfg.value.labelFrom], () => seedFromLabelFrom())

  return {
    items,
    loading,
    error,
    hasMore,
    searchTerm,
    serverSearch: computed(() => Boolean(search.value && sourceFn.value)),
    loadMore: () => load(true),
    reload: () => load(),
    labelOf: (v: unknown) => findOption(items.value, v)?.label,
  }
}
