# Releasing

## One-time setup

1. Create an npm **Automation** (or granular publish) token for `@stackcloud/schema-form`.
2. Add GitHub Actions secret `NPM_TOKEN` with that value.

## Publish

```bash
npm version patch   # or: minor | major
git push --follow-tags
```

Tags matching `v*.*.*` trigger `.github/workflows/release.yml`: install, `dev:prepare`, build, verify the tag matches `package.json` `version`, then `npm publish --provenance --access public`.

Do not run `npm publish` locally unless you need a manual override.
