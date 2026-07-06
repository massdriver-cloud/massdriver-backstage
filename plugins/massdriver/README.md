# Massdriver Backstage plugin

Surface your [Massdriver](https://www.massdriver.cloud/) infrastructure inside
Backstage: browse your projects on a dedicated page, and attach a status card +
tab to any catalog entity you link to a Massdriver project, environment, or
instance — with deep-links back into the Massdriver app.

Integration is **API-only** — it talks to the Massdriver v2 GraphQL API through a
backend relay that injects a service-account token server-side. Nothing is
iframed and no changes to the Massdriver app are required.

## Packages

| Package | Role |
| --- | --- |
| `@massdriver-cloud/backstage-plugin-massdriver` | Frontend: entity card, entity tab, and projects page |
| `@massdriver-cloud/backstage-plugin-massdriver-backend` | Backend: authenticated GraphQL relay |
| `@massdriver-cloud/backstage-plugin-massdriver-common` | Shared types, annotations, deep-link builders |

## Install

From your Backstage repo root:

```bash
# Frontend
yarn --cwd packages/app add @massdriver-cloud/backstage-plugin-massdriver

# Backend relay
yarn --cwd packages/backend add \
  @massdriver-cloud/backstage-plugin-massdriver-backend
```

Add the backend plugin in `packages/backend/src/index.ts`:

```ts
backend.add(import('@massdriver-cloud/backstage-plugin-massdriver-backend'));
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
```

Mint a service-account token in Massdriver under
**Organization settings → Service accounts**. Keep `apiToken` in
`app-config.local.yaml` or a secret store — it is `secret`-visibility and never
reaches the browser.

## What you get

- **Projects page** at `/massdriver` for organization-wide discovery, queried
  live from the Massdriver API.
- **Entity overview card** and **Massdriver tab** on any catalog entity you
  annotate with a `massdriver.cloud/*` id (below), showing instance status,
  versions, and an "Open in Massdriver" deep-link.

This version keeps infrastructure in Massdriver — it does **not** mirror it into
the Backstage catalog. You link your existing catalog entities (services, etc.)
to Massdriver via annotations.

## Annotations

Add one of these to an entity's `catalog-info.yaml` to attach the Massdriver
card + tab, pointing at the most specific matching Massdriver resource:

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
