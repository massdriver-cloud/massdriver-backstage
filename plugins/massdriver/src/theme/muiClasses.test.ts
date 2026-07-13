import {
  chipClasses,
  drawerClasses,
  outlinedInputClasses,
  selectClasses,
  toggleButtonClasses,
} from './muiClasses';

// Suffix assertions so they hold with or without a ClassNameGenerator prefix
// (Backstage prefixes slot classes with `v5-`; plain jest runs don't).
describe('muiClasses', () => {
  it('resolves the slot classes the plugin styles against', () => {
    expect(chipClasses.label).toMatch(/MuiChip-label$/);
    expect(drawerClasses.paper).toMatch(/MuiDrawer-paper$/);
    expect(outlinedInputClasses.root).toMatch(/MuiOutlinedInput-root$/);
    expect(outlinedInputClasses.input).toMatch(/MuiOutlinedInput-input$/);
    expect(selectClasses.select).toMatch(/MuiSelect-select$/);
    expect(toggleButtonClasses.root).toMatch(/MuiToggleButton-root$/);
  });
});
