import {
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  Entity,
} from '@backstage/catalog-model';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  ANNOTATION_ENVIRONMENT_ID,
  ANNOTATION_INSTANCE_ID,
  ANNOTATION_ORG_ID,
  ANNOTATION_PROJECT_ID,
  createMassdriverClient,
  environmentUrl,
  instanceUrl,
  MassdriverClient,
  MassdriverConfig,
  MassdriverEnvironment,
  MassdriverInstance,
  MassdriverProject,
  projectUrl,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';

const PAGE_SIZE = 100;

interface PageResult<T> {
  items?: (T | null)[];
  cursor?: { next?: string | null };
}

const PROJECTS_QUERY = `
  query MassdriverProjects($organizationId: ID!, $cursor: Cursor) {
    projects(organizationId: $organizationId, cursor: $cursor) {
      items {
        id
        name
        description
      }
      cursor {
        next
      }
    }
  }
`;

const ENVIRONMENTS_QUERY = `
  query MassdriverEnvironments($organizationId: ID!, $cursor: Cursor) {
    environments(organizationId: $organizationId, cursor: $cursor) {
      items {
        id
        name
        description
        project {
          id
        }
      }
      cursor {
        next
      }
    }
  }
`;

const INSTANCES_QUERY = `
  query MassdriverInstances($organizationId: ID!, $cursor: Cursor) {
    instances(organizationId: $organizationId, cursor: $cursor) {
      items {
        id
        name
        status
        resolvedVersion
        deployedVersion
        environment {
          id
        }
      }
      cursor {
        next
      }
    }
  }
`;

/** Options for {@link MassdriverEntityProvider}. */
export interface MassdriverEntityProviderOptions {
  config: MassdriverConfig;
  logger: LoggerService;
  taskRunner: SchedulerServiceTaskRunner;
  /** Owner entity ref stamped on emitted entities. */
  ownerRef: string;
}

/** Sanitize a Massdriver composite id into a valid Backstage entity name. */
const toEntityName = (id: string): string =>
  id
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, 63);

/**
 * Syncs Massdriver projects, environments, and instances into the Backstage
 * software catalog as `Domain` / `System` / `Resource` entities, linked by
 * `massdriver.cloud/*` annotations with deep-links back into the web app.
 *
 * @public
 */
export class MassdriverEntityProvider implements EntityProvider {
  private readonly logger: LoggerService;
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private readonly config: MassdriverConfig;
  private readonly ownerRef: string;
  private readonly client: MassdriverClient;
  private readonly locationKey: string;
  private connection?: EntityProviderConnection;

  constructor(options: MassdriverEntityProviderOptions) {
    this.logger = options.logger.child({
      target: this.getProviderName(),
    });
    this.taskRunner = options.taskRunner;
    this.config = options.config;
    this.ownerRef = options.ownerRef;
    this.client = createMassdriverClient({
      token: options.config.apiToken,
      organizationId: options.config.organizationId,
      baseUrl: options.config.baseUrl,
    });
    this.locationKey = `massdriver-entity-provider:${options.config.organizationId}`;
  }

  getProviderName(): string {
    return 'massdriver-entity-provider';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        try {
          await this.run();
        } catch (error) {
          this.logger.error(
            `Massdriver catalog sync failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      },
    });
  }

  private async fetchAll<T>(query: string, field: string): Promise<T[]> {
    const items: T[] = [];
    let next: string | null = null;
    do {
      const response = (await this.client.query(query, {
        cursor: { limit: PAGE_SIZE, next },
      })) as Record<string, PageResult<T>>;
      const page: PageResult<T> | undefined = response[field];
      for (const item of page?.items ?? []) {
        if (item) {
          items.push(item);
        }
      }
      next = page?.cursor?.next ?? null;
    } while (next);
    return items;
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Massdriver entity provider is not connected');
    }

    const [projects, environments, instances] = await Promise.all([
      this.fetchAll<MassdriverProject>(PROJECTS_QUERY, 'projects'),
      this.fetchAll<MassdriverEnvironment>(ENVIRONMENTS_QUERY, 'environments'),
      this.fetchAll<MassdriverInstance>(INSTANCES_QUERY, 'instances'),
    ]);

    const entities: Entity[] = [
      ...projects.map(project => this.projectToEntity(project)),
      ...environments.map(environment =>
        this.environmentToEntity(environment),
      ),
      ...instances.map(instance => this.instanceToEntity(instance)),
    ];

    this.logger.info(
      `Massdriver catalog sync: ${projects.length} projects, ${environments.length} environments, ${instances.length} instances`,
    );

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        entity,
        locationKey: this.locationKey,
      })),
    });
  }

  private baseAnnotations(): Record<string, string> {
    return {
      [ANNOTATION_LOCATION]: this.locationKey,
      [ANNOTATION_ORIGIN_LOCATION]: this.locationKey,
      [ANNOTATION_ORG_ID]: this.config.organizationId,
    };
  }

  private projectToEntity(project: MassdriverProject): Entity {
    const { organizationId, appUrl } = this.config;
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Domain',
      metadata: {
        name: toEntityName(project.id),
        title: project.name,
        description: project.description ?? undefined,
        annotations: {
          ...this.baseAnnotations(),
          [ANNOTATION_PROJECT_ID]: project.id,
        },
        links: [
          {
            url: projectUrl(appUrl, organizationId, project.id),
            title: 'Open in Massdriver',
            icon: 'dashboard',
          },
        ],
      },
      spec: {
        owner: this.ownerRef,
      },
    };
  }

  private environmentToEntity(environment: MassdriverEnvironment): Entity {
    const { organizationId, appUrl } = this.config;
    const projectId = environment.project?.id;
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'System',
      metadata: {
        name: toEntityName(environment.id),
        title: environment.name,
        description: environment.description ?? undefined,
        annotations: {
          ...this.baseAnnotations(),
          [ANNOTATION_ENVIRONMENT_ID]: environment.id,
          ...(projectId ? { [ANNOTATION_PROJECT_ID]: projectId } : {}),
        },
        links: [
          {
            url: environmentUrl(appUrl, organizationId, environment.id),
            title: 'Open in Massdriver',
            icon: 'dashboard',
          },
        ],
      },
      spec: {
        owner: this.ownerRef,
        ...(projectId ? { domain: toEntityName(projectId) } : {}),
      },
    };
  }

  private instanceToEntity(instance: MassdriverInstance): Entity {
    const { organizationId, appUrl } = this.config;
    const environmentId = instance.environment?.id;
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Resource',
      metadata: {
        name: toEntityName(instance.id),
        title: instance.name,
        annotations: {
          ...this.baseAnnotations(),
          [ANNOTATION_INSTANCE_ID]: instance.id,
          ...(environmentId
            ? { [ANNOTATION_ENVIRONMENT_ID]: environmentId }
            : {}),
        },
        links: [
          {
            url: instanceUrl(appUrl, organizationId, instance.id),
            title: 'Open in Massdriver',
            icon: 'dashboard',
          },
        ],
      },
      spec: {
        type: 'massdriver-instance',
        owner: this.ownerRef,
        ...(environmentId
          ? { system: toEntityName(environmentId) }
          : {}),
      },
    };
  }
}
