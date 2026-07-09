---
paths:
  - 'plugins/massdriver/src/features/environment/realtime/**'
  - 'plugins/massdriver/src/api.ts'
  - 'plugins/massdriver-backend/src/absinthe*'
  - 'plugins/massdriver-backend/src/router.ts'
---

# Realtime: SSE Relay, Absinthe Protocol, Revision Refetch

The browser holds no Massdriver token, so it cannot open the web app's Absinthe/Phoenix WebSocket. Live updates flow through a backend relay instead:

```
browser ── POST plugin://massdriver/subscribe (SSE) ──▶ massdriver-backend
                                                             │  service-account token
                                                             ▼
                                             Massdriver Absinthe WS (Phoenix v2)
```

| Piece             | File                                                 | Role                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Absinthe client   | `massdriver-backend/src/absinthe.ts`                 | Headless Phoenix v2 channel client over `ws`: join `__absinthe__:control`, push `doc`, forward `subscription:data`, 30s heartbeat. One socket per subscription.         |
| SSE route         | `massdriver-backend/src/router.ts` `POST /subscribe` | Auths the Backstage user, injects `organizationId`, streams results as SSE `data:` frames, 25s `: ping` keepalive, tears down the upstream socket on client disconnect. |
| SSE consumer      | `massdriver/src/api.ts` `subscribe()`                | fetch + ReadableStream SSE parser (`\n\n` frames, `event: error` → onError). Resolves when the stream ends.                                                             |
| Reconnect hook    | `realtime/useMassdriverSubscription.ts`              | Re-subscribes on stream end with exponential backoff (1s → 10s cap; healthy message resets). Callbacks held in refs; aborts on unmount/skip.                            |
| Revision provider | `realtime/RealtimeProvider.tsx`                      | Mounts `environmentEvents` for the environment, coalesces event bursts, exposes a `revision` counter via context.                                                       |
| Live query hook   | `realtime/useLiveRelayQuery.ts`                      | THE way to read data under the provider — revision-aware refetch with the no-flash/identity-reset contract below.                                                       |
| Subscription docs | `realtime/queries.ts`                                | `environmentEvents` (revision trigger) + `deploymentLogs` (live log tail).                                                                                              |

## The Revision Contract — `useLiveRelayQuery`

There is **no Apollo cache** in this plugin — event payloads are not merged anywhere. Views stay live by **refetch-on-event**:

1. `RealtimeProvider` (mounted by `EnvironmentGraphPage`) bumps `revision` when the environment emits any event, coalescing bursts. `DELETED` events are handled implicitly — the refetch drops the entity; nothing inspects `event.action`.
2. Every read under the provider goes through **`useLiveRelayQuery(query, variables | null)`** (`realtime/useLiveRelayQuery.ts`) or `useInstanceApiQuery` (its drawer wrapper). The hook includes the revision internally.
3. The refetch re-renders with fresh data.

**Never hand-roll `useAsync` with the revision in its deps.** The hook exists because the two refetch kinds need different UX, and `useAsync` can't distinguish them:

- **Revision bump** (realtime event): the previous result **stays rendered** and swaps atomically when fresh data lands — no loading flash, no unmounting the diagram/drawer into a spinner. This is the plugin's analogue of the web app's "no skeleton flash on subscription refetch" rule.
- **Identity change** (different query/variables — switching instances, changing a filter): the previous result is **dropped** and `loading` goes true — stale data from another entity must never flash while the next one loads.

Because the hook enforces this split, its `loading` is safe to gate on directly (`TabState`, plain ternaries).

```tsx
// ✅ The standard shape
const { value, loading, error } = useLiveRelayQuery<ResultType>(
  QUERY,
  id ? { id } : null, // null skips
);

// ❌ Hand-rolled — flashes a spinner on every live event
const revision = useRealtimeRevision();
const { value, loading } = useAsync(fetch, [api, id, revision]);
```

## Subscription Documents

- Declare `$organizationId: ID!` but never pass it — the relay injects it (server value must win; never let request variables override it).
- Scope subscriptions as narrowly as the page: the graph mounts `environmentEvents` for one environment; a logs panel mounts `deploymentLogs` for one deployment. Don't add org-wide subscriptions.
- Select only what consumers need. `environmentEvents` payloads are currently _only_ a refetch trigger — keep selections minimal but schema-valid (every normalizable selection includes `id`).
- Validate new documents against the v2 schema (`https://api.massdriver.cloud/graphql/v2/schema.graphql`); the web app's documents under `apps/web/features/**/hooks/subscriptions/` and `apps/web/shared/hooks/useDeploymentLogsSubscription.js` are the reference shapes.

## Adding a Live Surface

1. When the surface lives under the environment graph, just use `useLiveRelayQuery` (or `useInstanceApiQuery` for per-instance drawer data) — liveness comes with it.
2. For a genuinely new subscription (new page scope), add the document to a feature `realtime/queries.ts`, consume it with `useMassdriverSubscription`, and keep `onData` idempotent — after a reconnect the stream may replay or skip events, so treat every message as "something changed", not as a delta to accumulate blindly (the `deploymentLogs` append is the deliberate exception, mirroring the web app).
3. Respect the no-flash rule above in every consumer.

## Absinthe Protocol Notes (backend)

- Phoenix v2 frames are positional tuples `[join_ref, ref, topic, event, payload]`; `vsn=2.0.0` is set in the socket URL. Token goes in the `token` query param — mirroring the web app's socket params — and **never leaves the backend**.
- Handshake: `phx_join` on `__absinthe__:control` → push `doc` `{query, variables}` → reply carries `subscriptionId`, which is the topic that `subscription:data` frames arrive on. Correlate strictly by `ref`/topic.
- Heartbeat every 30s on topic `phoenix`. The SSE route separately writes `: ping` comments every 25s to keep proxies from idling out the downstream connection.
- One subscription per socket, by design — the relay opens one `openAbsintheSubscription` per browser SSE connection, so teardown is symmetric (`req.on('close')` → `subscription.close()` → `phx_leave` + socket close). If you multiplex later, the teardown story must be redesigned first.
- Reconnection lives in the **frontend hook**, not the backend: when the upstream socket dies, the relay ends the SSE stream and the browser re-subscribes with backoff.
- **Fatal vs retryable errors:** a channel-level `phx_reply` rejection (bad token, invalid doc, unknown environment) is marked `fatal: true` and flows through the SSE `error` frame → `MassdriverSubscriptionError.fatal` → `useMassdriverSubscription` stops reconnecting. Relay 4xx responses (except 429) are fatal too. Transport errors stay retryable. Preserve this classification when touching the error path — without it a misconfigured subscription reconnects forever at the backoff cap.
- Heartbeats double as dead-connection detection: a heartbeat interval elapsing with no incoming traffic since the previous one terminates the socket so the reconnect path takes over.

## Anti-patterns

```tsx
// ❌ Opening a WebSocket (or EventSource with a token) from the browser
new WebSocket(`wss://api.massdriver.cloud/api/socket?token=…`);
// The browser must never hold a token. Add capability to the relay instead.

// ❌ Accumulating environmentEvents payloads into local state as a data source
onData: event => setInstances(previous => merge(previous, event.instance));
// There is no cache to keep consistent; refetch-on-revision is the contract.

// ❌ Hand-rolled useAsync with the revision in its deps (see above)

// ❌ Per-view setInterval polling as a substitute for the revision
useAsync(fetch, [pollTick]);
// Mount RealtimeProvider / useMassdriverSubscription instead.
```
