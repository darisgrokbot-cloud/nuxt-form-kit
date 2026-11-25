<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TextField } from '../../core/types'
import type { FieldComponentProps } from '../types'

const props = defineProps<FieldComponentProps<TextField>>()
const model = defineModel<string | null>()

const reveal = ref(false)
const isPassword = computed(() => props.field.type === 'password')
const shouldTrim = computed(() => props.field.trim ?? !isPassword.value)
const inputType = computed(() => (isPassword.value && reveal.value ? 'text' : props.field.type))

function onBlur() {
  if (!shouldTrim.value || typeof model.value !== 'string') return
  const trimmed = model.value.trim()
  if (trimmed !== model.value) model.value = trimmed
}
</script>

<template>
  <UInput
    v-model="model as string"
    :type="inputType"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="field.rules?.maxLength"
    :autocomplete="isPassword ? 'new-password' : undefined"
    class="w-full"
    v-bind="field.props"
    @blur="onBlur"
  >
    <template v-if="isPassword" #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        :icon="reveal ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="reveal ? messages.hidePassword : messages.showPassword"
        :aria-pressed="reveal"
        @click="reveal = !reveal"
      />
    </template>
  </UInput>
</template>
