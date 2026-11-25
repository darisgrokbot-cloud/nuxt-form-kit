<script setup lang="ts">
import { evaluateCondition } from '../core/conditions'
import { spanClass } from '../core/layout'
import { isField } from '../core/schema'
import type { SchemaNode } from '../core/types'
import { useFormContext, useFormGridResponsive, useFormSlots } from './context'
import FieldRenderer from './FieldRenderer.vue'
import SlotOutlet from './SlotOutlet'

defineOptions({ name: 'SfNodeRenderer' })

defineProps<{ nodes: SchemaNode[] }>()

const form = useFormContext()
const slots = useFormSlots()
const gridResponsive = useFormGridResponsive()

function visible(node: SchemaNode) {
  return evaluateCondition(node.visibleWhen, form.state.value, true)
}

function nodeKey(node: SchemaNode, index: number) {
  if (isField(node)) return node.key
  if (node.type === 'slot') return `slot:${node.name}`
  return node.key ?? `${node.type}:${index}`
}

function cellClass(node: SchemaNode) {
  return [spanClass(node.layout?.span, gridResponsive.value), node.layout?.class]
}

function sectionContentId(node: SchemaNode, index: number) {
  return `sf-section-${nodeKey(node, index)}`
}
</script>

<template>
  <template v-for="(node, index) in nodes" :key="nodeKey(node, index)">
    <template v-if="visible(node)">
      <div v-if="isField(node)" :class="cellClass(node)">
        <FieldRenderer :field="node" />
      </div>

      <section
        v-else-if="node.type === 'section'"
        :class="cellClass(node)"
        :data-sf-section="node.key"
        class="rounded-lg border border-default bg-default p-4 sm:p-5"
      >
        <UCollapsible v-if="node.collapsible" :default-open="node.defaultOpen ?? true">
          <template #default="{ open }">
            <button
              type="button"
              class="flex w-full items-start justify-between gap-2 text-left"
              :aria-expanded="open"
              :aria-controls="sectionContentId(node, index)"
            >
              <span>
                <span v-if="node.title" class="block text-base font-semibold text-highlighted">{{ form.t(node.title) }}</span>
                <span v-if="node.description" class="block text-sm text-muted">{{ form.t(node.description) }}</span>
              </span>
              <UIcon name="i-lucide-chevron-down" class="mt-1 size-4 shrink-0 transition-transform" :class="open ? 'rotate-180' : ''" />
            </button>
          </template>
          <template #content>
            <div
              :id="sectionContentId(node, index)"
              class="mt-4 grid grid-cols-12 gap-x-4 gap-y-4"
              role="region"
            >
              <SfNodeRenderer :nodes="node.children" />
            </div>
          </template>
        </UCollapsible>
        <template v-else>
          <header v-if="node.title || node.description" class="mb-4">
            <h3 v-if="node.title" class="text-base font-semibold text-highlighted">
              {{ form.t(node.title) }}
            </h3>
            <p v-if="node.description" class="text-sm text-muted">
              {{ form.t(node.description) }}
            </p>
          </header>
          <div class="grid grid-cols-12 gap-x-4 gap-y-4">
            <SfNodeRenderer :nodes="node.children" />
          </div>
        </template>
      </section>

      <div
        v-else-if="node.type === 'row'"
        :class="cellClass(node)"
        class="grid grid-cols-12 gap-x-4 gap-y-4"
      >
        <SfNodeRenderer :nodes="node.children" />
      </div>

      <div v-else-if="node.type === 'slot' && slots[`slot:${node.name}`]" :class="cellClass(node)">
        <SlotOutlet :slot-fn="slots[`slot:${node.name}`]!" :slot-props="{ values: form.state.value, form }" />
      </div>
    </template>
  </template>
</template>
