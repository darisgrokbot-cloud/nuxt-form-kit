# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-25

First release under the package name **`@stackcloud/schema-form`** (display name **Schema Form**), continuing from `nuxt-form-kit` 0.1.0.

### Changed

- **Package rename:** `nuxt-form-kit` → **`@stackcloud/schema-form`** (display name **Schema Form**).
- Module `configKey`: `formKit` → `schemaForm` (legacy `formKit` still read with a dev warning).
- Default component prefix: `Fk` → `Sf` (`FkForm` → `SfForm`). `Fk*` components remain registered as deprecated aliases.
- Composables: `useFormKit` → `useSchemaForm`, `useFormKitRegistry` → `useSchemaFormRegistry` (old names re-exported as deprecated aliases).
- Plugin provide: `$formKit` → `$schemaForm` (`$formKit` still provided as an alias to the same registry).
- `@nuxt/ui` moved from `dependencies` to `peerDependencies` (`^4.13.0`); kept in `devDependencies`. Consumers must install `@nuxt/ui` themselves.
- README install instructions updated for the new package name and peer dependency.

### Added

- `SfForm` / `FkForm` prop `focusOnError` (default `true`): on validation error, focus and smoothly scroll to the first invalid field (Nuxt UI Form pattern). Set to `false` to keep emitting `@error` without focusing.
- Dev-time schema checks in `useSchemaForm` pass the real set of known field types (builtins + custom registry fields) into `validateSchema`.
- `CHANGELOG.md` (this file).
- Schema Form brand assets (Field Stack lockup / icon / favicon) and README light/dark lockup.

### Migration guide (`nuxt-form-kit` → `@stackcloud/schema-form`)

1. Install the new package and peer UI kit:
   ```bash
   npm uninstall nuxt-form-kit
   npm i @stackcloud/schema-form @nuxt/ui
   ```
2. In `nuxt.config.ts`, replace the module id and config key:
   ```ts
   export default defineNuxtConfig({
     modules: ['@nuxt/ui', '@stackcloud/schema-form'],
     schemaForm: { /* was formKit */ },
   })
   ```
3. Prefer the new APIs (`useSchemaForm`, `useSchemaFormRegistry`, `$schemaForm`, `<SfForm>`). Old names keep working for one version with deprecation warnings where applicable.
4. Update TypeScript imports from `nuxt-form-kit` / `nuxt-form-kit/core` to `@stackcloud/schema-form` / `@stackcloud/schema-form/core`.

## [0.1.0] - 2026-11-24

### Added

- Initial public release of the `nuxt-form-kit` Nuxt 4 module.
- Schema-driven `<FkForm>` with layout, validation, remote options, cascades, view mode, and server errors.
- Framework-free helpers via `nuxt-form-kit/core`.
- Unit tests, playground, CI, and tag-triggered npm release workflow.

[Unreleased]: https://github.com/darisgrokbot-cloud/nuxt-form-kit/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/darisgrokbot-cloud/nuxt-form-kit/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/darisgrokbot-cloud/nuxt-form-kit/releases/tag/v0.1.0
