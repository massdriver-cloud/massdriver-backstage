// @massdriver/ui ships as compiled JS without bundled type declarations.
// These ambient module declarations let the plugin import from it (typed as
// any). If the library later ships .d.ts, remove these.
declare module '@massdriver/ui';
declare module '@massdriver/ui/*';

// @massdriver/forms likewise ships compiled JS without bundled declarations.
declare module '@massdriver/forms';
declare module '@massdriver/forms/*';
