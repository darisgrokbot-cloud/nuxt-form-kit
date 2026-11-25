/**
 * Focus and smoothly scroll to the first invalid field (Nuxt UI Form pattern).
 * Uses `errors[0].id` → `document.getElementById(id)`.
 */
export function focusFirstError(
  errors: { id?: string, name?: string, message?: string }[] | undefined,
  enabled = true,
): void {
  if (!enabled || typeof document === 'undefined') return
  const id = errors?.[0]?.id
  if (!id) return
  const el = document.getElementById(id)
  if (!el) return
  el.focus()
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
