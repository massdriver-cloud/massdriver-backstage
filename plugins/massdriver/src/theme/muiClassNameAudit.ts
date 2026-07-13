import { unstable_ClassNameGenerator } from '@mui/material/className';
import { switchClasses } from '@mui/material/Switch';

/**
 * Detects the "boot-graph freeze" (backstage#31846): MUI v5 freezes slot-class
 * constants and internal cross-slot selectors at module evaluation. If the
 * host app evaluated `@mui/material` before Backstage's UnifiedThemeProvider
 * configured its `v5-` ClassNameGenerator prefix, those frozen names disagree
 * with the names components render, and cross-slot styling silently breaks
 * (misaligned Switch thumbs, Tooltip arrows, …) for every MUI v5 plugin.
 *
 * Compares a representative frozen constant against what the generator
 * produces now. Returns a warning message on mismatch, null when consistent
 * (either regime — prefixed or unprefixed — is fine as long as both sides
 * agree).
 */
export const auditMuiClassNameConsistency = (): string | null => {
  const frozen = switchClasses.thumb;
  const current = `${unstable_ClassNameGenerator.generate('MuiSwitch')}-thumb`;
  return frozen === current
    ? null
    : `[backstage-plugin-massdriver] MUI v5 class-name mismatch detected: ` +
        `slot-class constants were frozen as "${frozen}" but components now render "${current}". ` +
        `Something in this app evaluates @mui/material before Backstage configures its ` +
        `class-name prefix — usually an eager import of a MUI v5 component (or of a ` +
        `library that re-exports one) in app chrome or in a plugin's package root. ` +
        `Until that import is made lazy, cross-slot styles in MUI v5 plugins will be ` +
        `subtly broken (misaligned Switch thumbs, Tooltip arrows, …). ` +
        `See https://github.com/backstage/backstage/issues/31846.`;
};
