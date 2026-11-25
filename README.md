<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/darisgrokbot-cloud/schema-form/main/assets/lockup-dark.svg" />
    <img alt="Schema Form" src="https://raw.githubusercontent.com/darisgrokbot-cloud/schema-form/main/assets/lockup-light.svg" width="320" />
  </picture>
</p>

# Schema Form (`@stackcloud/schema-form`)

Schema-driven form inputs for **Nuxt 4**, built on Nuxt UI. Define a schema once and get layout, validation, remote options, cascades, view mode, and server errors.

> This project is **not affiliated with** [FormKit](https://formkit.com).

## Install

```bash
npm i @stackcloud/schema-form @nuxt/ui @internationalized/date
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@stackcloud/schema-form'],
  schemaForm: {
    // prefix: 'Sf', // default → <SfForm>
    // grid: { responsive: 'viewport' }, // default — see Grid responsive modes
  },
})
```

`@nuxt/ui` and `@internationalized/date` are **peer dependencies** — install them yourself (`@internationalized/date` is required by the built-in date field). See [Nuxt UI docs](https://ui.nuxt.com).

Wrap your app with `<UApp>` (required by Nuxt UI popovers, dropdowns, and calendars).

## Usage

```vue
<script setup lang="ts">
const schema = defineFormSchema([
  { key: 'name', type: 'text', label: 'Name', rules: { required: true } },
  { key: 'email', type: 'email', label: 'Email', rules: { email: true } },
  { key: 'level', type: 'select', label: 'Level', options: { items: ['Junior', 'Senior'] } },
])

const data = ref({})

async function save(payload: Record<string, unknown>) {
  await $fetch('/api/users', { method: 'POST', body: payload })
}
</script>

<template>
  <SfForm v-model="data" :schema="schema" submit-label="Save" @submit="save" />
</template>
```

On validation error, `SfForm` focuses and scrolls to the first invalid field by default. Set `:focus-on-error="false"` to disable that behavior (the `@error` event still fires).

## Grid responsive modes

`layout.span` breakpoints (`sm` / `md` / `lg` / `xl`) can follow either the **viewport** or the **form container**:

| Mode | Classes | When to use |
| --- | --- | --- |
| `viewport` (default) | `sm:col-span-*`, `md:col-span-*`, … | Full-width pages and drawers that already match the screen width. |
| `container` | `@sm:col-span-*`, `@md:col-span-*`, … | Forms in a narrow sidebar, split pane, or card on a wide screen — columns size to the form width, not the window. |

Default stays `viewport` so existing apps keep the same layout. Opt in app-wide:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@stackcloud/schema-form'],
  schemaForm: {
    grid: { responsive: 'container' },
  },
})
```

Or per form (overrides the module default):

```vue
<template>
  <!-- Product filter in a 320px sidebar on a desktop layout -->
  <aside class="w-80 border-r border-default p-4">
    <SfForm
      v-model="filters"
      :schema="filterSchema"
      responsive="container"
      submit-label="Apply"
    />
  </aside>
</template>
```

In `container` mode the form root gets Tailwind’s `@container` class. Both viewport and container class maps are written as full string literals in the module runtime so Tailwind v4’s scanner (via the module’s injected CSS `@source`, or your own `@source` when `schemaForm.css: false`) keeps every variant.

## Typed values

`defineFormSchema` + `InferFormValues` narrow payload types from field definitions. Untyped usage still defaults to `Record<string, any>`.

```ts
const schema = defineFormSchema([
  { key: 'title', type: 'text' },
  { key: 'budget', type: 'money' },
  { key: 'active', type: 'switch' },
])

type ProjectValues = InferFormValues<typeof schema>
// { title: string | null, budget: number | null, active: boolean }

const form = useSchemaForm(schema)
form.getPayload().budget // number | null
```

## Standard Schema validation

Validate with any [Standard Schema](https://standardschema.dev) library (Zod, Valibot, ArkType, …) alongside the existing `rules` DSL. Only `@standard-schema/spec` types are a runtime dependency of this package — install Zod/Valibot/ArkType yourself.

### Form-level (`validate` / `schema`)

```ts
import { z } from 'zod'

const fields = defineFormSchema([
  { key: 'email', type: 'email', label: 'Email' },
  { key: 'password', type: 'password', label: 'Password' },
])

const signUp = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Option A — prop / composable option
const form = useSchemaForm(fields, { validate: signUp })
// Option B — config object (same Standard Schema; typed via InferOutput)
const schema = defineFormSchema({ fields, schema: signUp })
type SignUpValues = InferFormValues<typeof schema> // { email: string, password: string }
```

```vue
<SfForm :schema="fields" :validate="signUp" submit-label="Create account" @submit="onSubmit" />
```

Issues are mapped by `path[0]` → field key. Async `~standard.validate` is supported. The `rules` DSL still runs first per field; Standard Schema errors fill in remaining fields.

### Per-field `standard`

```ts
defineFormSchema([
  {
    key: 'email',
    type: 'email',
    label: 'Email',
    rules: { required: true },
    standard: z.string().email('Enter a valid email'),
  },
  {
    key: 'guests',
    type: 'number',
    label: 'Guests',
    standard: z.number().int().min(1).max(20),
  },
])
```

When a form-level Standard Schema is present, `InferFormValues` / `useSchemaForm` prefer its `InferOutput` over field-type inference.

## Docs

Full documentation: [https://schema-form.stackcloud.cc](https://schema-form.stackcloud.cc)

## License

[MIT](https://github.com/darisgrokbot-cloud/schema-form/blob/main/LICENSE)
