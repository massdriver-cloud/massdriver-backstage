---
paths:
  - 'plugins/massdriver/src/**/*.tsx'
  - 'plugins/massdriver/src/theme/**'
  - 'plugins/massdriver/src/shell/**'
---

# Styling, Theme Scope & MUI v4/v5 Coexistence

Backstage's host app runs MUI v4; the Massdriver plugin renders MUI v5 (`@massdriver/ui`) inside an isolated island. Getting this wrong produces specificity fights and unstyled/blank components.

## The Theme Island

- **`theme/MassdriverThemeScope.tsx`** is the only file allowed to import `@mui/material`. It creates a dedicated Emotion cache (`key: 'mdui'`, deliberately **not** `prepend: true` so v5 styles win specificity ties against Backstage's v4 JSS) and mounts `ThemeProvider` + `ScopedCssBaseline` with `@massdriver/ui/theme`'s Light/Dark themes.
- **`theme/ThemeModeContext.tsx`** persists light/dark to localStorage, independent of Backstage's theme. The shell header owns the toggle.
- Every Massdriver page/entity surface renders inside `MassdriverShell` (or wraps itself in `MassdriverThemeScope` for entity cards). New top-level surfaces must not render `@massdriver/ui` components outside the scope — they'd pick up the wrong theme.

## Hybrid-Runtime Component Bans

- **No MUI `Drawer`, `Modal`, `Dialog`-as-modal, or `Slide`-transition components.** They rely on portals/transitions that do not paint reliably in the hybrid v4+v5 runtime. Overlays are absolutely-positioned `Box` panels anchored to a `position: relative` container — see `InstanceDrawer` (`Panel`) and `DeploymentLogsPanel` (`Root`). `@massdriver/ui/Dialog` is used only where already proven to work (compare dialogs); prefer the panel pattern for anything new.
- MUI v4 (`@material-ui/*`) is Backstage's — never import it in the plugin. `@mui/icons-material` v5 icons are fine.
- Watch for v4/v5 class-name collisions when styling near Backstage chrome (both stacks emit `Mui*` classes); scope selectors inside `stylin()` components rather than global overrides.

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
