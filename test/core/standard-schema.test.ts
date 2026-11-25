import { describe, expect, it } from 'vitest'
import { type } from 'arktype'
import * as v from 'valibot'
import { z } from 'zod'
import { useSchemaForm } from '../../src/runtime/composables/useSchemaForm'
import { defineFormSchema } from '../../src/runtime/core/index'
import {
  issueFieldName, validateStandardSchema, validateStandardValue,
} from '../../src/runtime/core/standard-schema'

describe('Standard Schema helpers', () => {
  it('maps issue path (string | PathSegment) to field name', () => {
    expect(issueFieldName({ message: 'x', path: ['email'] })).toBe('email')
    expect(issueFieldName({ message: 'x', path: [{ key: 'name' }] })).toBe('name')
    expect(issueFieldName({ message: 'x', path: ['profile', 'bio'] })).toBe('profile')
    expect(issueFieldName({ message: 'x' })).toBe('')
  })

  it('validateStandardSchema maps issues and keeps first per field', async () => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    })
    const errors = await validateStandardSchema(schema, { email: 'bad', name: 'A' })
    expect(errors.map(e => e.name).sort()).toEqual(['email', 'name'])
    expect(errors.every(e => typeof e.message === 'string' && e.message.length > 0)).toBe(true)

    const again = await validateStandardSchema(schema, { email: 'a@b.co', name: 'Ada' })
    expect(again).toEqual([])
  })

  it('validateStandardValue returns first message for a single value', async () => {
    const email = z.string().email()
    expect(await validateStandardValue(email, 'not-an-email')).toMatch(/email/i)
    expect(await validateStandardValue(email, 'a@b.co')).toBeUndefined()
  })
})

describe('form-level Standard Schema — Zod', () => {
  const fields = defineFormSchema([
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'name', type: 'text', label: 'Name' },
  ])
  const standard = z.object({
    email: z.string().email('Invalid email'),
    name: z.string().min(1, 'Name required'),
  })

  it('rejects invalid values and maps path → field errors', async () => {
    const form = useSchemaForm(fields, {
      validate: standard,
      initialValues: { email: 'nope', name: '' },
    })
    const errors = await form.runValidation()
    expect(errors.find(e => e.name === 'email')?.message).toBe('Invalid email')
    expect(errors.find(e => e.name === 'name')?.message).toBe('Name required')
    expect(await form.validate()).toBe(false)
  })

  it('passes when values satisfy the Standard Schema', async () => {
    const form = useSchemaForm(fields, {
      validate: standard,
      initialValues: { email: 'ada@example.com', name: 'Ada' },
    })
    expect(await form.runValidation()).toEqual([])
    expect(await form.validate()).toBe(true)
  })

  it('accepts schema alias and FormSchemaConfig.schema', async () => {
    const viaAlias = useSchemaForm(fields, {
      schema: standard,
      initialValues: { email: 'x', name: 'Ada' },
    })
    expect((await viaAlias.runValidation()).some(e => e.name === 'email')).toBe(true)

    const viaConfig = useSchemaForm(defineFormSchema({
      fields,
      schema: standard,
    }), {
      initialValues: { email: 'ada@example.com', name: 'Ada' },
    })
    expect(await viaConfig.runValidation()).toEqual([])
  })

  it('keeps rules DSL working alongside Standard Schema (rules first)', async () => {
    const form = useSchemaForm(defineFormSchema([
      { key: 'email', type: 'email', rules: { required: 'Email is required' } },
      { key: 'name', type: 'text' },
    ]), {
      validate: standard,
      initialValues: { email: '', name: 'Ada' },
    })
    const errors = await form.runValidation()
    expect(errors.find(e => e.name === 'email')?.message).toBe('Email is required')
  })
})

describe('form-level Standard Schema — Valibot', () => {
  it('validates with Valibot object schema', async () => {
    const fields = defineFormSchema([
      { key: 'email', type: 'email' },
      { key: 'topic', type: 'text' },
    ])
    const standard = v.object({
      email: v.pipe(v.string(), v.email('Need a valid email')),
      topic: v.pipe(v.string(), v.minLength(2, 'Topic too short')),
    })
    const bad = useSchemaForm(fields, {
      validate: standard,
      initialValues: { email: 'x', topic: 'a' },
    })
    const errors = await bad.runValidation()
    expect(errors.find(e => e.name === 'email')?.message).toBe('Need a valid email')
    expect(errors.find(e => e.name === 'topic')?.message).toBe('Topic too short')

    const good = useSchemaForm(fields, {
      validate: standard,
      initialValues: { email: 'hi@example.com', topic: 'Booking' },
    })
    expect(await good.runValidation()).toEqual([])
  })
})

describe('form-level Standard Schema — ArkType', () => {
  it('validates with ArkType and maps path issues', async () => {
    const fields = defineFormSchema([
      { key: 'email', type: 'email' },
      { key: 'seats', type: 'number' },
    ])
    // ArkType's type graph is deep; treat as Standard Schema for the form API.
    const standard = type({
      email: 'string.email',
      seats: 'number >= 1',
    }) as import('@standard-schema/spec').StandardSchemaV1
    const bad = useSchemaForm(fields, {
      validate: standard,
      initialValues: { email: 'nope', seats: 0 },
    })
    const errors = await bad.runValidation()
    expect(errors.some(e => e.name === 'email')).toBe(true)
    expect(errors.some(e => e.name === 'seats')).toBe(true)

    const good = useSchemaForm(fields, {
      validate: standard,
      initialValues: { email: 'ada@example.com', seats: 2 },
    })
    expect(await good.runValidation()).toEqual([])
  })
})

describe('per-field standard validator', () => {
  it('runs field.standard after rules', async () => {
    const form = useSchemaForm(defineFormSchema([
      {
        key: 'code',
        type: 'text',
        rules: { required: true },
        standard: z.string().regex(/^[A-Z]{3}-\d{3}$/, 'Use AAA-000'),
      },
    ]), { initialValues: { code: 'bad' } })

    const errors = await form.runValidation()
    expect(errors[0]?.message).toBe('Use AAA-000')

    form.setValue('code', 'ABC-123')
    expect(await form.runValidation()).toEqual([])
  })
})

describe('async Standard Schema validation', () => {
  it('awaits async ~standard.validate', async () => {
    const asyncEmail: z.ZodType<string> = z.string().email().refine(
      async value => value !== 'taken@example.com',
      { message: 'Email already registered' },
    )

    const form = useSchemaForm(defineFormSchema([
      { key: 'email', type: 'email', standard: asyncEmail },
    ]), { initialValues: { email: 'taken@example.com' } })

    const errors = await form.runValidation()
    expect(errors[0]?.message).toBe('Email already registered')

    form.setValue('email', 'free@example.com')
    expect(await form.runValidation()).toEqual([])
  })

  it('supports async form-level Standard Schema', async () => {
    const standard = z.object({
      username: z.string().min(3).refine(
        async value => value !== 'admin',
        { message: 'Username unavailable' },
      ),
    })

    const form = useSchemaForm(defineFormSchema([
      { key: 'username', type: 'text' },
    ]), {
      validate: standard,
      initialValues: { username: 'admin' },
    })
    expect((await form.runValidation())[0]?.message).toBe('Username unavailable')

    form.setValue('username', 'ada')
    expect(await form.runValidation()).toEqual([])
  })
})
