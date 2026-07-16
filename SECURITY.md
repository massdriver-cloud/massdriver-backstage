# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, use GitHub's
[private vulnerability reporting](https://github.com/massdriver-cloud/massdriver-backstage/security/advisories/new)
for this repository. We will acknowledge your report and follow up with next
steps.

## Scope

This repository contains the Massdriver Backstage plugin packages
(`@massdriver/backstage-plugin`, `@massdriver/backstage-plugin-backend`,
`@massdriver/backstage-plugin-common`). For vulnerabilities in the Massdriver
platform itself, please contact Massdriver through
[massdriver.cloud](https://www.massdriver.cloud/).

## Security model notes

- The plugin is read-only by design: the backend relay exposes no mutation
  endpoints.
- The Massdriver service-account token is backend-only configuration
  (`secret` visibility) and is never sent to the browser.
- Any authenticated Backstage user can see whatever the configured service
  account can read; there is no per-user scoping.
