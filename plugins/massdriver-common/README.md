# @massdriver/backstage-plugin-common

Shared isomorphic library for the
[Massdriver Backstage plugin](https://www.npmjs.com/package/@massdriver/backstage-plugin)
and its
[backend relay](https://www.npmjs.com/package/@massdriver/backstage-plugin-backend).
You normally don't install this directly — it comes in as a dependency of the
other two packages.

It contains:

- **Catalog annotation keys** (`massdriver.cloud/project-id`,
  `massdriver.cloud/environment-id`, `massdriver.cloud/instance-id`,
  `massdriver.cloud/org-id`) for linking Backstage entities to Massdriver
  resources.
- **Config readers** for the `massdriver` app-config block (`organizationId`,
  `apiToken`, `baseUrl`, `appUrl`). The config _schemas_ ship with the frontend
  and backend plugins, each declaring the keys it reads — including the
  `secret` visibility that keeps `apiToken` backend-only.
- **ID and deep-link helpers** — parsing Massdriver composite IDs and building
  URLs into the Massdriver web app.
- The server-side GraphQL client used by the backend relay.
