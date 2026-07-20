import { col } from '@massdriver/ui/DataList';
import { buildAttributesColumn, Code } from '../../components/AttributesColumn';
import { RouterLinkAdapter } from '../../components/RouterLinkAdapter';
import { formatAbsoluteTime } from '../../utils/formatRelativeTime';
import type { ProjectRow } from './useProjects';

export const buildProjectColumns = () => [
  col.link('name', 'Name', (row: ProjectRow) => row.id, {
    flex: 2,
    minWidth: 200,
    LinkComponent: RouterLinkAdapter,
  }),
  col.text('id', 'Identifier', { flex: 1, minWidth: 120, sortable: false }),
  col.text('description', 'Description', {
    flex: 3,
    minWidth: 150,
    sortable: false,
  }),
  buildAttributesColumn({
    directText:
      'Key-value attributes assigned directly to this project. Attributes cascade to environments and instances.',
    effectiveText: (
      <>
        The full attribute map the authorization system evaluates policies
        against for this project — the project's own user attributes plus
        auto-injected <Code>md-*</Code> system attributes.
      </>
    ),
    flex: 1,
  }),
  col.text('updatedAt', 'Updated', {
    flex: 1,
    minWidth: 150,
    sortable: false,
    searchable: false,
    tooltip: (_value: unknown, row: ProjectRow) =>
      formatAbsoluteTime(row.updatedAtRaw),
  }),
];
