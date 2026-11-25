<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormField } from '@nuxt/ui/composables/useFormField'
import type { ColorField, ColorFormat } from '../../core/types'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<ColorField>>()
const model = defineModel<string | null>()

const { id, ariaAttrs, emitFormBlur, emitFormChange } = useFormField({
  disabled: props.disabled,
})

const open = ref(false)

const format = computed<ColorFormat>(() => props.field.format ?? 'hex')
const clearable = computed(() => props.field.clearable ?? true)
const swatches = computed(() => props.field.swatches ?? [])

const display = computed({
  get: () => (typeof model.value === 'string' ? model.value : ''),
  set: (v: string | undefined | null) => {
    const next = (v ?? '').trim()
    model.value = next === '' ? null : next
    emitFormChange()
  },
})

/** CSS-usable color for the swatch (hex / rgb / hsl work; others fall back). */
const swatchCss = computed(() => {
  const v = display.value
  if (!v) return 'transparent'
  if (/^(#|rgb|hsl)/i.test(v)) return v
  return 'transparent'
})

function pickSwatch(color: string) {
  if (props.disabled) return
  model.value = color
  emitFormChange()
  open.value = false
}

function clear() {
  if (props.disabled) return
  model.value = null
  emitFormChange()
}
</script>

<template>
  <div class="flex w-full items-center gap-1.5" data-sf-color-input>
    <UInput
      :id="id"
      v-model="display"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full"
      autocomplete="off"
      :aria-label="label || messages.openColorPicker"
      v-bind="{ ...ariaAttrs, ...field.props }"
      @blur="emitFormBlur"
    >
      <template #leading>
        <UPopover v-model:open="open" :disabled="disabled">
          <button
            type="button"
            class="size-5 shrink-0 rounded-sm border border-default shadow-xs"
            data-sf-color-swatch
            :style="{ backgroundColor: swatchCss }"
            :aria-label="messages.openColorPicker"
            :aria-expanded="open"
            :aria-haspopup="true"
            :disabled="disabled"
          />
          <template #content>
            <div class="flex flex-col gap-3 p-3" data-sf-color-picker>
              <UColorPicker
                v-model="display"
                :format="format"
                :disabled="disabled"
                class="w-full"
              />
              <div
                v-if="swatches.length"
                class="flex flex-wrap gap-1.5"
                role="listbox"
                :aria-label="messages.openColorPicker"
              >
                <button
                  v-for="swatch in swatches"
                  :key="swatch"
                  type="button"
                  role="option"
                  class="size-6 rounded-md border border-default shadow-xs transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverted"
                  :style="{ backgroundColor: swatch }"
                  :aria-label="swatch"
                  :aria-selected="display === swatch"
                  :disabled="disabled"
                  @click="pickSwatch(swatch)"
                />
              </div>
            </div>
          </template>
        </UPopover>
      </template>
    </UInput>

    <UButton
      v-if="clearable && display"
      type="button"
      color="neutral"
      variant="ghost"
      size="sm"
      icon="i-lucide-x"
      data-sf-color-clear
      :aria-label="messages.clear"
      :disabled="disabled"
      @click="clear"
    />
  </div>
</template>
