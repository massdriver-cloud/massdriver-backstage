---
paths:
  - 'plugins/massdriver/src/**/*.tsx'
  - 'plugins/massdriver/src/theme/**'
  - 'plugins/massdriver/src/shell/**'
---

# Styling, Theme Scope & MUI v4/v5 Coexistence

Backstage's host app runs MUI v4; the Massdriver plugin renders MUI v5 (`@massdriver/ui`) inside an isolated island.

## The `v5-` Class Prefix (the one fact that explains everything)

Backstage's `UnifiedThemeProvider` (`@backstage/theme`, imported statically by `@backstage/plugin-app` at boot — before any plugin chunk loads) configures MUI v5's `ClassNameGenerator` to prefix every generated slot class: the DOM carries `v5-MuiSwitch-thumb`, not `MuiSwitch-thumb`. Consequences:

- Backstage's v4 rules (which target unprefixed `.Mui*` names) **cannot** match the plugin's v5 DOM — the old "v4 clobbers v5" fear is handled upstream.
- The inverse hazard is ours: **a hardcoded `.Mui*` slot selector in a `stylin()` style silently never matches.** Build slot selectors from the constants re-exported by `theme/muiClasses.ts` (`` [`& .${toggleButtonClasses.root}`] ``) — they resolve through the generator. State classes (`.Mui-checked`, `.Mui-selected`, `.Mui-disabled`, …) are never renamed and may stay literal.
- `@massdriver/ui` ≥ 1.0.1 uses class constants internally for the same reason; earlier versions render subtly broken in Backstage (off-kilter Switch, etc.).
- **Never let `@mui/material` evaluate before Backstage's configure (the boot-graph rule).** MUI freezes every `*Classes` constant and internal cross-slot selector at module evaluation. Backstage's package detection `require()`s this plugin's ROOT entry at boot (`__backstage-autodetected-plugins__` webpack entry) — before the configure — so anything the root entry statically imports that reaches the `@mui/material` barrel (any `@massdriver/ui` component or icon) freezes ALL slot names unprefixed while the DOM later renders prefixed, silently breaking MUI's own internals (small-Switch geometry, Tooltip arrow) and every constant-based selector. Guards: package-root exports that reach `@massdriver/ui` go through dynamic import (`ProjectsListPageLazy`), `src/index.test.ts` fails if the barrel becomes eagerly reachable, and the host app's sidebar uses local v4 icon copies (`packages/app/src/modules/nav/icons/`) instead of `@massdriver/ui/icons/*`. Verified via prod build: no v5 component code in any boot chunk.
- **Do NOT call `ClassNameGenerator.configure` anywhere** — it's one process-global singleton shared with Backstage and cannot give the plugin "its own" names. An eager app-entry configure was tried (2026-07-13) and broke Backstage's own chrome; the boot-graph rule above is the correct fix.

## The Theme Island

- **`theme/MassdriverThemeScope.tsx`**, **`theme/muiClasses.ts`**, and **`theme/muiClassNameAudit.ts`** are the only files allowed to import `@mui/material` (the scope for its providers, `muiClasses` for slot-class constants, the audit for the dev-mode freeze detector). The scope creates a dedicated Emotion cache (`key: 'mdui'`) to keep the island's style tags separate from Backstage's caches, mounts `ThemeProvider` + `ScopedCssBaseline` with `@massdriver/ui/theme`'s Light/Dark themes, and runs `auditMuiClassNameConsistency` once (dev only) to `console.warn` when a host app has tripped the boot-graph freeze.
- **`theme/ThemeModeContext.tsx`** persists light/dark to localStorage, independent of Backstage's theme. The shell header owns the toggle.
- Every Massdriver page/entity surface renders inside `MassdriverShell` (or wraps itself in `MassdriverThemeScope` for entity cards). New top-level surfaces must not render `@massdriver/ui` components outside the scope — they'd pick up the wrong theme.

## Hybrid-Runtime Component Bans

- **No MUI `Drawer`, `Modal`, `Dialog`-as-modal, or `Slide`-transition components.** Historically they didn't paint reliably in the hybrid runtime; the likely root cause (the pre-1.0.1 `@massdriver/ui` selector breakage above) is now fixed, but the ban stays until portal components are visually re-verified in Backstage. Overlays are absolutely-positioned `Box` panels anchored to a `position: relative` container — see `InstanceDrawer` (`Panel`) and `DeploymentLogsPanel` (`Root`). `@massdriver/ui/Dialog` is used only where already proven to work (compare dialogs); prefer the panel pattern for anything new. Note portaled content renders outside `ScopedCssBaseline` — it still gets the theme (context crosses portals) but not the scoped baseline.
- MUI v4 (`@material-ui/*`) is Backstage's — never import it in the plugin. `@mui/icons-material` v5 icons are fine.
- **Never hardcode `.Mui*` slot selectors** — see "The `v5-` Class Prefix" above; use `theme/muiClasses.ts` constants.

## `@massdriver/ui` Conventions (carried from the web app)

- **Individual imports only:** `import Box from '@massdriver/ui/Box'`; named sub-exports where the module is the boundary (`import { CloseIconButton } from '@massdriver/ui/IconButton'`, `import { col } from '@massdriver/ui/DataList'`, `import { alpha, deploymentStatusColors } from '@massdriver/ui/theme'`).
- **`stylin` over inline `sx`/`style`**; declarations go **below** the component, above `export default`. Because the lib is ambient-`any`, type theme params explicitly: `stylin(Box)(({ theme }: { theme: any }) => ({ … }))`.
- **sx-multiplier gotcha:** inside `stylin`, bare numbers in spacing props are ×8px (`padding: 6` = 48px) and `borderRadius: n` is n × shape radius. Use `theme.spacing(…)` or `'6px'` strings for literal pixels.
- **Theme tokens over hardcoded values** (`theme.palette.*`, `theme.spacing`, `deploymentStatusColors`, `instanceStatusColors`, `logSurfaceColors`). No gradients. No `cursor: 'help'`.
- **`LoadingIndicator`, never `CircularProgress`.**
- **Icons:** monochrome UI-chrome icons render bare (inherit `currentColor`); colored/brand icons (bundle icons, provider logos, API icon URLs) go in `IconTile`.
- No single-letter variables, ternaries over `if`, no data mutation, one component per file, minimal comments — same as the web app.

## Loading States

- Initial load → `LoadingIndicator` (or a skeleton for predictable layouts).
- **Realtime-refetched views never flash** — use `useLiveRelayQuery`, whose `loading` only fires on initial load/identity change (`.claude/rules/realtime.md`).
- Errors → inline `<Alert severity="error">` (drawer tabs: `TabState`); missing entity → `<NotFound>`. Never render an empty state for a failed query.

## Lint Preset Adjustments

`plugins/massdriver/.eslintrc.js` adapts the Backstage ESLint preset to this house style — keep these in sync if conventions change: `no-use-before-define` allows forward-referenced variables (stylin-below-component), `no-nested-ternary` is off (loading/error/content chains), `eqeqeq` ignores null comparisons (`value != null`).

## Ambient Types

`@massdriver/ui` and `@massdriver/forms` ship no `.d.ts`; `src/massdriver-ui.d.ts` declares them as `any` modules. That's the single sanctioned `any` boundary — don't let it leak: type component props and API result shapes explicitly at the point of use.
