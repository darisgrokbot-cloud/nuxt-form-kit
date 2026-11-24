<script setup lang="ts">
const schema = defineFormSchema([
  {
    type: 'section',
    key: 'basic',
    title: 'ข้อมูลพื้นฐาน',
    description: 'text / email / password / textarea / number / money',
    children: [
      { key: 'code', type: 'text', label: 'รหัส', placeholder: 'เช่น EMP-001', layout: { span: { base: 12, md: 4 } }, rules: { required: true, pattern: { regex: '^[A-Z]{3}-\\d{3}$', message: 'รูปแบบต้องเป็น ABC-123' }, custom: ['uniqueCode'] }, hint: 'ลอง TAK-001 (ถูกใช้แล้ว)' },
      { key: 'name', type: 'text', label: 'ชื่อ', layout: { span: { base: 12, md: 8 } }, rules: { required: true, maxLength: 50, noSpecialChars: true }, counter: true },
      { key: 'email', type: 'email', label: 'อีเมล', layout: { span: { base: 12, md: 6 } }, rules: { email: true } },
      { key: 'password', type: 'password', label: 'รหัสผ่าน', layout: { span: { base: 12, md: 6 } }, rules: { minLength: 8 } },
      { key: 'age', type: 'number', label: 'อายุ', layout: { span: { base: 12, md: 4 } }, rules: { required: true, min: 18, max: 60, integer: true } },
      { key: 'salary', type: 'money', label: 'เงินเดือน', layout: { span: { base: 12, md: 4 } }, rules: { min: 0 } },
      { key: 'bonus', type: 'money', label: 'โบนัส', help: 'ต้องไม่มากกว่าเงินเดือน', layout: { span: { base: 12, md: 4 } }, rules: { compare: { field: 'salary', op: '<=' } } },
      { key: 'note', type: 'textarea', label: 'หมายเหตุ', rows: 2, autoresize: true, counter: true, rules: { maxLength: 200 } },
    ],
  },
  {
    type: 'section',
    key: 'choices',
    title: 'ตัวเลือก',
    description: 'select / radio / checkbox-group / checkbox / switch / tree-select',
    children: [
      { key: 'gender', type: 'radio', label: 'เพศ', options: { items: [{ label: 'ชาย', value: 'M' }, { label: 'หญิง', value: 'F' }, { label: 'ไม่ระบุ', value: 'X' }] }, rules: { required: true }, layout: { span: { base: 12, md: 6 } } },
      { key: 'level', type: 'select', label: 'ระดับ', options: { items: ['Junior', 'Mid', 'Senior', 'Lead'] }, layout: { span: { base: 12, md: 6 } }, rules: { required: true } },
      { key: 'skills', type: 'checkbox-group', label: 'ทักษะ', options: { items: [{ label: 'Vue', value: 'vue' }, { label: 'Nuxt', value: 'nuxt' }, { label: 'TypeScript', value: 'ts' }, { label: 'SQL', value: 'sql' }] }, rules: { minItems: 1, maxItems: 3 } },
      { key: 'languages', type: 'select', label: 'ภาษา (multiple)', multiple: true, options: { items: ['ไทย', 'อังกฤษ', 'จีน', 'ญี่ปุ่น', 'เกาหลี', 'ฝรั่งเศส', 'เยอรมัน', 'สเปน'] }, layout: { span: { base: 12, md: 6 } } },
      {
        key: 'department',
        type: 'tree-select',
        label: 'หน่วยงาน (tree-select)',
        layout: { span: { base: 12, md: 6 } },
        rules: { required: true },
        options: {
          items: [
            {
              label: 'ฝ่ายไอที',
              value: 'it',
              children: [
                {
                  label: 'พัฒนา',
                  value: 'dev',
                  children: [
                    { label: 'Frontend', value: 'fe' },
                    { label: 'Backend', value: 'be' },
                  ],
                },
                { label: 'โครงสร้างพื้นฐาน', value: 'infra' },
              ],
            },
            {
              label: 'ฝ่ายบุคคล',
              value: 'hr',
              defaultExpanded: true,
              children: [
                { label: 'สรรหา', value: 'recruit' },
                { label: 'สวัสดิการ', value: 'welfare' },
              ],
            },
          ],
        },
      },
      {
        key: 'scopes',
        type: 'tree-select',
        label: 'ขอบเขต (multiple / cascade)',
        multiple: true,
        selectionMode: 'cascade',
        layout: { span: { base: 12, md: 6 } },
        options: {
          expandAll: true,
          items: [
            {
              label: 'องค์กร',
              value: 'org',
              children: [
                { label: 'บัญชี', value: 'acc' },
                { label: 'กฎหมาย', value: 'legal' },
                { label: 'IT', value: 'it_scope', disabled: true },
              ],
            },
          ],
        },
      },
      { key: 'has_car', type: 'switch', label: 'มีรถยนต์', layout: { span: { base: 12, md: 6 } } },
      { key: 'car_plate', type: 'text', label: 'ทะเบียนรถ', visibleWhen: { field: 'has_car', is: true }, rules: { required: true }, clearWhenHidden: true, layout: { span: { base: 12, md: 6 } } },
      { key: 'accept', type: 'checkbox', label: 'ยอมรับเงื่อนไข', description: 'ต้องติ๊กก่อนบันทึก', rules: { required: 'กรุณายอมรับเงื่อนไข' }, layout: { span: { base: 12, md: 6 } } },
    ],
  },
  {
    type: 'section',
    key: 'remote',
    title: 'ข้อมูลจาก API',
    description: 'cascade dependsOn 3 ชั้น / autocomplete ค้นหา + โหลดเพิ่ม / params template / autoSelectSingle',
    children: [
      { key: 'province_id', type: 'select', label: 'จังหวัด', options: { source: 'provinces' }, layout: { span: { base: 12, md: 4 } }, rules: { required: true } },
      { key: 'district_id', type: 'select', label: 'อำเภอ', options: { source: 'districts', params: { province_id: '{{province_id}}' }, dependsOn: ['province_id'] }, layout: { span: { base: 12, md: 4 } }, rules: { required: true } },
      { key: 'subdistrict_id', type: 'select', label: 'ตำบล', options: { source: 'subdistricts', params: { district_id: '{{district_id}}' }, dependsOn: ['district_id'], autoSelectSingle: true }, layout: { span: { base: 12, md: 4 } }, hint: 'auto-select' },
      { key: 'department_id', type: 'autocomplete', label: 'ฝ่าย (95 รายการ, หน้าละ 20)', options: { source: 'departments', pageSize: 20, search: { debounce: 250 } }, layout: { span: { base: 12, md: 6 } }, rules: { required: true } },
      { key: 'manager_id', type: 'autocomplete', label: 'หัวหน้า (กรองตามฝ่าย)', options: { source: 'employees', params: { department_id: '{{department_id}}' }, dependsOn: ['department_id'], map: { label: 'full_name', value: 'id', description: 'email' } }, layout: { span: { base: 12, md: 6 } } },
      { key: 'watchers', type: 'autocomplete', label: 'ผู้ติดตาม (multiple)', multiple: true, options: { source: 'employees', map: { label: 'full_name', value: 'id' } }, rules: { maxItems: 3 } },
      { key: 'broken', type: 'select', label: 'Source ที่ error', options: { source: 'failing' }, help: 'ต้องแสดงข้อความโหลดไม่สำเร็จ' },
    ],
  },
  {
    type: 'section',
    key: 'dates',
    title: 'วันที่',
    collapsible: true,
    children: [
      { key: 'start_date', type: 'date', label: 'วันเริ่ม', layout: { span: { base: 12, md: 6 } }, rules: { required: true } },
      { key: 'end_date', type: 'date', label: 'วันสิ้นสุด', min: { field: 'start_date' }, layout: { span: { base: 12, md: 6 } }, rules: { compare: { field: 'start_date', op: '>=' } } },
      { key: 'leave', type: 'date-range', label: 'ช่วงลา' },
    ],
  },
  {
    type: 'section',
    key: 'conditions',
    title: 'เงื่อนไข',
    description: 'visibleWhen / requiredWhen / disabledWhen / readonlyWhen / slot',
    children: [
      { key: 'type', type: 'radio', label: 'ประเภท', options: { items: [{ label: 'บุคคล', value: 'person' }, { label: 'นิติบุคคล', value: 'company' }] }, defaultValue: 'person' },
      { key: 'id_card', type: 'text', label: 'เลขบัตรประชาชน', visibleWhen: { field: 'type', is: 'person' }, requiredWhen: { field: 'type', is: 'person' }, rules: { pattern: { regex: '^\\d{13}$', message: 'ต้องเป็นตัวเลข 13 หลัก' } }, layout: { span: { base: 12, md: 6 } } },
      { key: 'tax_id', type: 'text', label: 'เลขผู้เสียภาษี', visibleWhen: { field: 'type', is: 'company' }, requiredWhen: { field: 'type', is: 'company' }, layout: { span: { base: 12, md: 6 } } },
      { type: 'slot', name: 'id-help', layout: { span: { base: 12, md: 6 } } },
      { key: 'lock', type: 'switch', label: 'ล็อกช่องถัดไป', layout: { span: { base: 12, md: 4 } } },
      { key: 'locked_text', type: 'text', label: 'ช่องที่ถูก disabled', disabledWhen: { field: 'lock', is: true }, layout: { span: { base: 12, md: 4 } } },
      { key: 'computed_text', type: 'text', label: 'readonlyWhen', defaultValue: 'แสดงเป็นข้อความ', readonlyWhen: true, layout: { span: { base: 12, md: 4 } } },
      {
        type: 'row',
        key: 'advanced-row',
        visibleWhen: { all: [{ field: 'age', gte: 30 }, { field: 'level', in: ['Senior', 'Lead'] }] },
        children: [
          { key: 'mentor_note', type: 'textarea', label: 'แสดงเมื่ออายุ ≥ 30 และระดับ Senior/Lead', rules: { required: true } },
        ],
      },
    ],
  },
])

const data = ref<Record<string, unknown>>({})
const submitted = ref<Record<string, unknown> | null>(null)
const errors = ref<{ name: string, message: string }[]>([])
const formRef = useTemplateRef('formRef')

function onSubmit(payload: Record<string, unknown>) {
  submitted.value = payload
  errors.value = []
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
    <FkForm
      ref="formRef"
      v-model="data"
      :schema="schema"
      submit-label="บันทึก"
      reset-label="ล้างค่า"
      omit-hidden
      @submit="onSubmit"
      @error="errors = $event"
    >
      <template #slot:id-help="{ values }">
        <UAlert
          color="info"
          variant="subtle"
          icon="i-lucide-info"
          :title="values.type === 'person' ? 'บุคคลธรรมดา: กรอกเลขบัตร 13 หลัก' : 'นิติบุคคล: กรอกเลขผู้เสียภาษี'"
          data-testid="slot-content"
        />
      </template>
    </FkForm>

    <aside class="space-y-4 text-xs lg:sticky lg:top-4 lg:self-start">
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="mb-1 font-semibold">
          state
        </p>
        <p data-testid="state">
          valid: {{ formRef?.form.isValid.value }} · dirty: {{ formRef?.form.isDirty.value }}
        </p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="mb-1 font-semibold">
          v-model
        </p>
        <pre data-testid="values" class="max-h-80 overflow-auto whitespace-pre-wrap">{{ data }}</pre>
      </div>
      <div v-if="errors.length" class="rounded-lg border border-error bg-default p-3">
        <p class="mb-1 font-semibold text-error">
          @error ({{ errors.length }})
        </p>
        <pre data-testid="errors" class="whitespace-pre-wrap">{{ errors }}</pre>
      </div>
      <div v-if="submitted" class="rounded-lg border border-success bg-default p-3">
        <p class="mb-1 font-semibold text-success">
          @submit payload
        </p>
        <pre data-testid="submitted" class="whitespace-pre-wrap">{{ submitted }}</pre>
      </div>
    </aside>
  </div>
</template>
