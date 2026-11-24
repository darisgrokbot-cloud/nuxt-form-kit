<script setup lang="ts">
import { computed } from 'vue'
import { parseDate } from '@internationalized/date'
import type { CalendarDate } from '@internationalized/date'
import type { DateField } from '../../core/types'
import { getPath } from '../../core/utils'
import type { FieldComponentProps } from '../types'

type Range = { start: string | null, end: string | null }

const props = defineProps<FieldComponentProps<DateField>>()
const model = defineModel<string | Range | null>()

const isRange = computed(() => props.field.type === 'date-range')
const dateLocale = computed(() => (props.locale === 'th' ? 'th-TH' : 'en-GB'))

function toDate(iso: unknown): CalendarDate | undefined {
  if (typeof iso !== 'string' || iso === '') return undefined
  try {
    return parseDate(iso.slice(0, 10))
  }
  catch {
    return undefined
  }
}

function toIso(date: { toString: () => string } | null | undefined): string | null {
  return date ? date.toString().slice(0, 10) : null
}

function resolveBound(bound: DateField['min']): CalendarDate | undefined {
  if (!bound) return undefined
  if (typeof bound === 'string') return toDate(bound)
  return toDate(getPath(props.values, bound.field))
}

const minValue = computed(() => resolveBound(props.field.min))
const maxValue = computed(() => resolveBound(props.field.max))

const single = computed({
  get: () => (typeof model.value === 'string' ? toDate(model.value) : undefined),
  set: (v: CalendarDate | undefined | null) => {
    model.value = toIso(v)
  },
})

const range = computed({
  get: () => {
    const r = (model.value && typeof model.value === 'object' ? model.value : { start: null, end: null }) as Range
    return { start: toDate(r.start), end: toDate(r.end) }
  },
  set: (v: { start?: CalendarDate | null, end?: CalendarDate | null } | null | undefined) => {
    model.value = { start: toIso(v?.start), end: toIso(v?.end) }
  },
})
</script>

<template>
  <UInputDate
    v-if="!isRange"
    v-model="single as any"
    :locale="dateLocale"
    :min-value="minValue"
    :max-value="maxValue"
    :disabled="disabled"
    class="w-full"
    v-bind="field.props"
  >
    <template #trailing>
      <UPopover>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-calendar"
          aria-label="Open calendar"
          class="px-0"
          :disabled="disabled"
        />
        <template #content>
          <UCalendar
            v-model="single as any"
            :locale="dateLocale"
            :min-value="minValue"
            :max-value="maxValue"
            class="p-2"
          />
        </template>
      </UPopover>
    </template>
  </UInputDate>

  <UInputDate
    v-else
    v-model="range as any"
    range
    :locale="dateLocale"
    :min-value="minValue"
    :max-value="maxValue"
    :disabled="disabled"
    class="w-full"
    v-bind="field.props"
  >
    <template #trailing>
      <UPopover>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-calendar"
          aria-label="Open calendar"
          class="px-0"
          :disabled="disabled"
        />
        <template #content>
          <UCalendar
            v-model="range as any"
            range
            :number-of-months="2"
            :locale="dateLocale"
            :min-value="minValue"
            :max-value="maxValue"
            class="p-2"
          />
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>
