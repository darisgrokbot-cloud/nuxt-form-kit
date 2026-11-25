# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Next release: rename this section to ## [0.3.1] - YYYY-MM-DD, bump package.json, add a fresh empty [Unreleased], then tag v0.3.1. -->

### Changed

- README lockup images use absolute `raw.githubusercontent.com` URLs so the logo renders on npm (package tarball does not include `assets/`).
- `@internationalized/date` moved from `dependencies` to `peerDependencies` (still listed in `devDependencies` for local tests / playground). Install it alongside `@nuxt/ui`.

### Added

- README note that Schema Form is not affiliated with FormKit ([formkit.com](https://formkit.com)).
- Migration guide from `nuxt-form-kit` 0.1.0 in this changelog.
- `release.yml` creates a GitHub Release from the matching CHANGELOG section when a `v*` tag is pushed (in addition to npm publish).

## [0.3.0] - 2026-11-25

### Removed

- Transitional compatibility aliases from 0.2.x. The supported surface is `useSchemaForm`, `useSchemaFormRegistry`, `$schemaForm`, the `schemaForm` Nuxt config key, and `Sf*` components only.

### Changed

- Docs homepage and package metadata now point at [https://schema-form.stackcloud.cc](https://schema-form.stackcloud.cc).

## [0.2.0] - 2026-11-25

Initial public release of **Schema Form** (`@stackcloud/schema-form`) for Nuxt 4, renamed from `nuxt-form-kit` 0.1.0. Deprecated aliases for the old names were kept for one version (removed in 0.3.0).

### Added

- Schema-driven `<SfForm>` with layout, validation, remote options, cascades, view mode, and server errors.
- `useSchemaForm` / `useSchemaFormRegistry` composables and `$schemaForm` plugin registry.
- `focusOnError` on `SfForm` (default `true`): focus and smoothly scroll to the first invalid field.
- Dev-time schema checks via `knownFieldTypes` + `validateSchema`.
- Framework-free helpers via `@stackcloud/schema-form/core`.
- Brand assets (Field Stack lockup / icon / favicon) with README light/dark lockup.
- Unit tests, playground, CI, and tag-triggered npm release workflow.

### Migrating from `nuxt-form-kit` 0.1.0

`0.2.0` was the rename release (new package name + deprecated aliases). `0.3.0` removed those aliases — update call sites before upgrading past 0.2.x.

| Old (`nuxt-form-kit` 0.1.0) | New (`@stackcloud/schema-form`) |
|-----------------------------|----------------------------------|
| Package `nuxt-form-kit` | `@stackcloud/schema-form` |
| Import `nuxt-form-kit` / `nuxt-form-kit/core` | `@stackcloud/schema-form` / `@stackcloud/schema-form/core` |
| `nuxt.config` key `formKit` | `schemaForm` |
| `runtimeConfig.public.formKit` | `runtimeConfig.public.schemaForm` |
| Module default prefix `Fk` → `<FkForm>`, `<FkField>`, … | Prefix `Sf` → `<SfForm>`, … |
| `useFormKit` | `useSchemaForm` |
| `useFormKitRegistry` | `useSchemaFormRegistry` |
| `$formKit` (plugin provide) | `$schemaForm` |
| Types `FormKitInstance`, `UseFormKitOptions`, `FormKitRegistry`, `FormKitRegistryInstance` | `SchemaFormInstance`, `UseSchemaFormOptions`, `SchemaFormRegistry`, `SchemaFormRegistryInstance` |
| Injection keys `FORM_KIT_KEY` / `FORM_KIT_SLOTS` | `SCHEMA_FORM_KEY` / `SCHEMA_FORM_SLOTS` |
| Log / CSS id prefix `[form-kit]` / `form-kit.css` | `[schema-form]` / `schema-form.css` |

Example `nuxt.config.ts` after migration:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@stackcloud/schema-form'],
  schemaForm: {
    // was formKit: { … }
  },
})
```

[Unreleased]: https://github.com/darisgrokbot-cloud/schema-form/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/darisgrokbot-cloud/schema-form/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/darisgrokbot-cloud/schema-form/releases/tag/v0.2.0
