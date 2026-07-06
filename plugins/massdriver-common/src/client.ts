import { DEFAULT_API_URL, graphqlUrl } from './urls';

/**
 * Options for {@link createMassdriverClient}.
 *
 * @public
 */
export interface MassdriverClientOptions {
  /** Service-account bearer token. Never leaves the backend. */
  token: string;
  /** Massdriver organization id; auto-injected into every query's variables. */
  organizationId: string;
  /** API origin. Defaults to {@link DEFAULT_API_URL}. */
  baseUrl?: string;
  /** Override the fetch implementation (defaults to the global `fetch`). */
  fetchImpl?: typeof fetch;
}

/** @public */
export interface MassdriverClient {
  organizationId: string;
  query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
}

/** @public */
export class MassdriverApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'MassdriverApiError';
  }
}

/**
 * Create a minimal, framework-agnostic client for the Massdriver v2 GraphQL API.
 *
 * Injects the `Authorization: Bearer` header and defaults `organizationId` into
 * every query's variables so operations only need to declare `$organizationId`.
 * Used server-side by the backend relay; the token must never be exposed to the
 * browser.
 *
 * @public
 */
export const createMassdriverClient = (
  options: MassdriverClientOptions,
): MassdriverClient => {
  const { token, organizationId, baseUrl = DEFAULT_API_URL } = options;
  const doFetch = options.fetchImpl ?? fetch;
  const url = graphqlUrl(baseUrl);

  return {
    organizationId,
    async query<T = unknown>(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<T> {
      const response = await doFetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables: { organizationId, ...variables },
        }),
      });

      if (!response.ok) {
        throw new MassdriverApiError(
          `Massdriver API request failed with status ${response.status}`,
          response.status,
        );
      }

      const body = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
      };

      if (body.errors?.length) {
        throw new MassdriverApiError(
          body.errors.map(error => error.message).join('; '),
        );
      }

      if (body.data === undefined) {
        throw new MassdriverApiError('Massdriver API returned no data');
      }

      return body.data;
    },
  };
};
