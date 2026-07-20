import { DEFAULT_API_URL, graphqlUrl } from './urls';

/** @public */
export interface MassdriverClientOptions {
  token: string;
  organizationId: string;
  baseUrl?: string;
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
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'MassdriverApiError';
  }
}

/** @public */
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
          variables: { ...variables, organizationId },
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

      if (body.data !== undefined && body.data !== null) {
        return body.data;
      }

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
