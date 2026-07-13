import { unstable_ClassNameGenerator } from '@mui/material/className';
import { auditMuiClassNameConsistency } from './muiClassNameAudit';

describe('auditMuiClassNameConsistency', () => {
  it('is silent when frozen constants match current generation', () => {
    // In this test registry no prefix is configured, so both sides agree on
    // the unprefixed names — the healthy (consistent) case.
    expect(auditMuiClassNameConsistency()).toBeNull();
  });

  it('warns when the generator changes after constants were frozen', () => {
    // Simulate a host configuring the prefix AFTER @mui/material evaluated
    // (constants above are already frozen unprefixed).
    unstable_ClassNameGenerator.configure(name => `v5-${name}`);
    expect(auditMuiClassNameConsistency()).toContain('class-name mismatch');
  });
});
