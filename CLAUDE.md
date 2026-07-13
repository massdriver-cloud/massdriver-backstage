# Massdriver Backstage Plugin — Architecture Reference

Yarn 4 workspace (NOT pnpm), Backstage new frontend system, TypeScript, Jest via `@backstage/cli`.

**Mission:** a **read-only mirror** of the Massdriver web app, from the projects list down through the environment graph and instance drawer. Everything read-only is ported in-app; **every mutation entry point is either a `DisabledAction` (tooltip pointing at Massdriver) or a deep-link into the web app** — never a live mutation.

**Source of truth:** the web app at `~/Massdriver/massdriver-ui` (sister directory). When porting or changing a mirrored surface, read the web-app original first and cite it in a comment (`// Ported from apps/web/...`). Faithful parity beats local invention.

---

## Workspace Layout

```
packages/app/           ← Backstage frontend host (stock scaffold + Massdriver nav)
packages/backend/       ← Backstage backend host (mounts massdriver-backend)
plugins/massdriver/     ← Frontend plugin — all product UI lives here
plugins/massdriver-backend/  ← Backend relay: GraphQL proxy + SSE subscription relay
plugins/massdriver-common/   ← Shared lib: config, urls/ids, deep-link builders, API client
examples/               ← Stock Backstage catalog seed data (not Massdriver)
```

Common is consumed by both other plugins via `workspace:^`. Never duplicate a url/id helper in a plugin — it goes in `massdriver-common/src/urls.ts`.

### Frontend plugin structure (`plugins/massdriver/src`)

```
plugin.tsx              ← Blueprints: ApiBlueprint, PageBlueprint (/massdriver), entity card/content
MassdriverRouter.tsx    ← react-router route table (projects → project → environment graph → instance)
api.ts                  ← MassdriverApi (query + subscribe via backend relay)
routes.ts / internalRoutes.ts  ← route refs + in-plugin path builders
features/               ← Domain features (mirrors the web app's features/)
  projects/             ← Projects list page
  project/              ← Project details + tabs/
  environment/          ← Graph page: graph/, GraphHeader/, InstanceDrawer/ (+ tabs/),
                          CompareEnvironmentsDialog/, CompareDeploymentsDialog/, realtime/
components/             ← Cross-feature reusable UI (DisabledAction, OpenInMassdriverButton, pills…)
hooks/                  ← Cross-feature hooks (useCursorPagination, usePaginatedRelayQuery)
shell/                  ← MassdriverShell (theme scope + header + scroll container)
theme/                  ← ThemeModeContext + MassdriverThemeScope (MUI v5 island)
utils/                  ← Pure helpers (attributes, formatRelativeTime)
```

Feature folders colocate `queries.ts` (raw GQL strings), components, helpers, and an `index.ts` barrel at the feature boundary. Same promotion ladder as the web app: single feature → `features/<name>/`, cross-feature → `components/`/`hooks/`/`utils/`, cross-plugin → `massdriver-common`.

---

## Golden Rules

1. **Read-only, always.** No mutation documents anywhere in the frontend or relay. New action affordances render `DisabledAction` or deep-link out via the builders in `massdriver-common/src/urls.ts` (`instanceTabUrl`, `instanceActionUrl`, …). The relay must never expose a mutation endpoint.
2. **The browser never holds a Massdriver token.** All API access goes `useApi(massdriverApiRef)` → `plugin://massdriver/{graphql,subscribe}` → backend relay, which injects the service-account token and `organizationId` server-side. Never read `massdriver.apiToken` outside `plugins/massdriver-backend`; never add token-bearing config with `@visibility frontend`.
3. **Declare `$organizationId`, never pass it.** Every GQL document declares `$organizationId: ID!`; callers omit it — the relay injects it. Client-supplied `organizationId` must never win over the server's.
4. **Mirror the web app.** Port logic faithfully, keep helper names aligned (`composeLogsText` ↔ `composeText`), and reference the source file. Divergences must be justified by the plugin's architecture (no Apollo cache, no snackbar, Backstage hybrid runtime) — not taste.
5. **Reads under `RealtimeProvider` use `useLiveRelayQuery`** (or `useInstanceApiQuery`, its drawer wrapper) — never a hand-rolled `useAsync` with the revision in its deps. The hook implements the no-flash contract: a revision bump keeps the previous result rendered and swaps atomically; an identity change (different entity/variables) resets to a fresh loading state. Its `loading` is safe to gate on directly.
6. **Individual `@massdriver/ui` imports** (`import Box from '@massdriver/ui/Box'`). No `@mui/material` imports anywhere except the sanctioned `theme/` modules (`MassdriverThemeScope.tsx`, `muiClasses.ts`, `muiClassNameAudit.ts`). Monochrome UI-chrome icons render bare; colored/brand icons use `IconTile`.
7. **MUI v5 renders only inside `MassdriverThemeScope`.** Don't use MUI `Drawer`/`Modal`/`Slide`-based components — historically unreliable in the hybrid v4+v5 runtime (root cause likely fixed by `@massdriver/ui` 1.0.1; ban stays until visually re-verified). Overlays are absolutely-positioned `Box` panels (see `InstanceDrawer`, `DeploymentLogsPanel`).
8. **Every new module gets a colocated test** (`Foo.test.ts(x)` next to `Foo.ts(x)`). Pure helpers and protocol parsers especially — they're the cheapest, highest-value coverage. See `.claude/rules/testing.md`.
9. **Raw GQL template strings, validated against the v2 schema.** No Apollo, no codegen. Operation names are prefixed `Massdriver*`. Check new documents against `https://api.massdriver.cloud/graphql/v2/schema.graphql`.
10. **TypeScript honesty.** `@massdriver/ui` / `@massdriver/forms` are ambient `any` (they ship no types — the one sanctioned `any` boundary, declared in `massdriver-ui.d.ts`). Everything else is typed; API result shapes live in feature `types.ts` files and use `(await api.query(q, v)) as T` — never `api.query<T>()` (TS7022 with the ambient modules).

Carried over from the web app: no single-letter variable names (loop `i`/`j` OK), prefer ternary over `if`, prefer `const`, no data mutation (always spread/copy), minimal comments, `stylin` declarations below the component, one React component per file.

---

## Data Layer (no Apollo)

- **Queries:** under `RealtimeProvider` (graph page, drawer, header) → `useLiveRelayQuery(QUERY, variables | null)`; elsewhere → `useAsync(async () => (await api.query(QUERY, vars)) as T, [deps])`. Colocated `queries.ts` per feature. Errors render inline `Alert`s; a null entity field renders `NotFound` (the relay's client returns partial `data` on field-level errors precisely so a null field can be a 404 instead of a 500). Bound every connection selection with `cursor: { limit: … }` or real pagination — an unbounded query silently truncates at the server's default page size.
- **Pagination:** `usePaginatedRelayQuery` + `useCursorPagination` bridge DataList's page model onto cursor pagination — always use them for list pages; don't hand-roll.
- **Realtime:** backend SSE relay (`POST /subscribe`) speaks raw Phoenix v2/Absinthe over `ws` server-side. Frontend: `useMassdriverSubscription` (backoff-reconnect SSE consumer) → `RealtimeProvider` debounces events into a `revision` counter → data hooks include `revision` in `useAsync` deps to refetch. There is no normalized cache; "refetch on event" is how views stay live. Full contract in `.claude/rules/realtime.md`.

---

## Critical Pitfalls

- **This repo uses Yarn 4** (`yarn install`, `yarn test`), not pnpm. Run single-package tests with `yarn workspace @massdriver/backstage-plugin test`. CI-style one-shot: `CI=true yarn test`.
- **`backstage-cli repo lint --since origin/master`** — the default branch is `main`; use `yarn lint:all` locally.
- **No hand-rolled `useAsync` + revision** — reads under `RealtimeProvider` go through `useLiveRelayQuery` (Golden Rule 5).
- **Never swallow query errors.** Every fetch surfaces `error` somewhere visible (`TabState`, inline `Alert`, or an honest fallback label) — a failed query must not render as an empty state.
- **Don't import from `@backstage/core-plugin-api`** — this app uses the _new_ frontend system (`@backstage/frontend-plugin-api`).
- **Never hardcode `.Mui*` slot selectors** — Backstage prefixes all MUI v5 slot classes (`v5-MuiSwitch-thumb`), so string selectors silently never match. Build them from `theme/muiClasses.ts` constants; state classes (`.Mui-checked`, …) stay literal. Details in `.claude/rules/styling-and-theme.md`.
- **Never let the plugin's root entry (or the host app's eager code) reach `@mui/material`** — Backstage `require()`s the package root at boot, before it configures the `v5-` class prefix; an eager path to the `@mui/material` barrel freezes all slot names unprefixed and breaks cross-slot styling plugin-wide. Package-root component exports that use `@massdriver/ui` must be lazy (see `ProjectsListPageLazy`); `src/index.test.ts` guards this.
- **`useAsync` deps are manual** — every variable the fetch closure reads must appear in the dep array (the exhaustive-deps lint can't see through `useAsync`). Serialize object deps (`JSON.stringify`) or destructure primitives.
- **Composite IDs have hyphen-free segments** (`{projectId}-{scopedEnvironmentId}-{scopedComponentId}`) — `split('-')` in `urls.ts` relies on this invariant; never generate IDs with hyphens inside a segment.
- **Deep links must match the web app's real routes** (`apps/web/shared/routes/routes.js`). When adding a builder to `urls.ts`, verify against the web app's route table, and test it.
- **`.env` is not auto-loaded** — `set -a && source .env` before `yarn start`, or export the vars. Massdriver config lives in `app-config.local.yaml` (gitignored).

---

## Key Files

```
plugins/massdriver/src/plugin.tsx                    ← Frontend plugin entry (blueprints)
plugins/massdriver/src/api.ts                        ← MassdriverApi: query + SSE subscribe
plugins/massdriver/src/MassdriverRouter.tsx          ← Route table
plugins/massdriver/src/theme/MassdriverThemeScope.tsx← MUI v5 island (only @mui/material import)
plugins/massdriver/src/features/environment/realtime/← RealtimeProvider + useMassdriverSubscription
plugins/massdriver-backend/src/router.ts             ← Relay: POST /graphql + POST /subscribe (SSE)
plugins/massdriver-backend/src/absinthe.ts           ← Headless Phoenix v2/Absinthe WS client
plugins/massdriver-common/src/urls.ts                ← IDs, origins, deep-link builders
plugins/massdriver-common/src/client.ts              ← Server-side GraphQL client (token + orgId injection)
plugins/massdriver-common/src/config.ts              ← Config readers (public vs backend-only)
plugins/massdriver-common/config.d.ts                ← Config schema + visibility
app-config.yaml                                      ← Host app config (massdriver block documented)
```

---

## Detailed Rule References

- **Testing conventions** → `.claude/rules/testing.md`
- **Realtime: SSE relay, Absinthe protocol, revision refetch** → `.claude/rules/realtime.md`
- **GraphQL documents & the relay data layer** → `.claude/rules/graphql-relay.md`
- **Styling, theme scope, MUI v4/v5 coexistence** → `.claude/rules/styling-and-theme.md`
- **Read-only parity: mutation boundaries & deep links** → `.claude/rules/read-only-parity.md`
