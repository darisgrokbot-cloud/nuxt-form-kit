# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Built-in field types for the upcoming **0.5.0** minor (no version bump in this branch):
  - **`color`** — Nuxt UI `UColorPicker` in a `UPopover` (swatch + hex/`rgb`/`hsl`/`cmyk`/`lab` input, optional `swatches`). Value: `string | null`.
  - **`file`** — `UFileUpload` with `accept`, `multiple`, `maxSize` / `maxFiles` (messages `fileTooLarge` / `tooManyFiles`), and image `preview`. Value: `File | File[] | null`.
  - **`tags`** — `UInputTags` with `max`, `unique` (default `true`), `placeholder`. Value: `string[]`.
  - **`time`** — `UInputTime` (`@internationalized/date` `Time`) with `granularity` / `hourCycle` / `min` / `max`. Value: `HH:mm` or `HH:mm:ss` string | `null`.
  - **`datetime`** — `UInputDate` + `CalendarDateTime` (`granularity` minute/second, `min` / `max`). Value: local ISO `YYYY-MM-DDTHH:mm` (or with seconds) | `null`.
  - **`slider`** — `USlider` with `min` / `max` / `step` / `range`; `showValue` renders a live value label under the track (pass `props.tooltip` for Nuxt UI tooltips when `UApp` provides TooltipProvider). Value: `number` or `[number, number]`.
  - **`pin`** — `UPinInput` with `length` (default 6), `inputType` (`number`|`text`, maps to UPinInput `type` — renamed to avoid clashing with schema `type: 'pin'`), `mask`, `otp`. Value: joined `string`.

## [0.4.0] - 2026-11-25

### Added

- Opt-in **container-query grid** mode: `schemaForm.grid.responsive: 'viewport' | 'container'` (default `'viewport'`) and a matching `responsive` prop on `<SfForm>`. In `container` mode the form root gets `@container` and `layout.span` breakpoints use Tailwind v4 container variants (`@sm:` / `@md:` / `@lg:` / `@xl:`) so forms in narrow sidebars no longer follow the viewport width.
- Component tests for `<SfForm>` and main field types via `@nuxt/test-utils` (separate Vitest `components` project + CI job), keeping core unit tests in a fast Node project.
- **Standard Schema** validation ([standardschema.dev](https://standardschema.dev)): optional form-level `validate` / `schema` (on `useSchemaForm`, `<SfForm>`, or `defineFormSchema({ fields, schema })`) and per-field `standard`. Works with Zod, Valibot, ArkType, and any `~standard` implementation. Issues map by path → field errors; async validate supported. Existing `rules` DSL is unchanged and still runs first.
- **`InferFormValues<typeof schema>`** — infer payload types from `defineFormSchema` fields (or from a Standard Schema `InferOutput` when provided). `useSchemaForm` / `getPayload` / `values` are typed from that inference; untyped usage still defaults to `Record<string, any>`.
- Dependency: `@standard-schema/spec` (types only). Zod / Valibot / ArkType are optional peer-style installs for apps and remain **devDependencies** in this repo for tests.

### Fixed

- Avoid TDZ crash when `serverErrors` are applied during `useSchemaForm` setup (`uForm` was referenced before initialization).
- Re-apply pending `serverErrors` once `UForm` binds, so initial server-error props show on first paint.
- Tree-select combobox now exposes `aria-controls`, `aria-activedescendant`, listbox/option ids, and wires `aria-invalid` / `aria-describedby` via `useFormField`; clear and expand/collapse controls use translated labels.
- Collapsible section toggles expose `aria-expanded` and `aria-controls` for the section content region.
- Password show/hide and date calendar buttons use message-registry `aria-label`s (Thai default + English) instead of hard-coded English; password toggle keeps `aria-pressed`.

## [0.3.1] - 2026-11-25

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

[Unreleased]: https://github.com/darisgrokbot-cloud/schema-form/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/darisgrokbot-cloud/schema-form/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/darisgrokbot-cloud/schema-form/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/darisgrokbot-cloud/schema-form/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/darisgrokbot-cloud/schema-form/releases/tag/v0.2.0
