# nuxt-form-kit

> **Not affiliated with [FormKit](https://formkit.com).** This is an independent Nuxt 4 module.

Schema-driven form inputs for **Nuxt 4**, built on Nuxt UI. Define a schema once and get layout, validation, remote options, cascades, view mode, and server errors.

## Install

```bash
npm i nuxt-form-kit @nuxt/ui
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', 'nuxt-form-kit'],
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
  <FkForm v-model="data" :schema="schema" submit-label="Save" @submit="save" />
</template>
```

On validation error, `FkForm` focuses and scrolls to the first invalid field by default. Set `:focus-on-error="false"` to disable that behavior (the `@error` event still fires).

## Docs

Full documentation: [https://formkit.stackcloud.cc](https://formkit.stackcloud.cc)

## License

[MIT](./LICENSE)
