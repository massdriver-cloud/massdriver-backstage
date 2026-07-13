import { Entity } from '@backstage/catalog-model';
import {
  ANNOTATION_ENVIRONMENT_ID,
  ANNOTATION_INSTANCE_ID,
  ANNOTATION_ORG_ID,
  ANNOTATION_PROJECT_ID,
} from '@massdriver/backstage-plugin-common';

/** The Massdriver resource an entity maps to. */
export type MassdriverScope =
  | { kind: 'project'; projectId: string; orgId?: string }
  | { kind: 'environment'; environmentId: string; orgId?: string }
  | { kind: 'instance'; instanceId: string; orgId?: string };

const annotation = (entity: Entity, key: string): string | undefined =>
  entity.metadata.annotations?.[key];

/**
 * Resolve which Massdriver resource an entity represents from its annotations.
 * Instance is most specific, then environment, then project.
 */
export const getMassdriverScope = (
  entity: Entity,
): MassdriverScope | undefined => {
  const orgId = annotation(entity, ANNOTATION_ORG_ID);
  const instanceId = annotation(entity, ANNOTATION_INSTANCE_ID);
  if (instanceId) {
    return { kind: 'instance', instanceId, orgId };
  }
  const environmentId = annotation(entity, ANNOTATION_ENVIRONMENT_ID);
  if (environmentId) {
    return { kind: 'environment', environmentId, orgId };
  }
  const projectId = annotation(entity, ANNOTATION_PROJECT_ID);
  if (projectId) {
    return { kind: 'project', projectId, orgId };
  }
  return undefined;
};

/** True when the entity carries any Massdriver annotation. */
export const isMassdriverEntity = (entity: Entity): boolean =>
  Boolean(getMassdriverScope(entity));
