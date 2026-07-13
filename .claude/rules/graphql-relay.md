---
paths:
  - '**/queries.ts'
  - 'plugins/massdriver/src/api.ts'
  - 'plugins/massdriver/src/hooks/**'
  - 'plugins/massdriver/src/useInstances.ts'
  - 'plugins/massdriver-common/src/client.ts'
  - 'plugins/massdriver-backend/src/router.ts'
---

# GraphQL Documents & the Relay Data Layer

No Apollo, no codegen. Raw template-string documents, executed through the backend relay via `massdriverApiRef`.

## Documents

- Shared documents live in a colocated `queries.ts` per feature module (subscriptions in `realtime/queries.ts`); a document with a single consumer may live module-scope in that component/hook file — mirroring the web app, where documents live in their hook files.
- Operation names are prefixed `Massdriver` (`MassdriverInstancePanel`, `MassdriverEnvironmentEvents`) so they're identifiable in API logs.
- **Declare `$organizationId: ID!`, never pass it** — the relay injects it server-side (both `/graphql` via `client.ts` and `/subscribe` via `router.ts`). The server-injected value must always win over request variables.
- Match argument types to the schema exactly (`deployment(id:)` takes `UUID!`, most others `ID!`). Validate new documents against `https://api.massdriver.cloud/graphql/v2/schema.graphql` — there is no build-time validation to catch drift.
- Select `id` on every normalizable object. There's no normalized cache today, but the documents mirror the web app's (where missing `id` breaks Apollo), and parity keeps future consolidation possible.
- Read-only repo: **query and subscription documents only — a `mutation` document anywhere is a defect.**

## Executing Queries

```ts
// Under RealtimeProvider (graph page, drawer, graph header):
const { value, loading, error } = useLiveRelayQuery<InstancePanelResult>(
  QUERY,
  id ? { id } : null,
);

// Outside the environment graph (project pages, one-shot dialog fetches):
const api = useApi(massdriverApiRef);
const { value, loading, error } = useAsync(async () => {
  if (!id) return null;
  return (await api.query(QUERY, { id })) as InstancePanelResult;
}, [api, id]);
```

- **Cast form is load-bearing:** `(await api.query(q, v)) as T`, never `api.query<T>(…)` — the generic form trips TS7022 through the ambient `@massdriver/ui` modules.
- **Reads under `RealtimeProvider` use `useLiveRelayQuery`** (or `useInstanceApiQuery` for drawer tabs) — never `useAsync` with the revision in its deps. The hook enforces the no-flash/identity-reset contract; see `.claude/rules/realtime.md`.
- **`useAsync` deps are manual.** The exhaustive-deps lint can't see through `useAsync` — every value the closure reads must be listed. Serialize object deps (`JSON.stringify(filter ?? null)`), destructure primitives (`sort?.field`, `sort?.order`).
- **Never swallow `error`** (or `loading`). Every fetch surfaces failures visibly — `TabState` in drawer tabs, an inline `Alert`, or an honest fallback label. A failed query must not render as an empty state ("No environment defaults" when the fetch actually failed).
- **Bound every connection selection** — `cursor: { limit: … }` or real pagination on anything returning a `*Page`. An unbounded query silently truncates at the server's default page size, and `.find()` over a truncated page reports an existing entity as missing (the GraphHeader switcher bug).

## Error & 404 Semantics

`massdriver-common/src/client.ts` returns partial `data` even when the response carries field-level errors. This is deliberate: a `NOT_FOUND` on a nullable root field (`environment(id:)`) comes back as `data.environment === null`, so callers render `NotFound` from the null field instead of surfacing a 500.

- Entity-not-found → check the null field, render `<NotFound title=… message=… />`.
- Transport/total failure → `error` from `useAsync`, render an inline `<Alert severity="error">`.
- Only a response with no `data` at all throws `MassdriverApiError`.

## Pagination

Always use the shared hooks for list pages — never hand-roll cursor state:

- **`usePaginatedRelayQuery(query, { responseKey, sortFieldMap, defaultSort, pageSize, filterFromSearch, baseFilter })`** — server-side cursor pagination for DataList. Returns `{ items, loading, error, hasMore, dataListParams }`; spread `dataListParams` onto the DataList. Mirrors the web app's `usePaginatedQuery` minus URL persistence.
- **`useCursorPagination`** — the page-index ↔ cursor bridge underneath. Cursor map resets when sort or pageSize change; page state must reset to 0 whenever `search` changes (a cursor from one filter set is invalid in another).

The relay page shape is `{ items, cursor { next } }`; `hasMore` is `!!cursor.next`.

## The Relay (backend)

- `POST /graphql` and `POST /subscribe` both require an authenticated Backstage user (`httpAuth.credentials(req, { allow: ['user'] })`), then act with the org's **service-account token** (org-wide read). That asymmetry is the trust model — documented in the plugin README; don't weaken either half.
- The relay is a thin proxy: validate input, inject `organizationId` + token, forward. Business logic belongs in the frontend or the API, not the relay.
- Config: `readMassdriverConfig` (token-bearing) is backend-only; `readMassdriverPublicConfig` is the frontend-safe subset. New config keys need `config.d.ts` entries with explicit `@visibility` — secrets are `@visibility secret`, everything the browser needs is `@visibility frontend`.
- Lazy init is intentional: the backend must boot when the plugin is installed but unconfigured; misconfiguration surfaces as a request-time error, not a startup crash.
