# Releasing

## One-time setup

1. Create an npm **Automation** (or granular publish) token for `@stackcloud/schema-form`, **or** configure [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) for this repo.
2. If using a token, add GitHub Actions secret `NPM_TOKEN` with that value. The workflow still sets `id-token: write` for `--provenance`.

## Versioning policy

Schema Form follows [Semantic Versioning](https://semver.org) while still in `0.x`:

- **Minor** (`0.5.0`, `0.6.0`, …) — new features or field types. Any behaviour or type change that could break existing apps is listed under a `### BREAKING` heading in `CHANGELOG.md`.
- **Patch** (`0.5.1`, …) — bug fixes only. Cut patches from a maintenance branch created from the release tag (for example `git switch -c release/0.5 v0.5.0`), never from `main`, so unreleased features on `main` do not leak into a patch.
- **1.0.0** — once the public API (schema shape, `useSchemaForm`, `Sf*` components, config key) is considered stable.

The changelog uses [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) sections (`Added` / `Changed` / `Fixed` / `Removed`). Move `## [Unreleased]` entries into `## [x.y.z] - YYYY-MM-DD` in the same PR that bumps `package.json`.

## Publish

1. Open a release PR that bumps `package.json` / `package-lock.json` and finalises the CHANGELOG section; merge once CI is green.
2. Tag the merge commit and push the tag:

```bash
git tag -a v0.5.0 -m "v0.5.0" <merge-sha>
git push origin v0.5.0
```

Tags matching `v*.*.*` trigger `.github/workflows/release.yml`: install, upgrade npm, `dev:prepare`, build, verify the tag matches `package.json` `version`, verify the publish manifest carries a README, then `npm publish --provenance --access public` (dist-tag `latest`), and finally create the GitHub Release from the matching CHANGELOG section.

Do not run `npm publish` locally unless you need a manual override.

## npm packument README (why 0.2–0.4 look empty)

Symptom: `npm view @stackcloud/schema-form readme` / packument `readme` + `readmeFilename` are empty for 0.2.0–0.4.0, while the tarball still contains `package/README.md` (unpkg serves it).

Cause:

1. `package.json` `"files"` listed only `"dist"`. npm still **packs** `README.md` via its always-include rules, so the tarball is fine.
2. Packument `readme` / `readmeFilename` come from the **publish manifest** (`PackageJson.prepare()`), which `libnpmpublish` puts on `versions[v]`; the registry promotes them to the document root (it does **not** re-read the tarball for the website field in all cases). Publishes for this package (GitHub Actions, Node 20, **npm 10.8.2**) left those root fields empty.
3. Publishing a pre-packed `.tgz` would be worse: that path skips `prepare()` and reads only `package/package.json` from the archive (no embedded `readme`).

Fix for the **next** publish (this branch): list `README.md` and `LICENSE` in `"files"`, run publish with a current npm, and fail the release job if `prepare()` would ship without a usable README. Already-published versions are not republished.
