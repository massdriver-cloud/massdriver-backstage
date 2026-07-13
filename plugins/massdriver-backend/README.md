# @massdriver-cloud/backstage-plugin-massdriver-backend

Backend relay for the
[Massdriver Backstage plugin](https://www.npmjs.com/package/@massdriver-cloud/backstage-plugin-massdriver).
It is the only component that holds Massdriver credentials:

- **`POST /api/massdriver/graphql`** — forwards read-only GraphQL queries to
  the Massdriver v2 API, injecting the service-account token and your
  `organizationId` server-side. The browser never sees the token, and
  client-supplied organization IDs never win over the configured one.
- **`POST /api/massdriver/subscribe`** — bridges Massdriver's realtime
  (Phoenix/Absinthe WebSocket) events to the browser as Server-Sent Events, so
  the frontend stays live without holding credentials.

There are **no mutation endpoints** — the integration is read-only by design.

## Installation

```bash
# From your Backstage repo root
yarn --cwd packages/backend add @massdriver-cloud/backstage-plugin-massdriver-backend
```

Then add it in `packages/backend/src/index.ts`:

```ts
backend.add(import('@massdriver-cloud/backstage-plugin-massdriver-backend'));
```

## Configuration

Reads the `massdriver` block from your app config — see the
[frontend plugin README](https://www.npmjs.com/package/@massdriver-cloud/backstage-plugin-massdriver)
for the full reference, including where to find your organization ID and how
to mint a service-account token. Minimal setup:

```yaml
# app-config.yaml
massdriver:
  organizationId: ${MASSDRIVER_ORG_ID}
  apiToken: ${MASSDRIVER_API_TOKEN} # secret — backend only
```

## Deployment note

The backend needs outbound HTTPS **and WebSocket (WSS)** access to your
Massdriver API origin (`https://api.massdriver.cloud` by default, or your
`massdriver.baseUrl` if self-hosted) — WebSockets power the realtime bridge.
