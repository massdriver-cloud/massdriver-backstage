# Massdriver Backstage Plugin — Conventions

Yarn 4 workspace (NOT pnpm), Backstage new frontend system, TypeScript, Jest via `@backstage/cli`. Dev setup and commands: [CONTRIBUTING.md](CONTRIBUTING.md).

**Mission:** a **read-only mirror** of the Massdriver web app, from the projects list down through the environment graph and instance drawer. **Every mutation entry point is either a `DisabledAction` (tooltip pointing at Massdriver) or a deep-link into the Massdriver app** — never a live mutation. Keep ported surfaces faithful to the web app's behavior; divergences must be justified by the plugin's architecture, not taste.

## Layout

```
packages/app|backend/        ← Local dev hosts (stock Backstage scaffold)
plugins/massdriver/          ← Frontend plugin — all product UI (features/, components/, hooks/, shell/, theme/, utils/)
plugins/massdriver-backend/  ← Backend relay: GraphQL proxy + SSE subscription relay
plugins/massdriver-common/   ← Shared: config, urls/ids, deep-link builders (workspace:^)
```

Feature folders colocate `queries.ts`, components, helpers, and an `index.ts` barrel. Promotion ladder: single feature → `features/<name>/`, cross-feature → `components/`/`hooks/`/`utils/`, cross-plugin → `massdriver-common`. Never duplicate a url/id helper in a plugin — it goes in `massdriver-common/src/urls.ts`.

## Golden rules

1. **Read-only, always.** No mutation documents anywhere in the frontend or relay. New action affordances render `DisabledAction` or deep-link out via the builders in `massdriver-common/src/urls.ts`. The relay must never expose a mutation endpoint.
2. **The browser never holds a Massdriver token.** All API access goes `useApi(massdriverApiRef)` → `plugin://massdriver/{graphql,subscribe}` → backend relay, which injects the service-account token and `organizationId` server-side. Never read `massdriver.apiToken` outside `plugins/massdriver-backend`; never add token-bearing config with `@visibility frontend`.
3. **Declare `$organizationId`, never pass it.** Every GQL document declares `$organizationId: ID!`; callers omit it — the relay injects it. Client-supplied `organizationId` must never win over the server's.
4. **Reads under `RealtimeProvider` use `useLiveRelayQuery`** (or `useInstanceApiQuery`, its drawer wrapper) — never a hand-rolled `useAsync` with the revision in its deps. A revision bump keeps the previous result rendered and swaps atomically; an identity change resets to a fresh loading state. Elsewhere: `useAsync(async () => (await api.query(QUERY, vars)) as T, [deps])`. List pages use `usePaginatedRelayQuery` + `useCursorPagination`.
5. **Individual `@massdriver/ui` imports** (`import Box from '@massdriver/ui/Box'`). No `@mui/material` imports anywhere except the sanctioned `theme/` modules. MUI v5 renders only inside `MassdriverThemeScope`; no MUI `Drawer`/`Modal`/`Slide`-based components — overlays are absolutely-positioned `Box` panels (see `InstanceDrawer`).
6. **Every new module gets a colocated test** (`Foo.test.ts(x)` next to `Foo.ts(x)`). Pure helpers and protocol parsers especially.
7. **Raw GQL template strings, validated against the v2 schema** (`https://api.massdriver.cloud/graphql/v2/schema.graphql`). No Apollo, no codegen. Operation names are prefixed `Massdriver*`. Bound every connection selection with `cursor: { limit: … }` or real pagination — unbounded queries silently truncate.
8. **TypeScript honesty.** `@massdriver/ui` / `@massdriver/forms` are ambient `any` (declared in `massdriver-ui.d.ts` — the one sanctioned `any` boundary). API result shapes live in feature `types.ts` files and use `(await api.query(q, v)) as T` — never `api.query<T>()`.
9. **Never swallow query errors.** Every fetch surfaces `error` somewhere visible (inline `Alert` or an honest fallback label). A null entity field renders `NotFound` — the relay's client returns partial `data` on field-level errors so a null field can be a 404 instead of a 500.

House style: no single-letter variable names (loop `i`/`j` OK), prefer ternary over `if`, prefer `const`, no data mutation (always spread/copy), `stylin` declarations below the component, one React component per file.

**No code comments.** Write code that reads without them — better names, smaller functions, extracted constants. Functional annotations (`@visibility` in `config.d.ts`, `eslint-disable`, `@ts-expect-error`, `/** @public */`) are not comments and stay. A prose comment is a last resort reserved for genuinely obscure constraints the code cannot express (external protocol quirks, upstream bugs), and adding one requires explicit approval from Joe first.

## Realtime

Backend SSE relay (`POST /subscribe`) speaks Phoenix v2/Absinthe over `ws` server-side. Frontend: `useMassdriverSubscription` (backoff-reconnect SSE consumer) → `RealtimeProvider` debounces events into a `revision` counter → `useLiveRelayQuery` refetches. There is no normalized cache; "refetch on event" is how views stay live.

## Critical pitfalls

- **`yarn lint` diffs against `origin/master`, which doesn't exist** — use `yarn lint:all`.
- **Don't import from `@backstage/core-plugin-api`** — this app uses the _new_ frontend system (`@backstage/frontend-plugin-api`).
- **Never hardcode `.Mui*` slot selectors** — Backstage prefixes all MUI v5 slot classes (`v5-MuiSwitch-thumb`), so string selectors silently never match. Build them from `theme/muiClasses.ts` constants; state classes (`.Mui-checked`, …) stay literal.
- **Never let the plugin's root entry (or the host app's eager code) reach `@mui/material`** — Backstage `require()`s the package root at boot, before it configures the `v5-` class prefix; an eager path to the `@mui/material` barrel freezes all slot names unprefixed and breaks cross-slot styling plugin-wide. Package-root component exports that use `@massdriver/ui` must be lazy (see `ProjectsListPageLazy`); `src/index.test.ts` guards this.
- **`useAsync` deps are manual** — every variable the fetch closure reads must appear in the dep array. Serialize object deps (`JSON.stringify`) or destructure primitives.
- **Composite IDs have hyphen-free segments** (`{projectId}-{scopedEnvironmentId}-{scopedComponentId}`) — `split('-')` in `urls.ts` relies on this; never generate IDs with hyphens inside a segment.
- **Deep links must match the Massdriver app's real routes.** When adding a builder to `urls.ts`, verify against the live app and test it.
- **`.env` is not auto-loaded** — `set -a && source .env` before `yarn start`. Massdriver config lives in `app-config.local.yaml` (gitignored).

## Key files

```
plugins/massdriver/src/plugin.tsx                     ← Frontend plugin entry (blueprints)
plugins/massdriver/src/api.ts                         ← MassdriverApi: query + SSE subscribe
plugins/massdriver/src/MassdriverRouter.tsx           ← Route table
plugins/massdriver/src/theme/MassdriverThemeScope.tsx ← MUI v5 island (theme/ holds the only @mui/material imports; mode follows Backstage's active theme via useThemeMode)
plugins/massdriver/src/features/environment/realtime/ ← RealtimeProvider + useMassdriverSubscription
plugins/massdriver-backend/src/router.ts              ← Relay: POST /graphql + POST /subscribe (SSE)
plugins/massdriver-backend/src/absinthe.ts            ← Headless Phoenix v2/Absinthe WS client
plugins/massdriver-common/src/urls.ts                 ← IDs, origins, deep-link builders
plugins/massdriver-common/src/client.ts               ← Server-side GraphQL client (token + orgId injection)
plugins/massdriver/config.d.ts                        ← Frontend config schema (organizationId, appUrl)
plugins/massdriver-backend/config.d.ts                ← Backend config schema (apiToken @visibility secret, baseUrl)
```
