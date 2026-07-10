// Ported from apps/web/features/resources/utils/resourceConstants.js

export const PROVISIONED_EDIT_TOOLTIP =
  "You can't rename a provisioned resource. Edit its instance configuration instead.";

export const PROVISIONED_DELETE_TOOLTIP =
  "You can't delete a provisioned resource. Decommission its instance instead.";

// Read-only parity: the web app's edit/delete row actions mutate, so here they
// stay visible but disabled with a tooltip pointing at Massdriver.
export const IMPORTED_EDIT_TOOLTIP = 'Resources are edited in Massdriver';

export const IMPORTED_DELETE_TOOLTIP = 'Resources are deleted in Massdriver';
