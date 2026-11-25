# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-11-25

### Removed

- Transitional compatibility aliases from 0.2.x. The supported surface is `useSchemaForm`, `useSchemaFormRegistry`, `$schemaForm`, the `schemaForm` Nuxt config key, and `Sf*` components only.

### Changed

- Docs homepage and package metadata now point at [https://schema-form.stackcloud.cc](https://schema-form.stackcloud.cc).

## [0.2.0] - 2026-11-25

Initial public release of **Schema Form** (`@stackcloud/schema-form`) for Nuxt 4.

### Added

- Schema-driven `<SfForm>` with layout, validation, remote options, cascades, view mode, and server errors.
- `useSchemaForm` / `useSchemaFormRegistry` composables and `$schemaForm` plugin registry.
- `focusOnError` on `SfForm` (default `true`): focus and smoothly scroll to the first invalid field.
- Dev-time schema checks via `knownFieldTypes` + `validateSchema`.
- Framework-free helpers via `@stackcloud/schema-form/core`.
- Brand assets (Field Stack lockup / icon / favicon) with README light/dark lockup.
- Unit tests, playground, CI, and tag-triggered npm release workflow.

[Unreleased]: https://schema-form.stackcloud.cc
[0.3.0]: https://schema-form.stackcloud.cc
[0.2.0]: https://schema-form.stackcloud.cc
