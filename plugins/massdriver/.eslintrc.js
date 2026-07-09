const config = require('@backstage/cli/config/eslint-factory')(__dirname);

// Adjust the Backstage preset to the massdriver-ui house style this plugin
// ports (see CLAUDE.md / .claude/rules/styling-and-theme.md):
// - `stylin(...)` styled components are declared BELOW the component that
//   uses them → allow forward references for variables only.
// - Chained ternaries (`loading ? … : error ? … : …`) are the standard
//   loading/error/content gate → allow nested ternaries.
// - `value != null` / `value == null` loose null checks are idiomatic →
//   eqeqeq ignores null comparisons (strict equality enforced elsewhere).
module.exports = {
  ...config,
  rules: {
    ...config.rules,
    '@typescript-eslint/no-use-before-define': [
      'error',
      { functions: false, classes: true, variables: false, typedefs: true },
    ],
    'no-nested-ternary': 'off',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
  },
};
