<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/lockup-dark.svg" />
    <img alt="Schema Form" src="./assets/lockup-light.svg" width="320" />
  </picture>
</p>

# Schema Form (`@stackcloud/schema-form`)

> Formerly published as `nuxt-form-kit`.

Schema-driven form inputs for **Nuxt 4**, built on Nuxt UI. Define a schema once and get layout, validation, remote options, cascades, view mode, and server errors.

## Install

```bash
npm i @stackcloud/schema-form @nuxt/ui
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@stackcloud/schema-form'],
  schemaForm: {
    // prefix: 'Sf', // default → <SfForm>
  },
})
```

`@nuxt/ui` is a **peer dependency** — install and register it yourself (see [Nuxt UI docs](https://ui.nuxt.com)).

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

### Migrating from `nuxt-form-kit`

| Old | New |
|-----|-----|
| `nuxt-form-kit` | `@stackcloud/schema-form` |
| `formKit` in `nuxt.config` | `schemaForm` |
| `useFormKit` / `useFormKitRegistry` | `useSchemaForm` / `useSchemaFormRegistry` |
| `$formKit` | `$schemaForm` |
| `<FkForm>` (prefix `Fk`) | `<SfForm>` (prefix `Sf`) |

Deprecated aliases (`formKit`, `useFormKit`, `$formKit`, `Fk*`) remain for one version.

## Docs

Full documentation: [https://formkit.stackcloud.cc](https://formkit.stackcloud.cc)

## License

[MIT](./LICENSE)
