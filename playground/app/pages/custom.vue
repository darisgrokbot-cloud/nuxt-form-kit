<script setup lang="ts">
import type { FormSchema } from 'nuxt-form-kit'
import StarRating from '~/components/StarRating.vue'

// ลงทะเบียน field type เพิ่ม (ปกติทำใน plugin)
useFormKitRegistry().register({ fields: { rating: StarRating } })

// schema เป็น JSON ล้วน — เก็บใน DB หรือรับจาก backend ได้
const json = `[
  { "key": "product", "type": "text", "label": "สินค้า", "rules": { "required": true } },
  { "key": "score", "type": "rating", "label": "คะแนน", "max": 5, "rules": { "required": true, "min": 3, "messages": { "min": "ให้อย่างน้อย 3 ดาวนะ" } } },
  { "key": "reason", "type": "textarea", "label": "เหตุผลที่ให้คะแนนต่ำ",
    "visibleWhen": { "field": "score", "lte": 3 }, "requiredWhen": { "field": "score", "lte": 3 } },
  { "key": "contact", "type": "select", "label": "ติดต่อกลับทาง",
    "options": { "items": [ { "id": "email", "name": "อีเมล" }, { "id": "phone", "name": "โทรศัพท์" } ] } },
  { "key": "contact_value", "type": "text", "label": "ข้อมูลติดต่อ",
    "visibleWhen": { "field": "contact", "empty": false },
    "rules": { "required": true } }
]`

const schema = JSON.parse(json) as FormSchema
const form = useFormKit(schema, { initialValues: { score: null } })
const submitted = ref<Record<string, unknown> | null>(null)

async function save() {
  if (await form.validate()) submitted.value = form.getPayload({ omitHidden: true })
}
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2">
    <UCard>
      <FkForm :form="form" @submit="submitted = $event">
        <template #field:contact_value="{ value, setValue, field }">
          <UInput
            :model-value="value as string"
            :placeholder="form.values.value.contact === 'phone' ? '08x-xxx-xxxx' : 'name@example.com'"
            class="w-full"
            :data-testid="`override-${field.key}`"
            @update:model-value="setValue"
          />
        </template>
      </FkForm>
      <div class="mt-4 flex gap-2">
        <UButton data-testid="external-save" label="บันทึก (ปุ่มภายนอก)" @click="save" />
        <UButton data-testid="external-reset" color="neutral" variant="outline" label="reset()" @click="form.reset()" />
      </div>
    </UCard>
    <div class="space-y-3 text-xs">
      <pre data-testid="values" class="rounded-lg border border-default bg-default p-3">{{ form.values.value }}</pre>
      <pre v-if="submitted" data-testid="submitted" class="rounded-lg border border-success bg-default p-3">{{ submitted }}</pre>
    </div>
  </div>
</template>
