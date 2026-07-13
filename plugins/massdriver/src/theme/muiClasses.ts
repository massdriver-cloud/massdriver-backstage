// Backstage's UnifiedThemeProvider configures MUI v5's ClassNameGenerator to
// prefix generated slot classes (e.g. `v5-MuiSwitch-thumb`) so they can't
// collide with Backstage's MUI v4 rules. Hardcoded `.Mui*` slot selectors
// therefore never match at runtime — selectors must be built from these
// constants, which resolve through the generator. State classes (`Mui-checked`,
// `Mui-selected`, …) are never renamed and may stay literal.
//
// This file and MassdriverThemeScope.tsx are the plugin's only sanctioned
// `@mui/material` imports — add re-exports here as needed.
export { chipClasses } from '@mui/material/Chip';
export { drawerClasses } from '@mui/material/Drawer';
export { outlinedInputClasses } from '@mui/material/OutlinedInput';
export { selectClasses } from '@mui/material/Select';
export { toggleButtonClasses } from '@mui/material/ToggleButton';
