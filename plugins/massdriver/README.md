# Massdriver Backstage plugin

Surface your [Massdriver](https://www.massdriver.cloud/) infrastructure inside
Backstage: projects, environment graphs, instance details, repositories, and
resources — plus a status card and tab for any catalog entity you link to a
Massdriver project, environment, or instance. Everything is read-only and
updates live; actions deep-link into the Massdriver app.

## Packages

| Package                                | Role                                                       |
| -------------------------------------- | ---------------------------------------------------------- |
| `@massdriver/backstage-plugin`         | Frontend: Massdriver pages, entity card, entity tab        |
| `@massdriver/backstage-plugin-backend` | Backend: authenticated GraphQL relay + realtime SSE bridge |
| `@massdriver/backstage-plugin-common`  | Shared types, annotations, deep-link builders              |

## Requirements

- A Backstage app on the **New Frontend System** (`createApp` from
  `@backstage/frontend-defaults`). The plugin is built with frontend-system
  blueprints and does not support the legacy frontend system.
- The Backstage backend must have outbound HTTPS **and WebSocket** access to
  your Massdriver API origin (`https://api.massdriver.cloud` unless
  self-hosted) — WebSockets power the live-update bridge.
- A Massdriver **service account** (instructions below).

## Install

From your Backstage repo root:

```bash
# Frontend
yarn --cwd packages/app add @massdriver/backstage-plugin

# Backend relay
yarn --cwd packages/backend add \
  @massdriver/backstage-plugin-backend
```

Add the backend plugin in `packages/backend/src/index.ts`:

```ts
backend.add(import('@massdriver/backstage-plugin-backend'));
```

The frontend registers itself automatically if your app uses package discovery
(`app: { packages: all }` in `app-config.yaml`). Without discovery, add it as
an explicit feature in `packages/app/src/App.tsx`:

```ts
import massdriverPlugin from '@massdriver/backstage-plugin';

export default createApp({
  features: [
    // ...your other features
    massdriverPlugin,
  ],
});
```

Either way you get the `/massdriver` pages, the entity overview card, and the
"Massdriver" entity tab.

## Configuration

```yaml
# app-config.yaml
massdriver:
  organizationId: ${MASSDRIVER_ORG_ID}
  apiToken: ${MASSDRIVER_API_TOKEN}
  # Optional — only for self-hosted Massdriver installations:
  # baseUrl: ${MASSDRIVER_API_URL} # default: https://api.massdriver.cloud
  # appUrl: ${MASSDRIVER_APP_URL}  # default: https://app.massdriver.cloud
```

| Key                         | Env var (suggested)    | Required | Visibility | Description                                                                                  |
| --------------------------- | ---------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------- |
| `massdriver.organizationId` | `MASSDRIVER_ORG_ID`    | yes      | frontend   | Your Massdriver organization ID.                                                             |
| `massdriver.apiToken`       | `MASSDRIVER_API_TOKEN` | yes      | **secret** | Service-account bearer token used by the backend relay. Never sent to the browser.           |
| `massdriver.baseUrl`        | `MASSDRIVER_API_URL`   | no       | frontend   | Massdriver API origin. Only set for self-hosted installations.                               |
| `massdriver.appUrl`         | `MASSDRIVER_APP_URL`   | no       | frontend   | Massdriver web app origin, used to build deep-links. Only set for self-hosted installations. |

### Getting the values

- **Organization ID** (`MASSDRIVER_ORG_ID`): log into the
  [Massdriver app](https://app.massdriver.cloud) — the ID is the URL segment
  after `/orgs/` on any page (`https://app.massdriver.cloud/orgs/<org-id>/…`),
  and is also shown under **Organization settings → General**.
- **API token** (`MASSDRIVER_API_TOKEN`): create a service account under
  **Organization settings → Service accounts**
  (`https://app.massdriver.cloud/orgs/<org-id>/settings/service-accounts`) and
  copy its token. See the [Massdriver docs](https://docs.massdriver.cloud) for
  details on service accounts.

`apiToken` is declared with `secret` visibility in the config schema: Backstage
strips it from frontend config automatically. Still, keep it out of committed
files — put it in `app-config.local.yaml` (gitignored), an environment
variable, or your secret store, like any other Backstage secret.

## What you get

- **`/massdriver/projects`** — organization-wide projects list, and per-project
  details with tabs.
- **`/massdriver/projects/:project/environments/:environment`** — the
  environment graph: packages, connections, statuses, and an instance drawer
  with overview, configuration, deployment history, logs, resources, and
  dependencies. Environments and deployments can be compared side by side.
- **`/massdriver/repositories`** — bundle repositories, versions, and files.
- **`/massdriver/resources`** — cloud resources with usage and details.
- **Entity overview card** and **Massdriver tab** on any catalog entity
  annotated with a `massdriver.cloud/*` ID (below), showing instance status,
  versions, and "Open in Massdriver" deep-links.

All views are read-only and update live. Actions that change infrastructure
(deploy, decommission, configuration edits, …) deep-link into the Massdriver
app.

The plugin does **not** mirror infrastructure into the Backstage catalog; you
link your existing catalog entities to Massdriver via annotations.

## Sidebar

On the default nav, the plugin contributes a flat **Massdriver** sidebar link
automatically — nothing to do.

If your app customizes the sidebar (`NavContentBlueprint`), you can render the
plugin's ready-made entry instead: the Massdriver logo linking to the projects
list, with a **Projects / Resources / Repositories** submenu matching the
Massdriver web app:

```tsx
import { MassdriverSidebarItem } from '@massdriver/backstage-plugin';

// Inside your NavContentBlueprint component: swap the plugin's default flat
// item for the submenu entry, and render everything else as usual.
const nav = navItems.withComponent(item =>
  item.href?.startsWith('/massdriver') ? (
    <MassdriverSidebarItem />
  ) : (
    <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
  ),
);
```

(If you build your `<Sidebar>` without the `navItems` API, just place
`<MassdriverSidebarItem />` wherever it belongs — but then make sure the
default Massdriver nav item isn't also rendered, or it will appear twice.)

## Annotations

Add one of these to an entity's `catalog-info.yaml` to attach the Massdriver
card + tab, pointing at the most specific matching Massdriver resource:

```yaml
metadata:
  annotations:
    massdriver.cloud/project-id: my-project
    # or the more specific scopes:
    # massdriver.cloud/environment-id: my-project-prod
    # massdriver.cloud/instance-id: my-project-prod-cache
```

If an entity carries more than one, the most specific wins: `instance-id` >
`environment-id` > `project-id`. An optional `massdriver.cloud/org-id`
annotation can accompany any of them to pin the organization explicitly (useful
mainly in multi-org setups); it defaults to the configured
`massdriver.organizationId`.

## Security & authorization

- The service-account token lives only in backend config (`secret`
  visibility); the browser talks exclusively to the relay, which injects the
  token and your `organizationId` server-side. Client-supplied organization
  IDs are ignored.
- The relay exposes **no mutation endpoints** — it forwards read queries and a
  read-only realtime subscription stream.
- Any authenticated Backstage user sees whatever the service account can read.
  This is an org-wide, read-only integration; there is no per-user scoping in
  this version.

## Troubleshooting

**Massdriver pages load but details look subtly wrong (misaligned switch
thumbs, tooltip arrows, chip padding).** In development the plugin logs a
`console.warn` starting with `[backstage-plugin-massdriver] MUI v5 class-name
mismatch detected` when it can diagnose the cause: something in your app
evaluates `@mui/material` during startup, before Backstage configures its MUI
v5 class-name prefix — usually an eager import of a MUI v5 component (or a
library re-exporting one) in custom app chrome or another plugin's package
root. Move that import behind a dynamic `import()` (or out of the startup
path). Background: [backstage#31846](https://github.com/backstage/backstage/issues/31846).

**No data / errors on Massdriver pages.** Check the backend logs — the relay
logs Massdriver API failures. Verify `massdriver.apiToken` and
`massdriver.organizationId`, and that the backend can reach your API origin
over both HTTPS and WSS.
