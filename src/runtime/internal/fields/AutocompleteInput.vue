<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AutocompleteField, Primitive } from '../../core/types'
import type { FieldComponentProps } from '../types'
import LoadMore from './LoadMore.vue'

const props = defineProps<FieldComponentProps<AutocompleteField>>()
const model = defineModel<Primitive | Primitive[] | null>()

const items = computed(() => props.options?.items ?? [])

// InputMenu คำนวณข้อความที่แสดงเฉพาะตอน modelValue เปลี่ยน
// ถ้า label ของค่าที่เลือกมาถึงทีหลัง (โหลดจาก API) ให้ render ใหม่หนึ่งครั้ง
const root = ref<HTMLElement | null>(null)
const renderKey = ref(0)
const selectedLabel = computed(() => (props.field.multiple ? undefined : props.options?.labelOf(model.value)))
watch(selectedLabel, (label, prev) => {
  const focused = root.value?.contains(document.activeElement) ?? false
  if (label !== undefined && prev === undefined && !focused) renderKey.value++
})

const searchTerm = computed({
  get: () => props.options?.searchTerm ?? '',
  set: (v: string) => {
    if (props.options) props.options.searchTerm = v
  },
})
</script>

<template>
  <div ref="root" class="w-full">
    <UInputMenu
      :key="renderKey"
      v-model="model as any"
      v-model:search-term="searchTerm"
      :items="items"
      value-key="value"
      label-key="label"
      description-key="description"
      :multiple="field.multiple"
      :placeholder="placeholder ?? messages.search"
      :disabled="disabled"
      :loading="options?.loading"
      :ignore-filter="options?.serverSearch"
      :clear="field.clearable ?? true"
      open-on-click
      open-on-focus
      class="w-full"
      v-bind="field.props"
    >
      <template #empty>
        {{ options?.loading ? messages.loading : (options?.error ?? messages.noOptions) }}
      </template>
      <template v-if="options?.hasMore" #content-bottom>
        <LoadMore :label="messages.loadMore" :loading="options.loading" @load="options.loadMore()" />
      </template>
    </UInputMenu>
  </div>
</template>
