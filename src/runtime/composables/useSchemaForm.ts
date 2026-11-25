import { computed, getCurrentInstance, onMounted, reactive, ref, shallowRef, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { useNuxtApp, useRuntimeConfig } from '#imports'
import { evaluateCondition } from '../core/conditions'
import type { InferFormValues } from '../core/infer'
import { resolveFormSchemaInput } from '../core/infer'
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
import {
  validateStandardSchema, validateStandardSync, validateStandardValue,
} from '../core/standard-schema'
import type {
  FieldError, FieldSchema, FormMode, FormSchema, FormSchemaInput, Messages, RuleFn, ServerError, SourceFn, Values,
} from '../core/types'
import { clone, isEmpty, stableStringify, toComparable } from '../core/utils'

export interface UseSchemaFormOptions<TValues extends Values = Values> {
  /** ref ของค่าในฟอร์ม (ใช้ร่วมกับ v-model) — ถ้าไม่ส่งจะสร้างให้ */
  values?: Ref<NoInfer<TValues>>
  /** ค่าเริ่มต้น (ใช้เมื่อไม่ได้ส่ง values) — ไม่ reverse-infer TValues */
  initialValues?: Partial<NoInfer<TValues>> & Values
  mode?: MaybeRefOrGetter<FormMode | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** error จาก server [{ field, message }] */
  serverErrors?: MaybeRefOrGetter<ServerError[] | undefined>
  locale?: MaybeRefOrGetter<string | undefined>
  messages?: Partial<Messages>
  /** source / rule เฉพาะฟอร์มนี้ (ทับของ registry) */
  sources?: Record<string, SourceFn>
  rules?: Record<string, RuleFn>
  /**
   * Form-level Standard Schema validator (Zod / Valibot / ArkType / …).
   * Runs after per-field `rules` / `standard`. Issues are mapped by path → field key.
   * Alias: `schema`.
   */
  validate?: StandardSchemaV1
  /** Alias for `validate` (Standard Schema). Prefer `validate` when also passing field `schema`. */
  schema?: StandardSchemaV1
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
    const app = useNuxtApp() as unknown as { $schemaForm?: SchemaFormRegistryInstance }
    return app.$schemaForm ?? createRegistry()
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
    }
    return pub.schemaForm ?? {}
  }
  catch {
    return {}
  }
}

type ResolvedValues<
  TSchema extends FormSchemaInput,
  TValidate extends StandardSchemaV1 | undefined,
> = TValidate extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<TValidate>
  : InferFormValues<TSchema>

export interface SchemaFormInstance<TValues extends Values = Values> {
  schema: ComputedRef<FormSchema>
  fields: ComputedRef<FieldSchema[]>
  values: Ref<TValues>
  state: ComputedRef<TValues>
  mode: ComputedRef<FormMode>
  isView: ComputedRef<boolean>
  locale: ComputedRef<string>
  messages: ComputedRef<Messages>
  sources: ComputedRef<Record<string, SourceFn>>
  registry: SchemaFormRegistryInstance
  serverErrors: Ref<Record<string, string>>
  errors: ComputedRef<FieldError[]>
  isValid: ComputedRef<boolean>
  isDirty: ComputedRef<boolean>
  refreshTicks: Record<string, number>
  t: (text: string | undefined) => string | undefined
  getField: (key: string) => FieldSchema | undefined
  isVisible: (key: string) => boolean
  isRequired: (key: string) => boolean
  isDisabled: (key: string) => boolean
  isReadonly: (key: string) => boolean
  isDependsOnBlocked: (key: string) => boolean
  labelOf: (key: string) => string
  runValidation: () => Promise<FieldError[]>
  validate: () => Promise<boolean>
  setValue: (key: string, value: unknown) => void
  setValues: (partial: Partial<TValues> | Values) => void
  reset: (next?: Partial<TValues> | Values) => void
  setErrors: (list: ServerError[]) => void
  clearErrors: () => void
  markClean: () => void
  getPayload: (opts?: PayloadOptions) => TValues
  refreshOptions: (key?: string) => void
  /** @internal ผูก UForm ของ SfForm */
  _bindForm: (form: UFormLike | null) => void
}

export function useSchemaForm<
  const TSchema extends FormSchemaInput = FormSchema,
  TValidate extends StandardSchemaV1 | undefined = undefined,
  TValues extends Values = ResolvedValues<TSchema, TValidate> extends Values
    ? ResolvedValues<TSchema, TValidate>
    : ResolvedValues<TSchema, TValidate> & Values,
>(
  schemaInput: MaybeRefOrGetter<TSchema>,
  options: UseSchemaFormOptions<TValues> & { validate?: TValidate, schema?: TValidate } = {},
): SchemaFormInstance<TValues> {
  const registry = useRegistry()
  const moduleConfig = useModuleConfig()

  const resolved = computed(() => resolveFormSchemaInput(toValue(schemaInput)))
  const schema = computed(() => resolved.value.fields)
  const formStandard = computed<StandardSchemaV1 | undefined>(
    () => options.validate ?? options.schema ?? resolved.value.validate,
  )
  const flat = computed(() => flattenFields(schema.value))
  const flatByKey = computed(() => new Map(flat.value.map(f => [f.field.key, f])))

  if (import.meta.dev) {
    for (const issue of validateSchema(schema.value, knownFieldTypes(registry.fields))) {
      const log = issue.level === 'error' ? console.error : console.warn
      log(`[schema-form] ${issue.message}`)
    }
  }

  /* ------------------------------ values ------------------------------ */
  const values: Ref<TValues> = options.values ?? ref({ ...options.initialValues } as TValues) as Ref<TValues>
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
  const state = computed<TValues>(() => {
    const out: Values = { ...defaults.value }
    for (const [k, v] of Object.entries(values.value ?? {})) {
      if (v !== undefined) out[k] = v
    }
    return out as TValues
  })

  const snapshot = ref(stableStringify(state.value))
  const isDirty = computed(() => stableStringify(state.value) !== snapshot.value)

  /** เขียน defaults ลง values จริง — ถ้าใช้กับ v-model จะเลื่อนไปหลัง mount เพื่อไม่ให้ hydration mismatch */
  function commitDefaults() {
    fillDefaults(values.value as Values)
    previous = clone(values.value as Values)
    previousTarget = values.value as Values
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

  /* ------------------------------ UForm bind -------------------------- */
  // Declared before server-error watch so immediate showErrors() is not TDZ.
  const uForm = shallowRef<UFormLike | null>(null)

  async function showErrors() {
    if (uForm.value) await uForm.value.validate({ silent: true })
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
    const currentValues = current as Values
    // object ถูกแทนทั้งก้อน (เช่นโหลดข้อมูล edit) → ถือเป็นการตั้งค่าใหม่ ไม่ cascade
    if (currentValues !== previousTarget) {
      fillDefaults(currentValues)
      previousTarget = currentValues
      previous = clone(currentValues)
      snapshot.value = stableStringify(currentValues)
      return
    }

    const changed = Object.keys({ ...previous, ...currentValues })
      .filter(k => JSON.stringify(previous[k]) !== JSON.stringify(currentValues[k]))
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
        if (field && !isEmpty(currentValues[child])) currentValues[child] = emptyValueOf(field)
      }
    }

    for (const f of flat.value) {
      if (f.field.clearWhenHidden && !isFieldVisible(f, currentValues) && !isEmpty(currentValues[f.field.key])) {
        currentValues[f.field.key] = emptyValueOf(f.field)
      }
    }

    previous = clone(currentValues)
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

  function mergeFieldError(errors: FieldError[], seen: Set<string>, name: string, message: string) {
    if (seen.has(name)) return
    seen.add(name)
    errors.push({ name, message })
  }

  /** ตรวจทั้งฟอร์ม (รวม custom/async rule + Standard Schema) — ใช้เป็น validate ของ UForm */
  async function runValidation(): Promise<FieldError[]> {
    const errors: FieldError[] = []
    const seen = new Set<string>()

    for (const f of flat.value) {
      const key = f.field.key
      if (!shouldValidate(f)) continue

      const value = state.value[key]
      const message = serverErrors.value[key]
        ?? builtinTypeError(f.field, value)
        ?? await validateValue(ruleValue(f.field, value), f.field.rules, state.value, ruleContext(key))
        ?? (f.field.standard ? await validateStandardValue(f.field.standard, value) : undefined)

      if (message) mergeFieldError(errors, seen, key, message)
    }

    const standard = formStandard.value
    if (standard && !isView.value) {
      for (const err of await validateStandardSchema(standard, state.value)) {
        const flatField = flatByKey.value.get(err.name)
        if (err.name && flatField && !shouldValidate(flatField)) continue
        mergeFieldError(errors, seen, err.name, err.message)
      }
    }

    lastErrors.value = errors
    return errors
  }

  const lastErrors = ref<FieldError[]>([])

  /** ผลตรวจแบบ sync (ไม่รวม custom/async / async Standard Schema) — reactive ใช้เปิด/ปิดปุ่มบันทึกได้ */
  const isValid = computed(() => {
    const fieldOk = flat.value.every((f) => {
      if (!shouldValidate(f)) return true
      const key = f.field.key
      if (serverErrors.value[key]) return false
      const value = state.value[key]
      if (builtinTypeError(f.field, value)) return false
      if (validateSync(ruleValue(f.field, value), f.field.rules, state.value, ruleContext(key))) return false
      if (f.field.standard && validateStandardSync(f.field.standard, value)) return false
      return true
    })
    if (!fieldOk) return false

    const standard = formStandard.value
    if (standard && !isView.value) {
      const result = standard['~standard'].validate(state.value)
      if (!(result instanceof Promise) && result.issues?.length) {
        return !result.issues.some((issue) => {
          const name = issue.path?.length
            ? String(typeof issue.path[0] === 'object' && issue.path[0] && 'key' in issue.path[0]
              ? (issue.path[0] as { key: PropertyKey }).key
              : issue.path[0])
            : ''
          if (!name) return true
          const flatField = flatByKey.value.get(name)
          return !flatField || shouldValidate(flatField)
        })
      }
    }
    return true
  })

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
    ;(values.value as Values)[key] = value
  }

  /** ตั้งหลายค่าพร้อมกัน — ลูกที่ตั้งมาพร้อมแม่จะไม่ถูกล้าง */
  function setValues(partial: Partial<TValues> | Values) {
    Object.assign(values.value, partial)
  }

  /** รีเซ็ตกลับเป็นค่าเริ่มต้น หรือค่าที่ส่งมา (ไม่ cascade) */
  function reset(next?: Partial<TValues> | Values) {
    suspended = true
    const base = buildInitialValues(schema.value, (next ?? JSON.parse(snapshot.value)) as Values)
    for (const k of Object.keys(values.value as Values)) {
      if (!(k in base)) delete (values.value as Values)[k]
    }
    Object.assign(values.value, base)
    previous = clone(values.value as Values)
    previousTarget = values.value as Values
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

  function getPayload(opts?: PayloadOptions): TValues {
    return buildPayload(schema.value, state.value, opts) as TValues
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
      // Re-apply pending server errors once UForm is available (initial prop case).
      if (form && Object.keys(serverErrors.value).length) void showErrors()
    },
  }
}
