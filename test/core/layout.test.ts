import { describe, expect, it } from 'vitest'
import { CONTAINER_ROOT_CLASS, spanClass } from '../../src/runtime/core/layout'

describe('spanClass (viewport)', () => {
  it('maps spans to static viewport Tailwind classes', () => {
    expect(spanClass(undefined)).toBe('col-span-12')
    expect(spanClass(undefined, 'viewport')).toBe('col-span-12')
    expect(spanClass(6)).toBe('col-span-6')
    expect(spanClass(20)).toBe('col-span-12')
    expect(spanClass({ base: 12, md: 6, xl: 4 })).toBe('col-span-12 md:col-span-6 xl:col-span-4')
    expect(spanClass({ md: 3 })).toBe('col-span-12 md:col-span-3')
    expect(spanClass({ base: 12, sm: 6, md: 4, lg: 3, xl: 2 })).toBe(
      'col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 xl:col-span-2',
    )
  })
})

describe('spanClass (container)', () => {
  it('maps spans to static container-query Tailwind classes', () => {
    expect(spanClass(undefined, 'container')).toBe('col-span-12')
    expect(spanClass(6, 'container')).toBe('col-span-6')
    expect(spanClass(20, 'container')).toBe('col-span-12')
    expect(spanClass({ base: 12, md: 6, xl: 4 }, 'container')).toBe(
      'col-span-12 @md:col-span-6 @xl:col-span-4',
    )
    expect(spanClass({ md: 3 }, 'container')).toBe('col-span-12 @md:col-span-3')
    expect(spanClass({ base: 12, sm: 6, md: 4, lg: 3, xl: 2 }, 'container')).toBe(
      'col-span-12 @sm:col-span-6 @md:col-span-4 @lg:col-span-3 @xl:col-span-2',
    )
  })

  it('exposes a static @container root class for Tailwind scan', () => {
    expect(CONTAINER_ROOT_CLASS).toBe('@container')
  })
})
