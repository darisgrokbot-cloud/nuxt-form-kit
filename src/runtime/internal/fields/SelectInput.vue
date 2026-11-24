<script setup lang="ts">
import { computed } from 'vue'
import type { Primitive, SelectField } from '../../core/types'
import type { FieldComponentProps } from '../types'
import LoadMore from './LoadMore.vue'

const props = defineProps<FieldComponentProps<SelectField>>()
const model = defineModel<Primitive | Primitive[] | null>()

const items = computed(() => props.options?.items ?? [])
const searchable = computed(() => props.field.searchable ?? (props.options?.serverSearch || items.value.length > 7))
const clearable = computed(() => props.field.clearable ?? true)

const searchTerm = computed({
  get: () => props.options?.searchTerm ?? '',
  set: (v: string) => {
    if (props.options) props.options.searchTerm = v
  },
})
</script>

<template>
  <USelectMenu
    v-model="model as any"
    v-model:search-term="searchTerm"
    :items="items"
    value-key="value"
    label-key="label"
    description-key="description"
    :multiple="field.multiple"
    :placeholder="placeholder ?? messages.selectPlaceholder"
    :disabled="disabled"
    :loading="options?.loading"
    :search-input="searchable ? { placeholder: messages.search } : false"
    :ignore-filter="options?.serverSearch"
    :clear="clearable"
    class="w-full"
    v-bind="field.props"
  >
    <template #empty>
      {{ options?.loading ? messages.loading : (options?.error ?? messages.noOptions) }}
    </template>
    <template v-if="options?.hasMore" #content-bottom>
      <LoadMore :label="messages.loadMore" :loading="options.loading" @load="options.loadMore()" />
    </template>
  </USelectMenu>
</template>
