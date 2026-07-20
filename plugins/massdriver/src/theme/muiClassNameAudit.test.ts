import { unstable_ClassNameGenerator } from '@mui/material/className';
import { auditMuiClassNameConsistency } from './muiClassNameAudit';

describe('auditMuiClassNameConsistency', () => {
  it('is silent when frozen constants match current generation', () => {
    expect(auditMuiClassNameConsistency()).toBeNull();
  });

  it('warns when the generator changes after constants were frozen', () => {
    unstable_ClassNameGenerator.configure(name => `v5-${name}`);
    expect(auditMuiClassNameConsistency()).toContain('class-name mismatch');
  });
});
