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

## Docs

Full documentation: [https://schema-form.stackcloud.cc](https://schema-form.stackcloud.cc)

## License

[MIT](https://github.com/darisgrokbot-cloud/schema-form/blob/main/LICENSE)
