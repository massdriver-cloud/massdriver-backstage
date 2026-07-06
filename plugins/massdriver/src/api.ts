import {
  ConfigApi,
  createApiRef,
  FetchApi,
} from '@backstage/frontend-plugin-api';
import {
  DEFAULT_APP_URL,
  MASSDRIVER_CONFIG_KEY,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';

/**
 * Frontend API for talking to Massdriver via the backend relay.
 *
 * All queries are proxied through `plugin://massdriver/graphql`, where the
 * backend injects the service-account bearer token. The browser never sees the
 * token, and `organizationId` is injected server-side, so callers only declare
 * `$organizationId` in their operations.
 *
 * @public
 */
export interface MassdriverApi {
  /** Web app origin used to build deep-links. */
  readonly appUrl: string;
  /** Massdriver organization id, when configured on the frontend. */
  readonly organizationId: string;
  query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
}

/** @public */
export const massdriverApiRef = createApiRef<MassdriverApi>({
  id: 'plugin.massdriver.api',
});

/** @public */
export class MassdriverClientApi implements MassdriverApi {
  private readonly fetchApi: FetchApi;
  readonly appUrl: string;
  readonly organizationId: string;

  constructor(options: { fetchApi: FetchApi; configApi: ConfigApi }) {
    this.fetchApi = options.fetchApi;
    this.appUrl =
      options.configApi.getOptionalString(
        `${MASSDRIVER_CONFIG_KEY}.appUrl`,
      ) ?? DEFAULT_APP_URL;
    this.organizationId =
      options.configApi.getOptionalString(
        `${MASSDRIVER_CONFIG_KEY}.organizationId`,
      ) ?? '';
  }

  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.fetchApi.fetch('plugin://massdriver/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(
        `Massdriver request failed: ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    if (body.errors?.length) {
      throw new Error(body.errors.map(error => error.message).join('; '));
    }

    return body.data as T;
  }
}
