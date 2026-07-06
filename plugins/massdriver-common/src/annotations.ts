/**
 * Catalog annotations that link a Backstage entity to a Massdriver resource.
 *
 * Frontend components render Massdriver UI only when the relevant annotation is
 * present, and the catalog entity provider stamps these onto the entities it
 * emits.
 *
 * @public
 */
export const ANNOTATION_ORG_ID = 'massdriver.cloud/org-id';

/** @public */
export const ANNOTATION_PROJECT_ID = 'massdriver.cloud/project-id';

/** @public */
export const ANNOTATION_ENVIRONMENT_ID = 'massdriver.cloud/environment-id';

/** @public */
export const ANNOTATION_INSTANCE_ID = 'massdriver.cloud/instance-id';
