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
