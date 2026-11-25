import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FieldError } from './types'

export type { StandardSchemaV1 }

/** Type guard for Standard Schema (`~standard`) validators. */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  if (!value || typeof value !== 'object') return false
  const props = (value as { '~standard'?: { validate?: unknown } })['~standard']
  return typeof props?.validate === 'function'
}

function pathKey(segment: PropertyKey | StandardSchemaV1.PathSegment): PropertyKey {
  if (segment !== null && typeof segment === 'object' && 'key' in segment) return segment.key
  return segment as PropertyKey
}

/** Map a Standard Schema issue path to a form field key (first path segment). */
export function issueFieldName(issue: StandardSchemaV1.Issue): string {
  if (!issue.path?.length) return ''
  return String(pathKey(issue.path[0]!))
}

/**
 * Run a Standard Schema validator (sync or async) and map issues to FieldError[].
 * Multiple issues on the same field keep the first message.
 */
export async function validateStandardSchema(
  schema: StandardSchemaV1,
  value: unknown,
): Promise<FieldError[]> {
  let result = schema['~standard'].validate(value)
  if (result instanceof Promise) result = await result
  if (!result.issues?.length) return []

  const errors: FieldError[] = []
  const seen = new Set<string>()
  for (const issue of result.issues) {
    const name = issueFieldName(issue)
    if (seen.has(name)) continue
    seen.add(name)
    errors.push({ name, message: issue.message })
  }
  return errors
}

/** Validate a single value with a Standard Schema; return the first error message. */
export async function validateStandardValue(
  schema: StandardSchemaV1,
  value: unknown,
): Promise<string | undefined> {
  let result = schema['~standard'].validate(value)
  if (result instanceof Promise) result = await result
  if (!result.issues?.length) return undefined
  return result.issues[0]?.message
}

/**
 * Sync-only check for isValid — returns undefined when result is a Promise
 * (async validators are not reflected in the sync isValid computed).
 */
export function validateStandardSync(
  schema: StandardSchemaV1,
  value: unknown,
): string | undefined {
  const result = schema['~standard'].validate(value)
  if (result instanceof Promise) return undefined
  if (!result.issues?.length) return undefined
  return result.issues[0]?.message
}
