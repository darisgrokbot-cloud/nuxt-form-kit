<script setup lang="ts">
import { computed } from 'vue'
import type { FieldSchema, Messages, NumberField } from '../core/types'
import { isEmpty } from '../core/utils'
import type { FieldOptionsView } from './types'

/** แสดงค่าเป็นข้อความ — ใช้ใน view mode และ readonlyWhen */
const props = defineProps<{
  field: FieldSchema
  value: unknown
  messages: Messages
  locale: string
  options?: FieldOptionsView
}>()

const intlLocale = computed(() => (props.locale === 'th' ? 'th-TH' : 'en-GB'))

function formatDate(iso: unknown): string {
  if (typeof iso !== 'string' || iso === '') return ''
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(intlLocale.value, { day: 'numeric', month: 'short', year: 'numeric' })
}

const text = computed(() => {
  const { field, value } = props
  if (field.type === 'checkbox' || field.type === 'switch') {
    return value ? (props.locale === 'th' ? 'ใช่' : 'Yes') : (props.locale === 'th' ? 'ไม่ใช่' : 'No')
  }
  if (isEmpty(value)) return props.messages.empty

  if (props.options) {
    const list = Array.isArray(value) ? value : [value]
    return list.map(v => props.options?.labelOf(v) ?? String(v)).join(', ')
  }
  if (field.type === 'date') return formatDate(value)
  if (field.type === 'date-range' && value && typeof value === 'object') {
    const r = value as { start?: string, end?: string }
    return `${formatDate(r.start) || '…'} – ${formatDate(r.end) || '…'}`
  }
  if ((field.type === 'number' || field.type === 'money') && typeof value === 'number') {
    const f = field as NumberField
    const fmt = f.format ?? (field.type === 'money' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {})
    return new Intl.NumberFormat(intlLocale.value, fmt).format(value)
  }
  if (field.type === 'password') return '••••••••'
  return String(value)
})

const colorSwatch = computed(() => {
  if (props.field.type !== 'color' || typeof props.value !== 'string' || !props.value) return null
  return /^(#|rgb|hsl)/i.test(props.value) ? props.value : null
})
</script>

<template>
  <p
    class="flex items-center gap-2 text-sm text-default whitespace-pre-line break-words min-h-8 py-1.5"
    :data-sf-display="field.key"
  >
    <span
      v-if="colorSwatch"
      class="size-4 shrink-0 rounded-sm border border-default"
      :style="{ backgroundColor: colorSwatch }"
      aria-hidden="true"
    />
    {{ text }}
  </p>
</template>
