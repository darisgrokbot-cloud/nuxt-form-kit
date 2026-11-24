<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Primitive, TreeOptionItem, TreeSelectField, TreeSelectMode } from '../../core/types'
import {
  applyTreeToggle,
  filterTree,
  findTreeOption,
  flattenTree,
  getCheckState,
  resolveDefaultExpanded,
} from '../../core/tree'
import { isEmpty, looseEqual } from '../../core/utils'
import type { FieldComponentProps } from '../types'

type TreeOptionsView = NonNullable<FieldComponentProps<TreeSelectField>['options']> & {
  treeItems?: TreeOptionItem[]
  loadChildren?: (node: TreeOptionItem) => Promise<void>
  loadingParent?: Primitive | null
}

const props = defineProps<FieldComponentProps<TreeSelectField>>()
const model = defineModel<Primitive | Primitive[] | null>()

const open = ref(false)
const search = ref('')
const expanded = ref<Set<string>>(new Set())
const listRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(-1)

const multiple = computed(() => Boolean(props.field.multiple))
const clearable = computed(() => props.field.clearable ?? true)
const mode = computed<TreeSelectMode>(() => props.field.selectionMode ?? (multiple.value ? 'cascade' : 'independent'))
const treeOptions = computed(() => props.options as TreeOptionsView | undefined)

const roots = computed<TreeOptionItem[]>(() => {
  const fromOptions = treeOptions.value?.treeItems
  if (fromOptions) return fromOptions
  return []
})

const searchable = computed(() => {
  if (props.field.searchable !== undefined) return props.field.searchable
  if (props.field.options.searchable !== undefined) return props.field.options.searchable
  return flattenTree(roots.value).length > 7
})

const filtered = computed(() => {
  if (!search.value.trim()) return { nodes: roots.value, expanded: [] as Primitive[] }
  return filterTree(roots.value, search.value)
})

const visibleNodes = computed(() => {
  const nodes = filtered.value.nodes
  const out: Array<{ item: TreeOptionItem, depth: number, isLeaf: boolean }> = []

  function walk(list: TreeOptionItem[], depth: number) {
    for (const item of list) {
      const isLeaf = !Array.isArray(item.children)
        || (item.children.length === 0 && !(item.raw as { hasChildren?: boolean } | undefined)?.hasChildren)
      out.push({ item, depth, isLeaf })
      const key = String(item.value)
      const shouldExpand = expanded.value.has(key) || filtered.value.expanded.some(v => looseEqual(v, item.value))
      if (item.children?.length && shouldExpand) {
        walk(item.children, depth + 1)
      }
    }
  }
  walk(nodes, 0)
  return out
})

const selectedValues = computed<Primitive[]>(() => {
  if (isEmpty(model.value)) return []
  return (Array.isArray(model.value) ? model.value : [model.value]) as Primitive[]
})

const displayLabel = computed(() => {
  const selected = selectedValues.value
  if (!selected.length) return ''
  if (multiple.value && selected.length > 1) {
    return (props.messages.selectedCount || '{count} selected').replace('{count}', String(selected.length))
  }
  const first = selected[0]
  return findTreeOption(roots.value, first)?.label
    ?? treeOptions.value?.labelOf?.(first)
    ?? String(first)
})

function isExpanded(item: TreeOptionItem) {
  return expanded.value.has(String(item.value))
    || filtered.value.expanded.some(v => looseEqual(v, item.value))
}

function initExpanded() {
  const defaults = resolveDefaultExpanded(roots.value, {
    expandAll: props.field.options.expandAll,
    defaultExpanded: props.field.options.defaultExpanded,
  })
  expanded.value = new Set(defaults.map(String))
}

watch(roots, () => {
  if (expanded.value.size === 0) initExpanded()
}, { immediate: true })

watch(search, (q) => {
  if (q.trim()) {
    const { expanded: auto } = filterTree(roots.value, q)
    for (const v of auto) expanded.value.add(String(v))
  }
})

watch(open, async (isOpen) => {
  if (isOpen) {
    activeIndex.value = 0
    await nextTick()
    searchRef.value?.focus()
  }
  else {
    search.value = ''
    activeIndex.value = -1
  }
})

function setModel(next: Primitive[]) {
  if (multiple.value) {
    model.value = next
  }
  else {
    model.value = next.length ? next[0]! : null
    open.value = false
  }
}

function onToggleExpand(item: TreeOptionItem, event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  const key = String(item.value)
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else {
    next.add(key)
    const loadChildren = treeOptions.value?.loadChildren
    if (loadChildren && Array.isArray(item.children) && item.children.length === 0) {
      void loadChildren(item)
    }
  }
  expanded.value = next
}

function onSelectNode(item: TreeOptionItem) {
  if (props.disabled || item.disabled) return
  if (mode.value === 'leaf-only') {
    const hasKids = Array.isArray(item.children) && (
      item.children.length > 0
      || (item.raw as { hasChildren?: boolean } | undefined)?.hasChildren
    )
    if (hasKids) {
      onToggleExpand(item)
      return
    }
  }
  const next = applyTreeToggle(roots.value, item, selectedValues.value, mode.value, multiple.value)
  setModel(next)
}

function clear(event?: Event) {
  event?.stopPropagation()
  if (props.disabled || !clearable.value) return
  model.value = multiple.value ? [] : null
}

function expandAll() {
  for (const n of flattenTree(roots.value)) {
    if (!n.isLeaf) expanded.value.add(String(n.item.value))
  }
  expanded.value = new Set(expanded.value)
}

function collapseAll() {
  expanded.value = new Set()
}

function checkStateOf(item: TreeOptionItem) {
  return getCheckState(item, selectedValues.value, mode.value)
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    open.value = true
  }
  else if (e.key === 'Escape') {
    open.value = false
  }
}

function onListKeydown(e: KeyboardEvent) {
  const len = visibleNodes.value.length
  if (!len) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % len
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + len) % len
  }
  else if (e.key === 'ArrowRight') {
    const node = visibleNodes.value[activeIndex.value]
    if (node && !node.isLeaf && !isExpanded(node.item)) onToggleExpand(node.item)
  }
  else if (e.key === 'ArrowLeft') {
    const node = visibleNodes.value[activeIndex.value]
    if (node && isExpanded(node.item)) onToggleExpand(node.item)
  }
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const node = visibleNodes.value[activeIndex.value]
    if (node) onSelectNode(node.item)
  }
  else if (e.key === 'Escape') {
    open.value = false
  }
}

const placeholderText = computed(() => props.placeholder ?? props.messages.selectPlaceholder)
</script>

<template>
  <UPopover
    v-model:open="open"
    :disabled="disabled"
    :content="{ side: 'bottom', sideOffset: 8, collisionPadding: 8 }"
    class="w-full"
  >
    <button
      type="button"
      role="combobox"
      :aria-expanded="open"
      :aria-disabled="disabled || undefined"
      aria-haspopup="listbox"
      :disabled="disabled"
      class="group relative inline-flex w-full items-center gap-1.5 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm shadow-xs transition-colors hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverted disabled:cursor-not-allowed disabled:opacity-50"
      :class="[field.props?.class]"
      data-fk-tree-select-trigger
      @keydown="onTriggerKeydown"
    >
      <span
        class="truncate text-left flex-1"
        :class="displayLabel ? 'text-default' : 'text-dimmed'"
      >
        {{ displayLabel || placeholderText }}
      </span>
      <UButton
        v-if="clearable && selectedValues.length && !disabled"
        type="button"
        color="neutral"
        variant="link"
        size="xs"
        icon="i-lucide-x"
        class="shrink-0"
        :aria-label="'clear'"
        @click="clear"
      />
      <UIcon
        name="i-lucide-chevrons-up-down"
        class="size-4 shrink-0 text-dimmed"
      />
    </button>

    <template #content>
      <div
        class="flex w-(--reka-popover-trigger-width) min-w-64 flex-col gap-1 p-1"
        data-fk-tree-select-panel
        @keydown="onListKeydown"
      >
        <div v-if="searchable" class="p-1">
          <UInput
            ref="searchRef"
            v-model="search"
            :placeholder="messages.search"
            icon="i-lucide-search"
            size="sm"
            autofocus
            autocomplete="off"
            data-fk-tree-select-search
          />
        </div>

        <div class="flex items-center justify-between gap-1 px-1">
          <UButton
            type="button"
            size="xs"
            color="neutral"
            variant="ghost"
            :label="messages.expandAll"
            @click="expandAll"
          />
          <UButton
            type="button"
            size="xs"
            color="neutral"
            variant="ghost"
            :label="messages.collapseAll"
            @click="collapseAll"
          />
        </div>

        <div
          ref="listRef"
          role="listbox"
          :aria-multiselectable="multiple || undefined"
          class="max-h-64 overflow-auto py-1"
        >
          <p v-if="options?.loading && !roots.length" class="px-2 py-3 text-sm text-muted">
            {{ messages.loading }}
          </p>
          <p v-else-if="options?.error" class="px-2 py-3 text-sm text-error">
            {{ options.error }}
          </p>
          <p v-else-if="!visibleNodes.length" class="px-2 py-3 text-sm text-muted">
            {{ messages.noOptions }}
          </p>
          <template v-else>
            <div
              v-for="(node, index) in visibleNodes"
              :key="String(node.item.value)"
              role="option"
              :aria-selected="checkStateOf(node.item) === 'checked'"
              :aria-disabled="node.item.disabled || undefined"
              :data-active="activeIndex === index || undefined"
              :data-depth="node.depth"
              class="flex w-full items-center gap-1 rounded-md px-1 py-1 text-sm transition-colors"
              :class="[
                activeIndex === index ? 'bg-elevated' : 'hover:bg-elevated/60',
                node.item.disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer',
              ]"
              :style="{ paddingInlineStart: `${0.25 + node.depth * 0.85}rem` }"
              data-fk-tree-node
              @mouseenter="activeIndex = index"
              @click="onSelectNode(node.item)"
            >
              <button
                v-if="!node.isLeaf"
                type="button"
                class="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-accented/50"
                tabindex="-1"
                :aria-label="isExpanded(node.item) ? messages.collapseAll : messages.expandAll"
                data-fk-tree-expand
                @click="onToggleExpand(node.item, $event)"
              >
                <UIcon
                  :name="isExpanded(node.item) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="size-3.5"
                />
              </button>
              <span v-else class="size-5 shrink-0" />

              <span
                v-if="multiple"
                class="inline-flex size-4 shrink-0 items-center justify-center rounded border border-default"
                :class="{
                  'bg-primary border-primary text-inverted': checkStateOf(node.item) === 'checked',
                  'bg-primary/40 border-primary': checkStateOf(node.item) === 'indeterminate',
                }"
                data-fk-tree-check
              >
                <UIcon
                  v-if="checkStateOf(node.item) === 'checked'"
                  name="i-lucide-check"
                  class="size-3"
                />
                <UIcon
                  v-else-if="checkStateOf(node.item) === 'indeterminate'"
                  name="i-lucide-minus"
                  class="size-3"
                />
              </span>
              <span
                v-else
                class="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-default"
                :class="{ 'border-primary': checkStateOf(node.item) === 'checked' }"
              >
                <span
                  v-if="checkStateOf(node.item) === 'checked'"
                  class="size-2 rounded-full bg-primary"
                />
              </span>

              <UIcon
                v-if="node.item.icon"
                :name="node.item.icon"
                class="size-4 shrink-0 text-dimmed"
              />

              <span class="min-w-0 flex-1 truncate">
                <span class="text-default">{{ node.item.label }}</span>
                <span
                  v-if="node.item.description"
                  class="ml-1 text-xs text-muted"
                >{{ node.item.description }}</span>
              </span>

              <UIcon
                v-if="treeOptions?.loadingParent != null && looseEqual(treeOptions.loadingParent, node.item.value)"
                name="i-lucide-loader-circle"
                class="size-3.5 shrink-0 animate-spin text-muted"
              />
            </div>
          </template>
        </div>
      </div>
    </template>
  </UPopover>
</template>
