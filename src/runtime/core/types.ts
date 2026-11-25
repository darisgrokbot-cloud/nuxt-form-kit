/* ------------------------------------------------------------------ */
/*  Form Kit — schema types                                            */
/*  ทุกอย่างในไฟล์นี้ออกแบบให้ "เขียนเป็น JSON ล้วนได้" (serializable)   */
/*  function ใช้ได้เป็นทางเลือกในโหมดโค้ด แต่ไม่จำเป็น                 */
/* ------------------------------------------------------------------ */

export type Values = Record<string, any>
export type Primitive = string | number | boolean | null
export type FormMode = 'create' | 'edit' | 'view'

/* ----------------------------- Layout ----------------------------- */

export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl'
/**
 * How layout.span breakpoints resolve:
 * - `viewport` — Tailwind screen variants (`sm:`, `md:`, …)
 * - `container` — Tailwind v4 container variants (`@sm:`, `@md:`, …) against the form root
 */
export type GridResponsive = 'viewport' | 'container'
/** จำนวนคอลัมน์จาก 12 — ตัวเลขเดียว = ทุกขนาดจอ, object = แยกตาม breakpoint */
export type Span = number | Partial<Record<Breakpoint, number>>

export interface NodeLayout {
  span?: Span
  /** class เพิ่มเติมของช่องนี้ */
  class?: string
}

/* --------------------------- Conditions --------------------------- */

export type ConditionFn = (values: Values) => boolean

export interface FieldCondition {
  /** key ของฟิลด์ที่ใช้เทียบ */
  field: string
  is?: unknown
  isNot?: unknown
  in?: unknown[]
  notIn?: unknown[]
  gt?: number
  gte?: number
  lt?: number
  lte?: number
  /** true = ต้องว่าง, false = ต้องไม่ว่าง */
  empty?: boolean
  /** ค่าเป็น array และมีค่านี้อยู่ */
  includes?: unknown
}

export type Condition =
  | boolean
  | ConditionFn
  | FieldCondition
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }

/* ----------------------------- Rules ------------------------------ */

export type RuleResult = true | string | undefined | null | false
export type RuleFn = (value: any, values: Values) => RuleResult | Promise<RuleResult>

export type CompareOp = '==' | '!=' | '>' | '>=' | '<' | '<='

export interface CompareRule {
  /** ฟิลด์ที่ใช้เทียบ */
  field: string
  op: CompareOp
  message?: string
}

export interface PatternRule {
  regex: string
  flags?: string
  message?: string
}

export type RuleName =
  | 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'minItems' | 'maxItems'
  | 'pattern' | 'email' | 'url' | 'integer' | 'noSpecialChars' | 'compare'

export interface Rules {
  /** true หรือข้อความ error ที่ต้องการ */
  required?: boolean | string
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  pattern?: string | PatternRule
  email?: boolean
  url?: boolean
  integer?: boolean
  /** ห้ามอักขระพิเศษ — allow = อักขระที่ยอมให้ใช้เพิ่ม */
  noSpecialChars?: boolean | { allow?: string }
  /** เทียบกับฟิลด์อื่น เช่น วันสิ้นสุดต้อง >= วันเริ่ม */
  compare?: CompareRule | CompareRule[]
  /** ชื่อ rule ที่ลงทะเบียนไว้ หรือ function (รองรับ async) */
  custom?: Array<string | RuleFn>
  /** override ข้อความ error ราย rule */
  messages?: Partial<Record<RuleName, string>>
}

/* ---------------------------- Options ----------------------------- */

export interface OptionItem {
  label: string
  value: Primitive
  description?: string
  disabled?: boolean
  icon?: string
  /** ข้อมูลดิบจาก API */
  raw?: unknown
}

/** ตัวเลือกแบบลำดับชั้น (tree) — รองรับ children ซ้อนกันได้หลายระดับ */
export interface TreeOptionItem extends OptionItem {
  children?: TreeOptionItem[]
  /** กางอัตโนมัติเมื่อเริ่มต้น */
  defaultExpanded?: boolean
}

export interface SourceContext {
  search: string
  page: number
  pageSize: number
  params: Record<string, unknown>
  values: Values
  /** ค่าที่ถูกเลือกอยู่ — ใช้คืน label ของค่าที่ไม่อยู่ในหน้าแรกได้ */
  selected: Primitive[]
  signal: AbortSignal
}

export type SourceResult = unknown[] | { items: unknown[], hasMore?: boolean, total?: number }
export type SourceFn = (ctx: SourceContext) => Promise<SourceResult> | SourceResult

export interface OptionsConfig {
  /** options แบบคงที่ */
  items?: Array<OptionItem | Record<string, unknown> | Primitive>
  /** ชื่อ source ที่ลงทะเบียนไว้ หรือ function */
  source?: string | SourceFn
  /** ส่งเข้า source — ใช้ "{{key}}" อ้างค่าฟิลด์อื่น เปลี่ยนเมื่อไหร่โหลดใหม่ */
  params?: Record<string, unknown>
  /** ฟิลด์แม่ — เมื่อแม่เปลี่ยน ค่าของฟิลด์นี้จะถูกล้างและโหลด options ใหม่ */
  dependsOn?: string[]
  /** ถ้าแม่ยังว่าง ให้ disable และไม่โหลด (default: true) */
  requireDependsOn?: boolean
  /** map key ของข้อมูลดิบ → label/value (default: label|name|title|text, value|id) */
  map?: { label?: string, value?: string, description?: string }
  /** ค้นหาฝั่ง server — default true สำหรับ autocomplete */
  search?: boolean | { minChars?: number, debounce?: number }
  /** จำนวนต่อหน้า (default 20) */
  pageSize?: number
  /** ถ้าโหลดมาได้ตัวเลือกเดียว ให้เลือกให้อัตโนมัติ */
  autoSelectSingle?: boolean
  /** key ใน values ที่เก็บ label ของค่าปัจจุบัน (ใช้ตอน edit/view โดยไม่ต้องโหลด) */
  labelFrom?: string
}

/* ----------------------- Tree Options Config ---------------------- */

/** context ส่งเข้า source สำหรับโหลด children แบบ lazy */
export interface TreeSourceContext extends Omit<SourceContext, 'page' | 'pageSize'> {
  /** node แม่ที่กำลังโหลด children — undefined เมื่อโหลด root */
  parent?: TreeOptionItem
}

export type TreeSourceResult = unknown[] | { items: unknown[] }
export type TreeSourceFn = (ctx: TreeSourceContext) => Promise<TreeSourceResult> | TreeSourceResult

export interface TreeOptionsConfig extends Omit<OptionsConfig, 'items' | 'source' | 'pageSize' | 'search'> {
  /** ตัวเลือกแบบลำดับชั้น (tree) */
  items?: Array<TreeOptionItem | Record<string, unknown>>
  /** source สำหรับโหลดข้อมูล tree — โหลดรากครั้งแรก และโหลด children เมื่อกาง node */
  source?: string | TreeSourceFn
  /** map key ของข้อมูลดิบ → label/value/children (default: children|items|nodes) */
  map?: OptionsConfig['map'] & { children?: string }
  /** ค้นหาฝั่ง client (ไม่รองรับ server search) */
  searchable?: boolean
  /** กางทุก node เมื่อเริ่มต้น */
  expandAll?: boolean
  /** array ของ value ที่กางเมื่อเริ่มต้น */
  defaultExpanded?: Primitive[]
}

/* ----------------------------- Fields ----------------------------- */

interface BaseNode {
  layout?: NodeLayout
  visibleWhen?: Condition
}

export interface BaseField<T extends string = string> extends BaseNode {
  key: string
  type: T
  label?: string
  placeholder?: string
  /** ข้อความใต้ label */
  description?: string
  /** ข้อความเล็กมุมขวาของ label */
  hint?: string
  /** ข้อความช่วยใต้ input */
  help?: string
  defaultValue?: unknown
  rules?: Rules
  requiredWhen?: Condition
  disabledWhen?: Condition
  /** แสดงเป็นข้อความ (เหมือน view mode) */
  readonlyWhen?: Condition
  /** ล้างค่าเมื่อฟิลด์ถูกซ่อน */
  clearWhenHidden?: boolean
  /** ส่ง props ตรงไปยัง component ของ Nuxt UI */
  props?: Record<string, unknown>
}

export interface TextField extends BaseField<'text' | 'email' | 'password' | 'tel' | 'url'> {
  /** ตัดช่องว่างหัวท้าย (default true ยกเว้น password) */
  trim?: boolean
  /** แสดงตัวนับตัวอักษร (ใช้ rules.maxLength) */
  counter?: boolean
}

export interface TextareaField extends BaseField<'textarea'> {
  rows?: number
  autoresize?: boolean
  trim?: boolean
  counter?: boolean
}

export interface NumberField extends BaseField<'number' | 'money'> {
  min?: number
  max?: number
  step?: number
  /** Intl.NumberFormatOptions เช่น { minimumFractionDigits: 2 } */
  format?: Intl.NumberFormatOptions
}

export interface SelectField extends BaseField<'select'> {
  options: OptionsConfig
  multiple?: boolean
  /** มีช่องค้นหาใน dropdown (default: เมื่อมีตัวเลือก > 7) */
  searchable?: boolean
  clearable?: boolean
}

export interface AutocompleteField extends BaseField<'autocomplete'> {
  options: OptionsConfig
  multiple?: boolean
  clearable?: boolean
}

export interface RadioField extends BaseField<'radio'> {
  options: OptionsConfig
  orientation?: 'horizontal' | 'vertical'
}

export interface CheckboxGroupField extends BaseField<'checkbox-group'> {
  options: OptionsConfig
  orientation?: 'horizontal' | 'vertical'
}

export interface CheckboxField extends BaseField<'checkbox' | 'switch'> {}

export interface DateField extends BaseField<'date' | 'date-range'> {
  /** ISO date (YYYY-MM-DD) หรือ { field } อ้างฟิลด์อื่น */
  min?: string | { field: string }
  max?: string | { field: string }
}

export type TreeSelectMode = 'cascade' | 'independent' | 'leaf-only'

export interface TreeSelectField extends BaseField<'tree-select'> {
  options: TreeOptionsConfig
  /** เลือกได้หลายค่า */
  multiple?: boolean
  /** ล้างค่าได้ */
  clearable?: boolean
  /**
   * โหมดการเลือกในแบบ multiple:
   * - cascade: เลือก parent จะเลือก children ทั้งหมด (default)
   * - independent: เลือกแยกอิสระแต่ละ node (check-strictly)
   * - leaf-only: เลือกได้เฉพาะ leaf node ที่ไม่มี children
   */
  selectionMode?: TreeSelectMode
  /** มีช่องค้นหา (default: true เมื่อมีตัวเลือก > 7) */
  searchable?: boolean
}

/** field type ที่ลงทะเบียนเพิ่มเองผ่าน registry */
export interface CustomField extends BaseField<string & {}> {
  options?: OptionsConfig
  [extra: string]: unknown
}

export type BuiltinField =
  | TextField | TextareaField | NumberField | SelectField | AutocompleteField
  | RadioField | CheckboxGroupField | CheckboxField | DateField | TreeSelectField

export type FieldSchema = BuiltinField | CustomField

export type BuiltinFieldType = BuiltinField['type']

/* ----------------------------- Layout nodes ----------------------- */

export interface SectionNode extends BaseNode {
  type: 'section'
  key?: string
  title?: string
  description?: string
  /** พับ/กางได้ */
  collapsible?: boolean
  defaultOpen?: boolean
  children: SchemaNode[]
}

export interface RowNode extends BaseNode {
  type: 'row'
  key?: string
  children: SchemaNode[]
}

/** ช่องว่างให้ผู้ใช้วาง content เองผ่าน slot `#slot:<name>` */
export interface SlotNode extends BaseNode {
  type: 'slot'
  name: string
}

export type LayoutNode = SectionNode | RowNode | SlotNode
export type SchemaNode = LayoutNode | FieldSchema
export type FormSchema = SchemaNode[]

/* ----------------------------- Errors ----------------------------- */

export interface FieldError {
  name: string
  message: string
}

/** ข้อผิดพลาดจาก server — รองรับทั้ง field/key และ message/msg */
export type ServerError = { field?: string, key?: string, name?: string, message?: string, msg?: string }

/* ----------------------------- Messages --------------------------- */

export type MessageKey =
  | RuleName | 'dateRange' | 'loadError' | 'noOptions' | 'loading' | 'loadMore' | 'search' | 'selectPlaceholder' | 'empty'
  | 'expandAll' | 'collapseAll' | 'selectedCount'
  | 'clear' | 'showPassword' | 'hidePassword' | 'openCalendar' | 'expand' | 'collapse'

export type Messages = Record<MessageKey, string>
