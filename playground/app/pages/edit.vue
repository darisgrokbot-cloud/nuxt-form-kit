<script setup lang="ts">
import type { FormMode, ServerError } from '@stackcloud/schema-form'

const schema = defineFormSchema([
  { key: 'title', type: 'text', label: 'ชื่อเรื่อง', rules: { required: true } },
  { key: 'province_id', type: 'select', label: 'จังหวัด', options: { source: 'provinces' }, layout: { span: { base: 12, md: 4 } } },
  { key: 'district_id', type: 'select', label: 'อำเภอ', options: { source: 'districts', params: { province_id: '{{province_id}}' }, dependsOn: ['province_id'] }, layout: { span: { base: 12, md: 4 } } },
  { key: 'subdistrict_id', type: 'select', label: 'ตำบล', options: { source: 'subdistricts', params: { district_id: '{{district_id}}' }, dependsOn: ['district_id'] }, layout: { span: { base: 12, md: 4 } } },
  { key: 'department_id', type: 'autocomplete', label: 'ทีม (อยู่หน้าหลังๆ)', options: { source: 'departments', labelFrom: 'department_name' }, layout: { span: { base: 12, md: 6 } } },
  { key: 'budget', type: 'money', label: 'งบประมาณ', layout: { span: { base: 12, md: 6 } } },
  { key: 'active', type: 'switch', label: 'ใช้งาน', layout: { span: { base: 12, md: 4 } } },
  { key: 'start_date', type: 'date', label: 'วันเริ่ม', layout: { span: { base: 12, md: 4 } } },
  { key: 'tags', type: 'checkbox-group', label: 'แท็ก', options: { items: ['A', 'B', 'C'] }, layout: { span: { base: 12, md: 4 } } },
])

const mode = ref<FormMode>('edit')
const data = ref<Record<string, unknown>>({})
const loading = ref(true)
const serverErrors = ref<ServerError[]>([])
const submitted = ref<Record<string, unknown> | null>(null)

// จำลองโหลดข้อมูล edit แบบ async — แทนทั้ง object (ต้องไม่ทำให้อำเภอ/ตำบลถูกล้าง)
onMounted(async () => {
  await new Promise(r => setTimeout(r, 400))
  data.value = {
    id: 42,
    _action: 'update',
    title: 'โครงการทดสอบ',
    province_id: 50,
    district_id: 5002,
    subdistrict_id: 500201,
    department_id: 88,
    department_name: 'ทีม 088',
    budget: 125000.5,
    active: true,
    start_date: '2026-11-01',
    tags: ['A', 'C'],
  }
  loading.value = false
})

function simulateServerError() {
  serverErrors.value = [
    { field: 'title', message: 'ชื่อเรื่องซ้ำกับรายการอื่น' },
    { key: 'budget', msg: 'งบเกินวงเงินที่กำหนด' },
  ]
}

function onSubmit(payload: Record<string, unknown>) {
  submitted.value = payload
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <UButton data-testid="mode-edit" :variant="mode === 'edit' ? 'solid' : 'outline'" label="Edit" @click="mode = 'edit'" />
      <UButton data-testid="mode-view" :variant="mode === 'view' ? 'solid' : 'outline'" label="View" @click="mode = 'view'" />
      <UButton data-testid="server-error" color="error" variant="soft" label="จำลอง error จาก server" @click="simulateServerError" />
    </div>

    <p v-if="loading" data-testid="loading">
      กำลังโหลดข้อมูล...
    </p>
    <UCard v-else>
      <SfForm
        v-model="data"
        :schema="schema"
        :mode="mode"
        :server-errors="serverErrors"
        submit-label="บันทึก"
        @submit="onSubmit"
      />
    </UCard>

    <pre data-testid="values" class="rounded-lg border border-default bg-default p-3 text-xs">{{ data }}</pre>
    <pre v-if="submitted" data-testid="submitted" class="rounded-lg border border-success bg-default p-3 text-xs">{{ submitted }}</pre>
  </div>
</template>
