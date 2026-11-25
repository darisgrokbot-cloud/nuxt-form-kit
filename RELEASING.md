# Releasing

## One-time setup

1. Create an npm **Automation** (or granular publish) token for `@stackcloud/schema-form`, **or** configure [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) for this repo.
2. If using a token, add GitHub Actions secret `NPM_TOKEN` with that value. The workflow still sets `id-token: write` for `--provenance`.

## Publish

```bash
npm version patch   # or: minor | major
git push --follow-tags
```

Tags matching `v*.*.*` trigger `.github/workflows/release.yml`: install, upgrade npm, `dev:prepare`, build, verify the tag matches `package.json` `version`, verify the publish manifest carries a README, then `npm publish --provenance --access public`.

Do not run `npm publish` locally unless you need a manual override.

## npm packument README (why 0.2–0.4 look empty)

Symptom: `npm view @stackcloud/schema-form readme` / packument `readme` + `readmeFilename` are empty for 0.2.0–0.4.0, while the tarball still contains `package/README.md` (unpkg serves it).

Cause:

1. `package.json` `"files"` listed only `"dist"`. npm still **packs** `README.md` via its always-include rules, so the tarball is fine.
2. Packument `readme` / `readmeFilename` come from the **publish manifest** (`PackageJson.prepare()`), which `libnpmpublish` puts on `versions[v]`; the registry promotes them to the document root (it does **not** re-read the tarball for the website field in all cases). Publishes for this package (GitHub Actions, Node 20, **npm 10.8.2**) left those root fields empty.
3. Publishing a pre-packed `.tgz` would be worse: that path skips `prepare()` and reads only `package/package.json` from the archive (no embedded `readme`).

Fix for the **next** publish (this branch): list `README.md` and `LICENSE` in `"files"`, run publish with a current npm, and fail the release job if `prepare()` would ship without a usable README. Already-published versions are not republished.
