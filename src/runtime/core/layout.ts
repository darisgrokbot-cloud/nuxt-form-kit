import type { Breakpoint, GridResponsive, Span } from './types'

export type { GridResponsive }

/** Mark the form root as a query container (container mode only). Kept as a literal for Tailwind scan. */
export const CONTAINER_ROOT_CLASS = '@container'

// Full class strings so Tailwind can scan them (never build prefixes dynamically).
const VIEWPORT_SPAN_CLASSES: Record<Breakpoint, string[]> = {
  base: ['', 'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6', 'col-span-7', 'col-span-8', 'col-span-9', 'col-span-10', 'col-span-11', 'col-span-12'],
  sm: ['', 'sm:col-span-1', 'sm:col-span-2', 'sm:col-span-3', 'sm:col-span-4', 'sm:col-span-5', 'sm:col-span-6', 'sm:col-span-7', 'sm:col-span-8', 'sm:col-span-9', 'sm:col-span-10', 'sm:col-span-11', 'sm:col-span-12'],
  md: ['', 'md:col-span-1', 'md:col-span-2', 'md:col-span-3', 'md:col-span-4', 'md:col-span-5', 'md:col-span-6', 'md:col-span-7', 'md:col-span-8', 'md:col-span-9', 'md:col-span-10', 'md:col-span-11', 'md:col-span-12'],
  lg: ['', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4', 'lg:col-span-5', 'lg:col-span-6', 'lg:col-span-7', 'lg:col-span-8', 'lg:col-span-9', 'lg:col-span-10', 'lg:col-span-11', 'lg:col-span-12'],
  xl: ['', 'xl:col-span-1', 'xl:col-span-2', 'xl:col-span-3', 'xl:col-span-4', 'xl:col-span-5', 'xl:col-span-6', 'xl:col-span-7', 'xl:col-span-8', 'xl:col-span-9', 'xl:col-span-10', 'xl:col-span-11', 'xl:col-span-12'],
}

const CONTAINER_SPAN_CLASSES: Record<Breakpoint, string[]> = {
  base: ['', 'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6', 'col-span-7', 'col-span-8', 'col-span-9', 'col-span-10', 'col-span-11', 'col-span-12'],
  sm: ['', '@sm:col-span-1', '@sm:col-span-2', '@sm:col-span-3', '@sm:col-span-4', '@sm:col-span-5', '@sm:col-span-6', '@sm:col-span-7', '@sm:col-span-8', '@sm:col-span-9', '@sm:col-span-10', '@sm:col-span-11', '@sm:col-span-12'],
  md: ['', '@md:col-span-1', '@md:col-span-2', '@md:col-span-3', '@md:col-span-4', '@md:col-span-5', '@md:col-span-6', '@md:col-span-7', '@md:col-span-8', '@md:col-span-9', '@md:col-span-10', '@md:col-span-11', '@md:col-span-12'],
  lg: ['', '@lg:col-span-1', '@lg:col-span-2', '@lg:col-span-3', '@lg:col-span-4', '@lg:col-span-5', '@lg:col-span-6', '@lg:col-span-7', '@lg:col-span-8', '@lg:col-span-9', '@lg:col-span-10', '@lg:col-span-11', '@lg:col-span-12'],
  xl: ['', '@xl:col-span-1', '@xl:col-span-2', '@xl:col-span-3', '@xl:col-span-4', '@xl:col-span-5', '@xl:col-span-6', '@xl:col-span-7', '@xl:col-span-8', '@xl:col-span-9', '@xl:col-span-10', '@xl:col-span-11', '@xl:col-span-12'],
}

const BREAKPOINTS: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl']

function clampSpan(n: number): number {
  return Math.min(12, Math.max(1, Math.round(n)))
}

function spanMap(responsive: GridResponsive): Record<Breakpoint, string[]> {
  return responsive === 'container' ? CONTAINER_SPAN_CLASSES : VIEWPORT_SPAN_CLASSES
}

/**
 * span → classes for the 12-column grid (default full row).
 * `responsive: 'viewport'` uses sm:/md:/… ; `'container'` uses @sm:/@md:/… (needs CONTAINER_ROOT_CLASS on an ancestor).
 */
export function spanClass(span: Span | undefined, responsive: GridResponsive = 'viewport'): string {
  const classesMap = spanMap(responsive)
  if (span === undefined) return classesMap.base[12]!
  if (typeof span === 'number') return classesMap.base[clampSpan(span)]!
  const base = span.base ?? 12
  const classes = [classesMap.base[clampSpan(base)]!]
  for (const bp of BREAKPOINTS) {
    if (bp === 'base') continue
    const n = span[bp]
    if (n !== undefined) classes.push(classesMap[bp][clampSpan(n)]!)
  }
  return classes.join(' ')
}
