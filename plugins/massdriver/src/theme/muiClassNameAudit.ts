import { unstable_ClassNameGenerator } from '@mui/material/className';
import { switchClasses } from '@mui/material/Switch';

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
