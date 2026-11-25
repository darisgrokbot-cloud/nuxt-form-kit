import { afterEach, describe, expect, it, vi } from 'vitest'
import { focusFirstError } from '../../src/runtime/internal/focusFirstError'

describe('focusFirstError', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('focuses and scrolls to the first error element when enabled', () => {
    const el = {
      focus: vi.fn(),
      scrollIntoView: vi.fn(),
    }
    vi.stubGlobal('document', {
      getElementById: vi.fn((id: string) => (id === 'field-name' ? el : null)),
    })

    focusFirstError([{ id: 'field-name', name: 'name', message: 'Required' }], true)

    expect(document.getElementById).toHaveBeenCalledWith('field-name')
    expect(el.focus).toHaveBeenCalledTimes(1)
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('does nothing when focusOnError is false (still allows caller to emit errors)', () => {
    const el = {
      focus: vi.fn(),
      scrollIntoView: vi.fn(),
    }
    const getElementById = vi.fn(() => el)
    vi.stubGlobal('document', { getElementById })

    focusFirstError([{ id: 'field-name', name: 'name', message: 'Required' }], false)

    expect(getElementById).not.toHaveBeenCalled()
    expect(el.focus).not.toHaveBeenCalled()
    expect(el.scrollIntoView).not.toHaveBeenCalled()
  })

  it('skips when the first error has no id or the element is missing', () => {
    const getElementById = vi.fn(() => null)
    vi.stubGlobal('document', { getElementById })

    focusFirstError([{ name: 'name', message: 'Required' }], true)
    focusFirstError([{ id: 'missing', name: 'name', message: 'Required' }], true)

    expect(getElementById).toHaveBeenCalledTimes(1)
    expect(getElementById).toHaveBeenCalledWith('missing')
  })
})
