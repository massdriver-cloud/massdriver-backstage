/**
 * Catalog annotations that link a Backstage entity to a Massdriver resource.
 *
 * Frontend components render Massdriver UI only when the relevant annotation is
 * present on an entity. Add them to your own `catalog-info.yaml` to link an
 * entity to a Massdriver project, environment, or instance.
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
