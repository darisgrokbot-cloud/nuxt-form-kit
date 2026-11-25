<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FileField } from '../../core/types'
import { format } from '../../core/utils'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<FileField>>()
const model = defineModel<File | File[] | null>()

const localError = ref<string | undefined>()

const multiple = computed(() => Boolean(props.field.multiple))
const preview = computed(() => props.field.preview ?? true)
const maxSize = computed(() => props.field.maxSize)
const maxFiles = computed(() => props.field.maxFiles)

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes % 1024 === 0 ? 0 : 1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`
}

function constrain(files: File[]): { kept: File[], error?: string } {
  let kept = files
  let error: string | undefined

  if (maxSize.value != null) {
    const ok = kept.filter(f => f.size <= maxSize.value!)
    if (ok.length < kept.length) {
      error = format(props.messages.fileTooLarge, { maxSize: formatBytes(maxSize.value) })
    }
    kept = ok
  }

  if (maxFiles.value != null && kept.length > maxFiles.value) {
    error = format(props.messages.tooManyFiles, { maxFiles: maxFiles.value })
    kept = kept.slice(0, maxFiles.value)
  }

  return { kept, error }
}

const uploadModel = computed({
  get: () => {
    if (multiple.value) {
      return Array.isArray(model.value) ? model.value : []
    }
    return model.value instanceof File ? model.value : null
  },
  set: (v: File | File[] | null | undefined) => {
    localError.value = undefined
    if (multiple.value) {
      const list = Array.isArray(v) ? v : v instanceof File ? [v] : []
      const { kept, error } = constrain(list)
      localError.value = error
      model.value = kept
      return
    }
    if (v instanceof File) {
      const { kept, error } = constrain([v])
      localError.value = error
      model.value = kept[0] ?? null
      return
    }
    model.value = null
  },
})

watch(model, () => {
  // Clear transient size/count errors when value cleared externally
  if (
    model.value == null
    || (Array.isArray(model.value) && model.value.length === 0)
  ) {
    localError.value = undefined
  }
})
</script>

<template>
  <div class="w-full space-y-1.5" data-sf-file-input>
    <UFileUpload
      v-model="uploadModel as any"
      :accept="field.accept"
      :multiple="multiple"
      :disabled="disabled"
      :preview="preview"
      :file-image="preview"
      class="w-full"
      v-bind="field.props"
    />
    <p
      v-if="localError"
      class="text-sm text-error"
      data-sf-file-error
      role="alert"
    >
      {{ localError }}
    </p>
  </div>
</template>
