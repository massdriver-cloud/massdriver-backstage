# Releasing

The three publishable packages are versioned **in lockstep** — one version,
one tag, all three published together:

- `@massdriver-cloud/backstage-plugin-massdriver`
- `@massdriver-cloud/backstage-plugin-massdriver-backend`
- `@massdriver-cloud/backstage-plugin-massdriver-common`

`common` is a hard dependency of the other two and the frontend/backend relay
protocol evolves together, so independent versions would only create a
compatibility matrix. Yarn rewrites the `workspace:^` ranges to `^X.Y.Z` at
publish time, so the published packages stay pinned to the same release line.

## Cutting a release

`main` is protected, so the version bump lands via a PR and the tag is applied
to the merged commit:

```bash
# 1. On a branch, from a clean tree:
yarn release 1.0.0       # bumps all three package.jsons + lockfile,
                         # creates the "Release v1.0.0" commit (no tag)
git push                 # open + merge the PR as usual

# 2. After the PR merges:
git checkout main && git pull
git tag v1.0.0 && git push origin v1.0.0   # this push publishes
```

The tag itself is safe to create by hand — the publish workflow refuses to run
unless the tag exactly matches the version committed in all three packages, so
a typo'd or premature tag fails fast instead of publishing the wrong thing.

The tag push runs `.github/workflows/release.yml`, which:

1. verifies the tag matches every package version (releases cut any other way
   fail fast),
2. type-checks and runs the test suite,
3. builds the three packages (`backstage-cli package build` via each
   workspace's `build` script),
4. publishes them to npm in dependency order (`common` → `backend` →
   `frontend`) with `--tolerate-republish`, so a failed run can be re-run
   safely,
5. creates a GitHub release with auto-generated notes.

## One-time setup

- **`NPM_TOKEN` repository secret** — an npm automation token with publish
  rights to the `@massdriver-cloud` scope (npmjs.com → Access Tokens →
  Granular/Automation). Set it under GitHub → Settings → Secrets and
  variables → Actions.

## Versioning guidance

Semver from the consumer's perspective:

- **patch** — fixes, styling parity, internal refactors
- **minor** — new surfaces/exports (new pages, `MassdriverSidebarItem`-style
  additions), new optional config
- **major** — breaking config or export changes, raising the minimum
  Backstage version

Pre-releases work too (`yarn release 0.3.0-rc.1`); npm will tag them `latest`
unless you add `--tag next` handling, so prefer plain versions until that's
needed.
