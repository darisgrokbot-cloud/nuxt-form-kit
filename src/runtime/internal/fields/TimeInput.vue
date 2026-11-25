<script setup lang="ts">
import { computed } from 'vue'
import { Time } from '@internationalized/date'
import type { TimeField, TimeGranularity } from '../../core/types'
import { getPath } from '../../core/utils'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<TimeField>>()
const model = defineModel<string | null>()

const granularity = computed<TimeGranularity>(() => props.field.granularity ?? 'minute')
const dateLocale = computed(() => (props.locale === 'th' ? 'th-TH' : 'en-GB'))

function parseTimeString(raw: unknown): Time | undefined {
  if (typeof raw !== 'string' || raw === '') return undefined
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return undefined
  const hour = Number(m[1])
  const minute = Number(m[2])
  const second = Number(m[3] ?? 0)
  if ([hour, minute, second].some(n => Number.isNaN(n))) return undefined
  try {
    return new Time(hour, minute, second)
  }
  catch {
    return undefined
  }
}

function serializeTime(t: Time | null | undefined): string | null {
  if (!t) return null
  const hh = String(t.hour).padStart(2, '0')
  const mm = String(t.minute).padStart(2, '0')
  const ss = String(t.second).padStart(2, '0')
  if (granularity.value === 'hour') return `${hh}:00`
  if (granularity.value === 'second') return `${hh}:${mm}:${ss}`
  return `${hh}:${mm}`
}

function resolveBound(bound: TimeField['min']): Time | undefined {
  if (!bound) return undefined
  if (typeof bound === 'string') return parseTimeString(bound)
  return parseTimeString(getPath(props.values, bound.field))
}

const minValue = computed(() => resolveBound(props.field.min))
const maxValue = computed(() => resolveBound(props.field.max))

const value = computed({
  get: () => parseTimeString(model.value),
  set: (v: Time | null | undefined) => {
    model.value = serializeTime(v ?? null)
  },
})
</script>

<template>
  <UInputTime
    v-model="value as any"
    :locale="dateLocale"
    :granularity="granularity"
    :hour-cycle="field.hourCycle"
    :min-value="minValue"
    :max-value="maxValue"
    :disabled="disabled"
    class="w-full"
    data-sf-time-input
    v-bind="field.props"
  />
</template>
