/**
 * The massdriver backend module for the catalog plugin. Syncs Massdriver
 * projects, environments, and instances into the software catalog.
 *
 * @packageDocumentation
 */

export { catalogModuleMassdriver as default } from './module';
export { MassdriverEntityProvider } from './provider';
export type { MassdriverEntityProviderOptions } from './provider';
