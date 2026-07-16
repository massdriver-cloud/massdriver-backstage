# Contributing

Thanks for your interest in improving the Massdriver Backstage plugin! This
document covers developing in this repository. For installing the plugin in
your own Backstage app, see the [plugin README](plugins/massdriver/README.md).

## Prerequisites

- **Node 22 or 24** (see `engines` in `package.json`)
- **Yarn 4** via corepack — run `corepack enable` once; the exact version is
  pinned by `packageManager`. This is a Yarn workspace, **not pnpm**.

## Getting started

```bash
yarn install
```

Create `app-config.local.yaml` at the repo root (gitignored — secrets never
land in committed config) with your Massdriver credentials:

```yaml
massdriver:
  organizationId: <your-org-id>
  apiToken: <service-account-token>
  # Only for self-hosted Massdriver:
  # baseUrl: https://api.massdriver.cloud
  # appUrl: https://app.massdriver.cloud
```

See ["Getting the values"](plugins/massdriver/README.md#getting-the-values)
in the plugin README for where the org ID and service-account token come
from. Then:

```bash
yarn start
```

This runs the frontend (http://localhost:3000) and backend
(http://localhost:7007) together. The Massdriver UI lives at
`/massdriver/projects`.

If you use a `.env` file instead of literal values, note it is **not
auto-loaded** — `set -a && source .env` before `yarn start`.

## Everyday commands

| Command                                                                        | What it does                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------- |
| `yarn start`                                                                   | Run the dev host (frontend + backend)          |
| `yarn test`                                                                    | Jest in watch mode, changed packages           |
| `CI=true yarn test`                                                            | One-shot test run (what you usually want)      |
| `yarn test:all`                                                                | Full suite with coverage (what CI runs)        |
| `yarn workspace @massdriver/backstage-plugin test`                             | Tests for a single workspace                   |
| `yarn tsc`                                                                     | Type-check the repo                            |
| `yarn lint:all`                                                                | Lint everything — use this, not `yarn lint`¹   |
| `yarn prettier:check`                                                          | Formatting check (`prettier --write .` to fix) |
| `yarn test:e2e`                                                                | Playwright e2e tests                           |
| `yarn workspaces foreach -A --topological --include '@massdriver/*' run build` | Build the publishable packages like CI does    |

¹ `yarn lint` diffs against `origin/master`, which doesn't exist here (the
default branch is `main`).

## Repository layout

```
packages/app/                ← Backstage frontend host (stock scaffold + Massdriver nav)
packages/backend/            ← Backstage backend host (mounts massdriver-backend)
plugins/massdriver/          ← Frontend plugin — all product UI
plugins/massdriver-backend/  ← Backend relay: GraphQL proxy + SSE subscription relay
plugins/massdriver-common/   ← Shared lib, consumed by both plugins via workspace:^
examples/                    ← Stock Backstage catalog seed data (not Massdriver)
scripts/release.mjs          ← Lockstep version-bump script (see RELEASING.md)
```

The three `@massdriver/*` packages are what ships to npm; the `packages/*`
apps exist only to run the plugin locally.

## Architecture & conventions

[`CLAUDE.md`](CLAUDE.md) is the architecture reference for this repo — read
it before making changes. The headlines:

- **Read-only, always.** No mutation documents anywhere; action affordances
  are disabled with a tooltip or deep-link into the Massdriver app.
- **The browser never holds a Massdriver token.** All API access goes through
  the backend relay, which injects the service-account token and
  `organizationId` server-side.
- **Mirror the Massdriver web app.** Ported surfaces stay faithful to the
  app's behavior; parity beats local invention.
- **New frontend system only** — import from
  `@backstage/frontend-plugin-api`, never `@backstage/core-plugin-api`.
- **Every new module gets a colocated test.**

## Submitting changes

- Open a pull request against `main`.
- Keep PRs focused; include tests for new functionality and regression tests
  for bug fixes.
- Make sure CI passes locally first (see below).

## CI

Every PR and every merge to `main` runs `.github/workflows/ci.yaml`:
type-check, lint, prettier, full test suite with coverage, and a build of the
three publishable packages (so packaging breakage fails in CI, not during a
release). Match it locally with:

```bash
yarn tsc && yarn lint:all && yarn prettier:check && yarn test:all
```

## Releasing

The three `@massdriver/*` packages are versioned in lockstep and published to
npm by a tag push. Short version:

```bash
yarn release 1.2.3        # on a branch: bumps all three packages + commits
# open + merge the PR, then:
git checkout main && git pull
git tag v1.2.3 && git push origin v1.2.3   # this publishes
```

See [`RELEASING.md`](RELEASING.md) for the full process, semver guidance, and
the one-time `NPM_TOKEN` setup.
