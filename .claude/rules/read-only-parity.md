---
paths:
  - 'plugins/massdriver/src/features/**'
  - 'plugins/massdriver/src/components/DisabledAction*'
  - 'plugins/massdriver/src/components/OpenInMassdriverButton*'
  - 'plugins/massdriver-common/src/urls.ts'
---

# Read-Only Parity: Mutation Boundaries & Deep Links

The plugin mirrors the web app's read surface. The line is absolute: **reads are ported in-app; writes leave the app.**

## Mutation Boundaries

Every affordance that mutates in the web app becomes one of:

- **`DisabledAction`** (`components/DisabledAction.tsx`) — renders the control disabled with a tooltip explaining the action happens in Massdriver. Use when the control's presence carries information (e.g. a Rollback button showing rollback _exists_), or when the web app disables it contextually too.
- **Deep link out** — `OpenInMassdriverButton` or a plain link built from `massdriver-common/src/urls.ts`. Use when the user's intent is "go do this": `instanceTabUrl(appUrl, orgId, instanceId, 'overview')` for change-version, `instanceActionUrl(…, 'decommission')` for the action dialogs, etc.

Never a third option. No mutation documents, no optimistic UI, no "small harmless" writes (marking read, favoriting — all of it links out).

## Deep-Link Builders

- All web-app URLs come from `urls.ts` builders — never hand-concatenate `/orgs/${orgId}/…` strings in components.
- Builders must match the web app's real route table (`apps/web/shared/routes/routes.js`) and its dialog/tab URL params (`?tab=` tabs, `?action=` dialogs via `useDialogParam`). When the web app's routes change shape, this file is the single place to update — and each builder has a test asserting the exact URL.
- Composite IDs: segments are hyphen-free, so `parseInstanceId`/`parseEnvironmentId` split on `-`. `{projectId}-{scopedEnvironmentId}-{scopedComponentId}`; component IDs are `{projectId}-{scopedComponentId}`. Mirrors `apps/web/shared/utils/ids.js`.

## Porting Checklist

When porting a web-app surface (or updating a ported one):

1. **Read the original** under `~/Massdriver/massdriver-ui/apps/web/features/…` and note it in a comment (`// Ported from apps/web/…`).
2. **Keep helper logic faithful** — same names where possible, same edge-case behavior (`composeLogsText` mirrors `composeText` including its leading-newline quirk). Divergence is only justified by architecture differences (no Apollo cache → refetch-on-revision; no snackbar → inline error/log-to-console; hybrid runtime → panel instead of Drawer), and the justifying comment says so.
3. **Strip mutation paths, don't hide them** — replace each with `DisabledAction` or a deep link so read-only parity is visible, not silently missing.
4. **Instance identifiers:** display `instance.id` (the composite id users navigate by), not `instance.name`, except where the web app itself shows the name.
5. **Check the read-only inverse too:** anything newly readable in the web app's surface (a new tab, a new column) is a parity gap here — file it or port it.

## Entity Integration

Catalog entities map to Massdriver via annotations (`massdriver.cloud/project-id`, etc. — `massdriver-common/src/annotations.ts`). `isMassdriverEntity` gates the entity card/content blueprints. New annotations go in `annotations.ts` with a reader helper in `entity.ts`, never inline string keys.
