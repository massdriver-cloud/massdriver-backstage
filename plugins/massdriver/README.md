# Massdriver Backstage plugin

Surface your [Massdriver](https://www.massdriver.cloud/) infrastructure inside
Backstage: projects, environments, and deployed instances are synced into the
software catalog with status cards, an entity tab, a projects page, and
deep-links back into the Massdriver app.

Integration is **API-only** — it talks to the Massdriver v2 GraphQL API through a
backend relay that injects a service-account token server-side. Nothing is
iframed and no changes to the Massdriver app are required.

## Packages

| Package | Role |
| --- | --- |
| `@massdriver-cloud/backstage-plugin-massdriver` | Frontend: entity card, entity tab, and projects page |
| `@massdriver-cloud/backstage-plugin-massdriver-backend` | Backend: authenticated GraphQL relay |
| `@massdriver-cloud/backstage-plugin-catalog-backend-module-massdriver` | Catalog entity provider (scheduled sync) |
| `@massdriver-cloud/backstage-plugin-massdriver-common` | Shared types, annotations, deep-link builders |

## Install

From your Backstage repo root:

```bash
# Frontend
yarn --cwd packages/app add @massdriver-cloud/backstage-plugin-massdriver

# Backend + catalog entity provider
yarn --cwd packages/backend add \
  @massdriver-cloud/backstage-plugin-massdriver-backend \
  @massdriver-cloud/backstage-plugin-catalog-backend-module-massdriver
```

Add the backend plugins in `packages/backend/src/index.ts`:

```ts
backend.add(import('@massdriver-cloud/backstage-plugin-massdriver-backend'));
backend.add(
  import('@massdriver-cloud/backstage-plugin-catalog-backend-module-massdriver'),
);
```

With the **New Frontend System** (`app.packages: all`), the frontend extensions
— the entity overview card, the "Massdriver" entity tab, and the `/massdriver`
projects page — are discovered and attached automatically. On the legacy
frontend system, add `EntityMassdriverOverviewCard`, `EntityMassdriverContent`,
and `MassdriverPage` to your `EntityPage.tsx` / `App.tsx` manually.

## Configure

```yaml
# app-config.yaml
massdriver:
  organizationId: ${MASSDRIVER_ORG_ID}
  apiToken: ${MASSDRIVER_API_TOKEN} # service-account token (backend-only, secret)
  # Optional — override for self-hosted Massdriver. Default to the SaaS origins.
  baseUrl: ${MASSDRIVER_API_URL} # default https://api.massdriver.cloud
  appUrl: ${MASSDRIVER_APP_URL} # default https://app.massdriver.cloud
  # Optional — catalog sync cadence (defaults to every 30 minutes)
  schedule:
    frequency: { minutes: 30 }
    timeout: { minutes: 3 }
```

Mint a service-account token in Massdriver under
**Organization settings → Service accounts**. Keep `apiToken` in
`app-config.local.yaml` or a secret store — it is `secret`-visibility and never
reaches the browser.

## What you get

- **Catalog sync** — Massdriver projects become `Domain`s, environments become
  `System`s, and instances become `Resource`s, linked by `massdriver.cloud/*`
  annotations and carrying "Open in Massdriver" deep-links.
- **Entity overview card** and **Massdriver tab** on any synced entity, showing
  instance status and versions.
- **Projects page** at `/massdriver` for organization-wide discovery.

## Annotations

The entity provider stamps these automatically; you can also add them to your own
`catalog-info.yaml` to link a hand-authored entity to Massdriver:

```yaml
metadata:
  annotations:
    massdriver.cloud/org-id: my-org
    massdriver.cloud/project-id: my-project
    # or environment-id: my-project-prod
    # or instance-id: my-project-prod-cache
```

## Authorization note

The relay queries with the organization's **service-account** token, so any
authenticated Backstage user sees whatever that account can read. This is an
org-wide, read-only integration; there is no per-user scoping in this version.
