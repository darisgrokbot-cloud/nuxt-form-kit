import { computed, getCurrentInstance, onMounted, reactive, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { useNuxtApp, useRuntimeConfig } from '#imports'
import { evaluateCondition } from '../core/conditions'
import { resolveMessages } from '../core/messages'
import { createRegistry } from '../core/registry'
import type { SchemaFormRegistryInstance } from '../core/registry'
import { validateSync, validateValue } from '../core/rules'
import type { RuleContext } from '../core/rules'
import { knownFieldTypes } from '../core/builtinTypes'
import {
  buildInitialValues, buildPayload, dependentsOf, emptyValueOf, flattenFields, isFieldVisible, validateSchema,
} from '../core/schema'
import type { FlatField, PayloadOptions } from '../core/schema'
import type {
  FieldError, FieldSchema, FormMode, FormSchema, Messages, RuleFn, ServerError, SourceFn, Values,
} from '../core/types'
import { clone, isEmpty, stableStringify, toComparable } from '../core/utils'

export interface UseSchemaFormOptions {
  /** ref ของค่าในฟอร์ม (ใช้ร่วมกับ v-model) — ถ้าไม่ส่งจะสร้างให้ */
  values?: Ref<Values>
  /** ค่าเริ่มต้น (ใช้เมื่อไม่ได้ส่ง values) */
  initialValues?: Values
  mode?: MaybeRefOrGetter<FormMode | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** error จาก server [{ field, message }] */
  serverErrors?: MaybeRefOrGetter<ServerError[] | undefined>
  locale?: MaybeRefOrGetter<string | undefined>
  messages?: Partial<Messages>
  /** source / rule เฉพาะฟอร์มนี้ (ทับของ registry) */
  sources?: Record<string, SourceFn>
  rules?: Record<string, RuleFn>
  /** เขียนค่า default ลง values หลัง mount (SfForm + v-model ใช้ เพื่อกัน hydration mismatch) */
  deferDefaults?: boolean
}

export interface UFormLike {
  validate: (opts: { silent?: boolean, name?: string | string[] }) => Promise<unknown>
  clear: (name?: string) => void
}

function normalizeServerErrors(list: ServerError[] | undefined): Record<string, string> {
  const map: Record<string, string> = {}
  for (const e of list ?? []) {
    const name = e.field ?? e.key ?? e.name
    const message = e.message ?? e.msg
    if (!name || !message) continue
    map[name] = map[name] ? `${map[name]}\n${message}` : message
  }
  return map
}

function useRegistry(): SchemaFormRegistryInstance {
  try {
    const app = useNuxtApp() as unknown as { $schemaForm?: SchemaFormRegistryInstance, $formKit?: SchemaFormRegistryInstance }
    return app.$schemaForm ?? app.$formKit ?? createRegistry()
  }
  catch {
    // ใช้นอก Nuxt (เช่น unit test) → registry ว่าง
    return createRegistry()
  }
}

function useModuleConfig(): { locale?: string, messages?: Partial<Messages> } {
  try {
    const pub = useRuntimeConfig().public as {
      schemaForm?: { locale?: string, messages?: Partial<Messages> }
      formKit?: { locale?: string, messages?: Partial<Messages> }
    }
    return pub.schemaForm ?? pub.formKit ?? {}
  }
  catch {
    return {}
  }
}

export function useSchemaForm(schemaInput: MaybeRefOrGetter<FormSchema>, options: UseSchemaFormOptions = {}) {
  const registry = useRegistry()
  const moduleConfig = useModuleConfig()

  const schema = computed(() => toValue(schemaInput) ?? [])
  const flat = computed(() => flattenFields(schema.value))
  const flatByKey = computed(() => new Map(flat.value.map(f => [f.field.key, f])))

  if (import.meta.dev) {
    for (const issue of validateSchema(schema.value, knownFieldTypes(registry.fields))) {
      const log = issue.level === 'error' ? console.error : console.warn
      log(`[schema-form] ${issue.message}`)
    }
  }

  /* ------------------------------ values ------------------------------ */
  const values: Ref<Values> = options.values ?? ref({ ...options.initialValues })
  const defaults = computed(() => buildInitialValues(schema.value))

  let previous: Values = {}
  let previousTarget: Values | null = null
  let suspended = false

  function fillDefaults(target: Values) {
    for (const [k, v] of Object.entries(defaults.value)) {
      if (target[k] === undefined) target[k] = clone(v)
    }
  }

  /** ค่าที่ใช้อ่านทั้งหมด = defaults + values (ค่าใน values ชนะ) */
  const state = computed<Values>(() => {
    const out: Values = { ...defaults.value }
    for (const [k, v] of Object.entries(values.value ?? {})) {
      if (v !== undefined) out[k] = v
    }
    return out
  })

  const snapshot = ref(stableStringify(state.value))
  const isDirty = computed(() => stableStringify(state.value) !== snapshot.value)

  /** เขียน defaults ลง values จริง — ถ้าใช้กับ v-model จะเลื่อนไปหลัง mount เพื่อไม่ให้ hydration mismatch */
  function commitDefaults() {
    fillDefaults(values.value)
    previous = clone(values.value)
    previousTarget = values.value
    snapshot.value = stableStringify(values.value)
  }
  if (options.deferDefaults && getCurrentInstance()) onMounted(commitDefaults)
  else commitDefaults()

  /* ------------------------------ config ------------------------------ */
  const mode = computed<FormMode>(() => toValue(options.mode) ?? 'edit')
  const isView = computed(() => mode.value === 'view')
  const locale = computed(() => toValue(options.locale) ?? moduleConfig.locale ?? 'th')
  const messages = computed(() => resolveMessages(locale.value, { ...moduleConfig.messages, ...options.messages }))
  const sources = computed<Record<string, SourceFn>>(() => ({ ...registry.sources, ...options.sources }))
  const customRules = computed<Record<string, RuleFn>>(() => ({ ...registry.rules, ...options.rules }))

  function t(text: string | undefined): string | undefined {
    if (text === undefined || text === '') return text
    return registry.translate ? registry.translate(text) : text
  }

  /* ---------------------------- field state --------------------------- */
  function getField(key: string): FieldSchema | undefined {
    return flatByKey.value.get(key)?.field
  }

  function isVisible(key: string): boolean {
    const f = flatByKey.value.get(key)
    return f ? isFieldVisible(f, state.value) : false
  }

  function isRequired(key: string): boolean {
    const field = getField(key)
    if (!field) return false
    if (field.requiredWhen !== undefined) return evaluateCondition(field.requiredWhen, state.value)
    return Boolean(field.rules?.required)
  }

  function isDependsOnBlocked(key: string): boolean {
    const opts = (getField(key) as { options?: { dependsOn?: string[], requireDependsOn?: boolean } } | undefined)?.options
    if (!opts?.dependsOn?.length || opts.requireDependsOn === false) return false
    return opts.dependsOn.some(dep => isEmpty(state.value[dep]))
  }

  function isDisabled(key: string): boolean {
    const field = getField(key)
    if (!field) return true
    if (toValue(options.disabled)) return true
    if (evaluateCondition(field.disabledWhen, state.value)) return true
    return isDependsOnBlocked(key)
  }

  function isReadonly(key: string): boolean {
    if (isView.value) return true
    const field = getField(key)
    return Boolean(field && evaluateCondition(field.readonlyWhen, state.value))
  }

  function labelOf(key: string): string {
    return t(getField(key)?.label) ?? key
  }

  /* ---------------------------- server errors ------------------------- */
  const serverErrors = ref<Record<string, string>>({})
  watch(() => toValue(options.serverErrors), (list) => {
    serverErrors.value = normalizeServerErrors(list)
    if (Object.keys(serverErrors.value).length) void showErrors()
  }, { immediate: true, deep: true })

  /* ------------------- cascade (dependsOn) + clearWhenHidden ---------- */
  watch(values, (current) => {
    if (suspended) return
    // object ถูกแทนทั้งก้อน (เช่นโหลดข้อมูล edit) → ถือเป็นการตั้งค่าใหม่ ไม่ cascade
    if (current !== previousTarget) {
      fillDefaults(current)
      previousTarget = current
      previous = clone(current)
      snapshot.value = stableStringify(current)
      return
    }

    const changed = Object.keys({ ...previous, ...current })
      .filter(k => JSON.stringify(previous[k]) !== JSON.stringify(current[k]))
    if (!changed.length) return

    // แก้ฟิลด์แล้ว error จาก server ของฟิลด์นั้นหายไป
    if (changed.some(k => serverErrors.value[k])) {
      const next = { ...serverErrors.value }
      for (const k of changed) delete next[k]
      serverErrors.value = next
    }

    // ล้างค่าลูกที่ dependsOn ฟิลด์ที่เปลี่ยน — ยกเว้นลูกที่ถูกตั้งค่ามาพร้อมกันในรอบเดียว
    const changedSet = new Set(changed)
    for (const key of changed) {
      for (const child of dependentsOf(schema.value, key)) {
        if (changedSet.has(child)) continue
        const field = getField(child)
        if (field && !isEmpty(current[child])) current[child] = emptyValueOf(field)
      }
    }

    for (const f of flat.value) {
      if (f.field.clearWhenHidden && !isFieldVisible(f, current) && !isEmpty(current[f.field.key])) {
        current[f.field.key] = emptyValueOf(f.field)
      }
    }

    previous = clone(current)
  }, { deep: true, flush: 'sync' })

  /* ----------------------------- validation --------------------------- */
  function ruleContext(key: string): RuleContext {
    return {
      messages: messages.value,
      locale: locale.value,
      customRules: customRules.value,
      labelOf,
      required: isRequired(key),
    }
  }

  function shouldValidate(f: FlatField): boolean {
    if (isView.value) return false
    if (!isFieldVisible(f, state.value)) return false
    if (evaluateCondition(f.field.readonlyWhen, state.value)) return false
    return true
  }

  /** checkbox/switch: false ถือว่า "ยังไม่ได้ติ๊ก" สำหรับ required */
  function ruleValue(field: FieldSchema, value: unknown): unknown {
    if (field.type === 'checkbox' || field.type === 'switch') return value === true ? true : null
    return value
  }

  function builtinTypeError(field: FieldSchema, value: unknown): string | undefined {
    if (field.type === 'date-range' && value && typeof value === 'object') {
      const { start, end } = value as { start?: string | null, end?: string | null }
      const s = toComparable(start)
      const e = toComparable(end)
      if (s !== null && e !== null && s > e) return messages.value.dateRange
    }
    return undefined
  }

  /** ตรวจทั้งฟอร์ม (รวม custom/async rule) — ใช้เป็น validate ของ UForm */
  async function runValidation(): Promise<FieldError[]> {
    const errors: FieldError[] = []
    for (const f of flat.value) {
      const key = f.field.key
      if (!shouldValidate(f)) continue
      const message = serverErrors.value[key]
        ?? builtinTypeError(f.field, state.value[key])
        ?? await validateValue(ruleValue(f.field, state.value[key]), f.field.rules, state.value, ruleContext(key))
      if (message) errors.push({ name: key, message })
    }
    lastErrors.value = errors
    return errors
  }

  const lastErrors = ref<FieldError[]>([])

  /** ผลตรวจแบบ sync (ไม่รวม custom/async) — reactive ใช้เปิด/ปิดปุ่มบันทึกได้ */
  const isValid = computed(() => flat.value.every((f) => {
    if (!shouldValidate(f)) return true
    const key = f.field.key
    if (serverErrors.value[key]) return false
    return !builtinTypeError(f.field, state.value[key])
      && !validateSync(ruleValue(f.field, state.value[key]), f.field.rules, state.value, ruleContext(key))
  }))

  /* ------------------------------ UForm bind -------------------------- */
  const uForm = shallowRef<UFormLike | null>(null)

  async function showErrors() {
    if (uForm.value) await uForm.value.validate({ silent: true })
  }

  /** ตรวจทั้งฟอร์มและแสดง error — คืน true ถ้าผ่าน */
  async function validate(): Promise<boolean> {
    if (uForm.value) {
      const result = await uForm.value.validate({ silent: true })
      return result !== false
    }
    return (await runValidation()).length === 0
  }

  /* ------------------------------ options ----------------------------- */
  const refreshTicks = reactive<Record<string, number>>({})
  function refreshOptions(key?: string) {
    const keys = key ? [key] : flat.value.filter(f => (f.field as { options?: unknown }).options).map(f => f.field.key)
    for (const k of keys) refreshTicks[k] = (refreshTicks[k] ?? 0) + 1
  }

  /* ------------------------------ actions ----------------------------- */
  function setValue(key: string, value: unknown) {
    values.value[key] = value
  }

  /** ตั้งหลายค่าพร้อมกัน — ลูกที่ตั้งมาพร้อมแม่จะไม่ถูกล้าง */
  function setValues(partial: Values) {
    Object.assign(values.value, partial)
  }

  /** รีเซ็ตกลับเป็นค่าเริ่มต้น หรือค่าที่ส่งมา (ไม่ cascade) */
  function reset(next?: Values) {
    suspended = true
    const base = buildInitialValues(schema.value, next ?? JSON.parse(snapshot.value))
    for (const k of Object.keys(values.value)) {
      if (!(k in base)) delete values.value[k]
    }
    Object.assign(values.value, base)
    previous = clone(values.value)
    previousTarget = values.value
    snapshot.value = stableStringify(values.value)
    serverErrors.value = {}
    lastErrors.value = []
    uForm.value?.clear()
    suspended = false
  }

  /** ตั้ง error จาก server แล้วแสดงทันที */
  function setErrors(list: ServerError[]) {
    serverErrors.value = normalizeServerErrors(list)
    void showErrors()
  }

  function clearErrors() {
    serverErrors.value = {}
    lastErrors.value = []
    uForm.value?.clear()
  }

  /** บันทึกสถานะปัจจุบันเป็นจุดอ้างอิงของ isDirty (เช่น หลังบันทึกสำเร็จ) */
  function markClean() {
    snapshot.value = stableStringify(state.value)
  }

  function getPayload(opts?: PayloadOptions): Values {
    return buildPayload(schema.value, state.value, opts)
  }

  return {
    schema,
    fields: computed(() => flat.value.map(f => f.field)),
    values,
    /** ค่าสำหรับอ่าน (รวม defaults) */
    state,
    mode,
    isView,
    locale,
    messages,
    sources,
    registry,
    serverErrors,
    errors: computed(() => lastErrors.value),
    isValid,
    isDirty,
    refreshTicks,
    t,
    getField,
    isVisible,
    isRequired,
    isDisabled,
    isReadonly,
    isDependsOnBlocked,
    labelOf,
    runValidation,
    validate,
    setValue,
    setValues,
    reset,
    setErrors,
    clearErrors,
    markClean,
    getPayload,
    refreshOptions,
    /** @internal ผูก UForm ของ SfForm */
    _bindForm(form: UFormLike | null) {
      uForm.value = form
    },
  }
}

export type SchemaFormInstance = ReturnType<typeof useSchemaForm>

/** @deprecated Use `useSchemaForm` instead. */
export const useFormKit = useSchemaForm

/** @deprecated Use `UseSchemaFormOptions` instead. */
export type UseFormKitOptions = UseSchemaFormOptions

/** @deprecated Use `SchemaFormInstance` instead. */
export type FormKitInstance = SchemaFormInstance
