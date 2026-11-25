import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import { useSchemaForm } from '../../src/runtime/composables/useSchemaForm'
import { defineFormSchema } from '../../src/runtime/core/index'
import type { InferFormValues } from '../../src/runtime/core/infer'
import type { FormSchema, Values } from '../../src/runtime/core/types'

describe('InferFormValues — field schema', () => {
  it('infers value types from defineFormSchema fields', () => {
    const schema = defineFormSchema([
      { key: 'name', type: 'text' },
      { key: 'email', type: 'email' },
      { key: 'age', type: 'number' },
      { key: 'agree', type: 'checkbox' },
      { key: 'notify', type: 'switch' },
      { key: 'start', type: 'date' },
      { key: 'window', type: 'date-range' },
      { key: 'accent', type: 'color' },
      { key: 'opens', type: 'time' },
      { key: 'published', type: 'datetime' },
      { key: 'labels', type: 'tags' },
      { key: 'cover', type: 'file' },
      { key: 'gallery', type: 'file', multiple: true },
      { key: 'volume', type: 'slider' },
      { key: 'price', type: 'slider', range: true },
      { key: 'otp', type: 'pin' },
      { key: 'tags', type: 'checkbox-group', options: { items: ['a'] } },
      { key: 'roles', type: 'select', multiple: true, options: { items: ['a'] } },
      { key: 'level', type: 'select', options: { items: ['a'] } },
    ])

    type V = InferFormValues<typeof schema>
    expectTypeOf<V['name']>().toEqualTypeOf<string | null>()
    expectTypeOf<V['email']>().toEqualTypeOf<string | null>()
    expectTypeOf<V['age']>().toEqualTypeOf<number | null>()
    expectTypeOf<V['agree']>().toEqualTypeOf<boolean>()
    expectTypeOf<V['notify']>().toEqualTypeOf<boolean>()
    expectTypeOf<V['start']>().toEqualTypeOf<string | null>()
    expectTypeOf<V['window']>().toEqualTypeOf<{ start: string | null, end: string | null }>()
    expectTypeOf<V['accent']>().toEqualTypeOf<string | null>()
    expectTypeOf<V['opens']>().toEqualTypeOf<string | null>()
    expectTypeOf<V['published']>().toEqualTypeOf<string | null>()
    expectTypeOf<V['labels']>().toEqualTypeOf<string[]>()
    expectTypeOf<V['cover']>().toEqualTypeOf<File | null>()
    expectTypeOf<V['gallery']>().toEqualTypeOf<File[]>()
    expectTypeOf<V['volume']>().toEqualTypeOf<number | null>()
    expectTypeOf<V['price']>().toEqualTypeOf<[number, number] | null>()
    expectTypeOf<V['otp']>().toEqualTypeOf<string | null>()
    expectTypeOf<V['tags']>().toEqualTypeOf<Array<string | number | boolean | null>>()
    expectTypeOf<V['roles']>().toEqualTypeOf<Array<string | number | boolean | null>>()
    expectTypeOf<V['level']>().toEqualTypeOf<string | number | boolean | null>()
  })

  it('falls back to Values for untyped FormSchema', () => {
    const schema: FormSchema = [{ key: 'x', type: 'text' }]
    type V = InferFormValues<typeof schema>
    expectTypeOf<V>().toEqualTypeOf<Values>()
  })
})

describe('InferFormValues — Standard Schema preferred', () => {
  it('prefers Zod InferOutput from FormSchemaConfig.schema', () => {
    const def = defineFormSchema({
      fields: [
        { key: 'email', type: 'email' },
        { key: 'name', type: 'text' },
      ],
      schema: z.object({
        email: z.string().email(),
        name: z.string(),
        // extra key only on Standard Schema
        remember: z.boolean().optional(),
      }),
    })

    type V = InferFormValues<typeof def>
    expectTypeOf<V['email']>().toEqualTypeOf<string>()
    expectTypeOf<V['name']>().toEqualTypeOf<string>()
    expectTypeOf<V['remember']>().toEqualTypeOf<boolean | undefined>()
  })

  it('prefers validate option on useSchemaForm for getPayload typing', () => {
    const fields = defineFormSchema([
      { key: 'email', type: 'email' },
      { key: 'name', type: 'text' },
    ])
    const standard = z.object({
      email: z.string().email(),
      name: z.string(),
    })

    const form = useSchemaForm(fields, { validate: standard })
    expectTypeOf(form.getPayload()).toEqualTypeOf<{ email: string, name: string }>()
    expectTypeOf(form.values.value).toEqualTypeOf<{ email: string, name: string }>()
  })

  it('types useSchemaForm from field schema when no Standard Schema', () => {
    const schema = defineFormSchema([
      { key: 'title', type: 'text' },
      { key: 'budget', type: 'money' },
    ])
    const form = useSchemaForm(schema)
    expectTypeOf(form.getPayload().title).toEqualTypeOf<string | null>()
    expectTypeOf(form.getPayload().budget).toEqualTypeOf<number | null>()
  })
})
