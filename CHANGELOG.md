# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Disclaimer that this package is **not affiliated with FormKit (formkit.com)** in the README and `package.json` description.
- `FkForm` prop `focusOnError` (default `true`): on validation error, focus and smoothly scroll to the first invalid field (Nuxt UI Form pattern). Set to `false` to keep emitting `@error` without focusing.
- `CHANGELOG.md` (this file).
- Dev-time schema checks in `useFormKit` now pass the real set of known field types (builtins + custom registry fields) into `validateSchema`.

### Changed

- `@nuxt/ui` moved from `dependencies` to `peerDependencies`. Consumers must install and register `@nuxt/ui` themselves.
- README install instructions updated accordingly.

## [0.1.0] - 2026-11-24

### Added

- Initial public release of the `nuxt-form-kit` Nuxt 4 module.
- Schema-driven `<FkForm>` with layout, validation, remote options, cascades, view mode, and server errors.
- Framework-free helpers via `nuxt-form-kit/core`.
- Unit tests, playground, CI, and tag-triggered npm release workflow.

[Unreleased]: https://github.com/darisgrokbot-cloud/nuxt-form-kit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/darisgrokbot-cloud/nuxt-form-kit/releases/tag/v0.1.0
