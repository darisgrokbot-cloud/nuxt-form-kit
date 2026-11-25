<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDateTime } from '@internationalized/date'
import type { DateTimeField } from '../../core/types'
import { getPath } from '../../core/utils'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<DateTimeField>>()
const model = defineModel<string | null>()

const granularity = computed(() => props.field.granularity ?? 'minute')
const dateLocale = computed(() => (props.locale === 'th' ? 'th-TH' : 'en-GB'))

function parseDateTime(raw: unknown): CalendarDateTime | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined
  const m = raw.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  if (!m) return undefined
  try {
    return new CalendarDateTime(
      Number(m[1]),
      Number(m[2]),
      Number(m[3]),
      Number(m[4] ?? 0),
      Number(m[5] ?? 0),
      Number(m[6] ?? 0),
    )
  }
  catch {
    return undefined
  }
}

function serializeDateTime(dt: CalendarDateTime | null | undefined): string | null {
  if (!dt) return null
  const full = dt.toString() // YYYY-MM-DDTHH:mm:ss
  return granularity.value === 'second' ? full.slice(0, 19) : full.slice(0, 16)
}

function resolveBound(bound: DateTimeField['min']): CalendarDateTime | undefined {
  if (!bound) return undefined
  if (typeof bound === 'string') return parseDateTime(bound)
  return parseDateTime(getPath(props.values, bound.field))
}

const minValue = computed(() => resolveBound(props.field.min))
const maxValue = computed(() => resolveBound(props.field.max))

const value = computed({
  get: () => parseDateTime(model.value),
  set: (v: CalendarDateTime | null | undefined) => {
    model.value = serializeDateTime(v ?? null)
  },
})
</script>

<template>
  <UInputDate
    v-model="value as any"
    :locale="dateLocale"
    :granularity="granularity"
    :hour-cycle="field.hourCycle"
    :min-value="minValue"
    :max-value="maxValue"
    :disabled="disabled"
    class="w-full"
    data-sf-datetime-input
    v-bind="field.props"
  >
    <template #trailing>
      <UPopover>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-calendar-clock"
          :aria-label="messages.openCalendar"
          class="px-0"
          :disabled="disabled"
        />
        <template #content>
          <UCalendar
            v-model="value as any"
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
