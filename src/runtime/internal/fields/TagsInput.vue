<script setup lang="ts">
import { computed } from 'vue'
import type { TagsField } from '../../core/types'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<TagsField>>()
const model = defineModel<string[]>()

const unique = computed(() => props.field.unique ?? true)

const tags = computed({
  get: () => (Array.isArray(model.value) ? model.value : []),
  set: (v: string[] | undefined) => {
    model.value = Array.isArray(v) ? v : []
  },
})
</script>

<template>
  <UInputTags
    v-model="tags"
    :placeholder="placeholder"
    :disabled="disabled"
    :max="field.max"
    :duplicate="!unique"
    class="w-full"
    data-sf-tags-input
    v-bind="field.props"
  />
</template>
