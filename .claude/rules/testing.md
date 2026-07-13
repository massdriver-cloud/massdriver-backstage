---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/setupTests.ts'
  - 'playwright.config.ts'
---

# Testing Conventions

## Running Tests

Jest is fully delegated to `@backstage/cli` (no standalone `jest.config.js`). The preset auto-discovers each package's `src/setupTests.ts`, transforms TS/TSX, and uses jsdom for frontend packages.

```bash
CI=true yarn test                 # one-shot run, all packages (watch mode without CI=true)
yarn test:all                     # with coverage
yarn workspace @massdriver/backstage-plugin test            # frontend plugin only
yarn workspace @massdriver/backstage-plugin-backend test    # backend only
yarn workspace @massdriver/backstage-plugin-common test     # common only
yarn test:e2e                     # Playwright (needs a running app)
```

## Test Location & Priorities

- Colocate: `Foo.test.ts(x)` next to `Foo.ts(x)`. **No `__tests__/` folders.**
- **Every new module gets a test.** Priorities, highest value first:
  1. **Pure functions** — url/id builders, GQL-shape flatteners, formatters, status helpers, protocol parsers.
  2. **Hooks** — `renderHook` from `@testing-library/react`, with `TestApiProvider` supplying a fake `massdriverApiRef`.
  3. **Protocol/transport code** — the Absinthe client against a scripted `ws` server; the SSE parser against synthetic streams; the relay router via `supertest`.
  4. **Components** — user-visible behavior with RTL. Smoke-level for big composed pages; behavioral for leaf components (pills, badges, DisabledAction).
- Prefer behavioral assertions over snapshots. No snapshot tests on composed views.

## Frontend Plugin Patterns

### Mocking the Massdriver API (the standard seam)

Everything data-driven goes through `massdriverApiRef`, so a fake API is the one mock most tests need:

```tsx
import {
  TestApiProvider,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../api';

const mockApi: jest.Mocked<MassdriverApi> = {
  appUrl: 'https://app.massdriver.cloud',
  organizationId: 'org-1',
  query: jest.fn(),
  subscribe: jest.fn().mockResolvedValue(undefined),
};

mockApi.query.mockResolvedValue({
  instance: { id: 'proj-env-cache', status: 'RUNNING' },
});

await renderInTestApp(
  <TestApiProvider apis={[[massdriverApiRef, mockApi]]}>
    <ComponentUnderTest />
  </TestApiProvider>,
);
```

Use `@backstage/frontend-test-utils` (new frontend system), **not** `@backstage/test-utils` (legacy). `renderInTestApp` provides the router/app context that `useRouteRef`/`useNavigate` need; plain RTL `render` is fine for components that don't touch routing or `useApi`.

### Hooks

```tsx
import { renderHook, waitFor, act } from '@testing-library/react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestApiProvider apis={[[massdriverApiRef, mockApi]]}>
    {children}
  </TestApiProvider>
);

const { result } = renderHook(() => usePaginatedRelayQuery(QUERY, options), {
  wrapper,
});
await waitFor(() => expect(result.current.loading).toBe(false));
```

For subscription hooks, capture the handlers the hook passes to `api.subscribe` and drive them manually (`handlers.onData(...)`) — don't try to fake SSE streams at the fetch layer in hook tests.

### Timers

Debounce/backoff logic (RealtimeProvider's coalescing, `useMassdriverSubscription` reconnect) uses `jest.useFakeTimers()` + `act(() => jest.advanceTimersByTime(ms))`. Always `jest.useRealTimers()` in `afterEach`.

## Backend Patterns

### Router (`supertest` + `mockServices`)

```ts
import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';

const app = express();
app.use(
  await createRouter({
    config: mockServices.rootConfig({
      data: { massdriver: { organizationId: 'org-1', apiToken: 'tok' } },
    }),
    logger: mockServices.logger.mock(),
    httpAuth: mockServices.httpAuth(),
  }),
);
const response = await request(app)
  .post('/graphql')
  .send({ query: '{ me { id } }' });
```

Mock the upstream at the module boundary (`jest.mock` on `massdriver-common`'s `createMassdriverClient`, or on `./absinthe` for the SSE route) — never hit the real API. For the SSE route, assert on the streamed body chunks and that `close()` is called on client disconnect.

### Absinthe client (scripted WebSocket server)

Test `openAbsintheSubscription` against a real local `ws.WebSocketServer` on an ephemeral port that scripts the Phoenix handshake (reply to `phx_join`, reply to `doc` with a `subscriptionId`, emit `subscription:data` frames). This is the only faithful way to test join/doc/data correlation, error replies, and teardown.

## MSW

`msw ^1` is available in the frontend plugin for fetch-level integration tests. Prefer the `massdriverApiRef` fake for component/hook tests — MSW is only worth it when the code under test is the fetch/SSE parsing itself (`MassdriverClientApi`).

## What NOT to Test

- Stock Backstage scaffold (`packages/app`, `packages/backend`) beyond the existing smoke test.
- `@massdriver/ui` internals — they're tested in the massdriver-ui repo. Test this repo's usage, not the design system.
- Pixel styling. Assert on roles, text, aria attributes, and links (`toHaveAttribute('href', …)`) — deep-link correctness is a first-class behavior here.
