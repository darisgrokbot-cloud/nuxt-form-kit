# nuxt-form-kit

Schema-driven form inputs for **Nuxt 4**, built on Nuxt UI. Define a schema once and get layout, validation, remote options, cascades, view mode, and server errors.

## Install

```bash
npm i nuxt-form-kit
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-form-kit'],
})
```

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

## Docs

Full documentation: [https://formkit.stackcloud.cc](https://formkit.stackcloud.cc)

## License

[MIT](./LICENSE)
