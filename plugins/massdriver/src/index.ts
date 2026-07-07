/**
 * Frontend plugin for Massdriver: an entity overview card, an entity content
 * tab, and a projects discoverability page, backed by the Massdriver backend
 * relay.
 *
 * @packageDocumentation
 */

export { massdriverPlugin as default } from './plugin';
export { massdriverApiRef, MassdriverClientApi } from './api';
export type { MassdriverApi } from './api';
export { isMassdriverEntity, getMassdriverScope } from './entity';
export type { MassdriverScope } from './entity';
export { EntityMassdriverContent } from './components/EntityMassdriverContent';
export { EntityMassdriverOverviewCard } from './components/EntityMassdriverOverviewCard';
export { ProjectsListPage } from './features/projects/ProjectsListPage';
