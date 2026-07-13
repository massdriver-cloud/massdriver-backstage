// Backstage's package detection `require()`s this package's root entry at app
// boot, BEFORE UnifiedThemeProvider configures MUI v5's `v5-` class prefix.
// If the root entry (or anything it statically imports) evaluates the
// `@mui/material` barrel at that point, every slot-class constant freezes
// unprefixed and cross-slot styling breaks plugin-wide. The mock factory only
// runs if something actually requires the barrel — so this test fails the
// moment an eager path to `@mui/material` sneaks back into the entry graph.
jest.mock('@mui/material', () => {
  throw new Error(
    'The plugin root entry must not eagerly evaluate @mui/material — ' +
      'keep @massdriver/ui imports behind dynamic import() (see ProjectsListPageLazy).',
  );
});

describe('plugin root entry', () => {
  it('does not eagerly evaluate the @mui/material barrel', () => {
    expect(() => require('./index')).not.toThrow();
  });
});
