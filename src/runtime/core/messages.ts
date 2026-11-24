import type { Messages } from './types'

export const th: Messages = {
  required: 'จำเป็นต้องระบุ',
  min: 'ต้องไม่น้อยกว่า {min}',
  max: 'ต้องไม่มากกว่า {max}',
  minLength: 'ต้องมีอย่างน้อย {minLength} ตัวอักษร',
  maxLength: 'ต้องไม่เกิน {maxLength} ตัวอักษร',
  minItems: 'ต้องเลือกอย่างน้อย {minItems} รายการ',
  maxItems: 'เลือกได้ไม่เกิน {maxItems} รายการ',
  pattern: 'รูปแบบไม่ถูกต้อง',
  email: 'รูปแบบอีเมลไม่ถูกต้อง',
  url: 'รูปแบบ URL ไม่ถูกต้อง',
  integer: 'ต้องเป็นจำนวนเต็ม',
  noSpecialChars: 'ห้ามใช้อักขระพิเศษ',
  compare: 'ต้อง{op} {other}',
  dateRange: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น',
  loadError: 'โหลดข้อมูลไม่สำเร็จ',
  noOptions: 'ไม่พบข้อมูล',
  loading: 'กำลังโหลด...',
  loadMore: 'โหลดเพิ่ม',
  search: 'ค้นหา...',
  selectPlaceholder: 'เลือก',
  empty: '-',
  expandAll: 'กางทั้งหมด',
  collapseAll: 'ยุบทั้งหมด',
  selectedCount: 'เลือก {count} รายการ',
}

export const en: Messages = {
  required: 'This field is required',
  min: 'Must be at least {min}',
  max: 'Must be at most {max}',
  minLength: 'Must be at least {minLength} characters',
  maxLength: 'Must be at most {maxLength} characters',
  minItems: 'Select at least {minItems} items',
  maxItems: 'Select at most {maxItems} items',
  pattern: 'Invalid format',
  email: 'Invalid email address',
  url: 'Invalid URL',
  integer: 'Must be a whole number',
  noSpecialChars: 'Special characters are not allowed',
  compare: 'Must be {op} {other}',
  dateRange: 'End date must not be before start date',
  loadError: 'Failed to load data',
  noOptions: 'No results',
  loading: 'Loading...',
  loadMore: 'Load more',
  search: 'Search...',
  selectPlaceholder: 'Select',
  empty: '-',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  selectedCount: '{count} selected',
}

export const locales: Record<string, Messages> = { th, en }

export const opLabels: Record<string, Record<string, string>> = {
  th: { '==': 'เท่ากับ', '!=': 'ไม่เท่ากับ', '>': 'มากกว่า', '>=': 'ไม่น้อยกว่า', '<': 'น้อยกว่า', '<=': 'ไม่มากกว่า' },
  en: { '==': 'equal to', '!=': 'different from', '>': 'greater than', '>=': 'on or after', '<': 'less than', '<=': 'on or before' },
}

export function resolveMessages(locale = 'th', overrides?: Partial<Messages>): Messages {
  return { ...(locales[locale] ?? th), ...overrides }
}
