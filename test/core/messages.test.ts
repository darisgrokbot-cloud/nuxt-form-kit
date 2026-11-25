import { describe, expect, it } from 'vitest'
import { en, resolveMessages, th } from '../../src/runtime/core/messages'
import type { MessageKey } from '../../src/runtime/core/types'

const A11Y_KEYS: MessageKey[] = [
  'clear',
  'showPassword',
  'hidePassword',
  'openCalendar',
  'openColorPicker',
  'expand',
  'collapse',
]

describe('messages a11y registry', () => {
  it('thai and english define the same keys', () => {
    expect(Object.keys(th).sort()).toEqual(Object.keys(en).sort())
  })

  it('includes translated a11y strings in th and en', () => {
    for (const key of A11Y_KEYS) {
      expect(th[key], `th.${key}`).toBeTruthy()
      expect(en[key], `en.${key}`).toBeTruthy()
      expect(th[key]).not.toBe(en[key])
    }
  })

  it('resolveMessages returns a11y keys for default locale (th)', () => {
    const messages = resolveMessages()
    expect(messages.clear).toBe('ล้างค่า')
    expect(messages.showPassword).toBe('แสดงรหัสผ่าน')
    expect(messages.hidePassword).toBe('ซ่อนรหัสผ่าน')
    expect(messages.openCalendar).toBe('เปิดปฏิทิน')
    expect(messages.openColorPicker).toBe('เลือกสี')
    expect(messages.expand).toBe('กาง')
    expect(messages.collapse).toBe('ยุบ')
  })

  it('resolveMessages returns english a11y strings', () => {
    const messages = resolveMessages('en')
    expect(messages.clear).toBe('Clear')
    expect(messages.showPassword).toBe('Show password')
    expect(messages.hidePassword).toBe('Hide password')
    expect(messages.openCalendar).toBe('Open calendar')
    expect(messages.openColorPicker).toBe('Pick a color')
    expect(messages.expand).toBe('Expand')
    expect(messages.collapse).toBe('Collapse')
  })

  it('resolveMessages allows overriding a11y strings', () => {
    const messages = resolveMessages('th', { clear: 'ลบออก', showPassword: 'โชว์' })
    expect(messages.clear).toBe('ลบออก')
    expect(messages.showPassword).toBe('โชว์')
    expect(messages.hidePassword).toBe('ซ่อนรหัสผ่าน')
  })
})
