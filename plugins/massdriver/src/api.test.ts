import { ConfigApi, FetchApi } from '@backstage/frontend-plugin-api';
import { MassdriverClientApi } from './api';

const encoder = new TextEncoder();

// Build a Response-like object whose `body.getReader()` streams the given
// string chunks (each encoded to a Uint8Array), mirroring what the SSE parser
// in `subscribe` reads off the fetch response.
const streamResponse = (
  chunks: string[],
  {
    ok = true,
    status = 200,
    statusText = 'OK',
    hasBody = true,
  }: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    hasBody?: boolean;
  } = {},
) => {
  let index = 0;
  const cancel = jest.fn().mockResolvedValue(undefined);
  const body = {
    getReader: () => ({
      read: async () => {
        if (index < chunks.length) {
          const value = encoder.encode(chunks[index]);
          index += 1;
          return { done: false, value };
        }
        return { done: true, value: undefined };
      },
      cancel,
    }),
  };
  return { ok, status, statusText, body: hasBody ? body : null, cancel };
};

const createConfigApi = (
  values: Record<string, string | undefined> = {},
): jest.Mocked<Pick<ConfigApi, 'getOptionalString'>> => ({
  getOptionalString: jest.fn((key: string) => values[key]),
});

const createFetchApi = (): jest.Mocked<FetchApi> =>
  ({ fetch: jest.fn() } as unknown as jest.Mocked<FetchApi>);

describe('MassdriverClientApi', () => {
  describe('constructor', () => {
    it('reads appUrl and organizationId from config', () => {
      const configApi = createConfigApi({
        'massdriver.appUrl': 'https://app.example.test',
        'massdriver.organizationId': 'org-42',
      });
      const api = new MassdriverClientApi({
        fetchApi: createFetchApi(),
        configApi: configApi as unknown as ConfigApi,
      });

      expect(api.appUrl).toBe('https://app.example.test');
      expect(api.organizationId).toBe('org-42');
    });

    it('falls back to defaults when config is absent', () => {
      const api = new MassdriverClientApi({
        fetchApi: createFetchApi(),
        configApi: createConfigApi() as unknown as ConfigApi,
      });

      expect(api.appUrl).toBe('https://app.massdriver.cloud');
      expect(api.organizationId).toBe('');
    });
  });

  describe('query', () => {
    const buildApi = () => {
      const fetchApi = createFetchApi();
      const api = new MassdriverClientApi({
        fetchApi,
        configApi: createConfigApi() as unknown as ConfigApi,
      });
      return { api, fetchApi };
    };

    it('POSTs the query and variables as JSON to the relay endpoint', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { me: { id: '1' } } }),
      } as unknown as Response);

      const result = await api.query('query Q { me { id } }', { foo: 'bar' });

      expect(result).toEqual({ me: { id: '1' } });
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'plugin://massdriver/graphql',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: 'query Q { me { id } }',
            variables: { foo: 'bar' },
          }),
        },
      );
    });

    it('throws with the status when the response is not ok', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as unknown as Response);

      await expect(api.query('query Q { me { id } }')).rejects.toThrow(
        'Massdriver request failed: 503 Service Unavailable',
      );
    });

    it('throws joined error messages when the body carries GraphQL errors', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: 'bad field' }, { message: 'nope' }],
        }),
      } as unknown as Response);

      await expect(api.query('query Q { me { id } }')).rejects.toThrow(
        'bad field; nope',
      );
    });

    it('returns body.data on success', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { thing: 42 } }),
      } as unknown as Response);

      await expect(api.query('query Q { thing }')).resolves.toEqual({
        thing: 42,
      });
    });
  });

  describe('fetchText', () => {
    const buildApi = () => {
      const fetchApi = createFetchApi();
      const api = new MassdriverClientApi({
        fetchApi,
        configApi: createConfigApi() as unknown as ConfigApi,
      });
      return { api, fetchApi };
    };

    it('GETs the content proxy with the target url encoded', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue({
        ok: true,
        text: async () => '<svg/>',
      } as unknown as Response);

      const result = await api.fetchText('https://api.massdriver.cloud/a b');

      expect(result).toBe('<svg/>');
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        `plugin://massdriver/content?url=${encodeURIComponent(
          'https://api.massdriver.cloud/a b',
        )}`,
      );
    });

    it('throws with the status when the response is not ok', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      await expect(api.fetchText('https://api.massdriver.cloud/x')).rejects.toThrow(
        'Massdriver content fetch failed: 404 Not Found',
      );
    });
  });

  describe('subscribe (SSE parsing)', () => {
    const buildApi = () => {
      const fetchApi = createFetchApi();
      const api = new MassdriverClientApi({
        fetchApi,
        configApi: createConfigApi() as unknown as ConfigApi,
      });
      return { api, fetchApi };
    };

    it('parses a single data frame and invokes onData with the JSON payload', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue(
        streamResponse(['data: {"hello":"world"}\n\n']) as unknown as Response,
      );
      const onData = jest.fn();

      await api.subscribe('subscription S { x }', undefined, { onData });

      expect(onData).toHaveBeenCalledTimes(1);
      expect(onData).toHaveBeenCalledWith({ hello: 'world' });
    });

    it('parses multiple frames delivered in one chunk', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue(
        streamResponse([
          'data: {"n":1}\n\ndata: {"n":2}\n\n',
        ]) as unknown as Response,
      );
      const onData = jest.fn();

      await api.subscribe('subscription S { x }', undefined, { onData });

      expect(onData).toHaveBeenNthCalledWith(1, { n: 1 });
      expect(onData).toHaveBeenNthCalledWith(2, { n: 2 });
    });

    it('reassembles a single frame split across chunks', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue(
        streamResponse(['data: {"n', '":1}\n\n']) as unknown as Response,
      );
      const onData = jest.fn();

      await api.subscribe('subscription S { x }', undefined, { onData });

      expect(onData).toHaveBeenCalledTimes(1);
      expect(onData).toHaveBeenCalledWith({ n: 1 });
    });

    it('ignores keepalive comment frames', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue(
        streamResponse([
          ': ping\n\n',
          'data: {"n":1}\n\n',
        ]) as unknown as Response,
      );
      const onData = jest.fn();

      await api.subscribe('subscription S { x }', undefined, { onData });

      expect(onData).toHaveBeenCalledTimes(1);
      expect(onData).toHaveBeenCalledWith({ n: 1 });
    });

    it('routes an event:error frame to onError and never calls onData', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue(
        streamResponse([
          'event: error\ndata: {"message":"boom"}\n\n',
        ]) as unknown as Response,
      );
      const onData = jest.fn();
      const onError = jest.fn();

      await api.subscribe('subscription S { x }', undefined, {
        onData,
        onError,
      });

      expect(onData).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].message).toBe('boom');
    });

    it('resolves when the stream ends', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue(
        streamResponse(['data: {"n":1}\n\n']) as unknown as Response,
      );

      await expect(
        api.subscribe('subscription S { x }', undefined, { onData: jest.fn() }),
      ).resolves.toBeUndefined();
    });

    it('resolves silently without onError when fetch rejects on an aborted signal', async () => {
      const { api, fetchApi } = buildApi();
      const controller = new AbortController();
      controller.abort();
      fetchApi.fetch.mockRejectedValue(new Error('aborted'));
      const onError = jest.fn();

      await expect(
        api.subscribe(
          'subscription S { x }',
          undefined,
          { onData: jest.fn(), onError },
          controller.signal,
        ),
      ).resolves.toBeUndefined();
      expect(onError).not.toHaveBeenCalled();
    });

    it('calls onError when fetch rejects without an abort', async () => {
      const { api, fetchApi } = buildApi();
      const networkError = new Error('network down');
      fetchApi.fetch.mockRejectedValue(networkError);
      const onError = jest.fn();

      await api.subscribe('subscription S { x }', undefined, {
        onData: jest.fn(),
        onError,
      });

      expect(onError).toHaveBeenCalledWith(networkError);
    });

    it('calls onError when the response is not ok', async () => {
      const { api, fetchApi } = buildApi();
      fetchApi.fetch.mockResolvedValue(
        streamResponse([], {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        }) as unknown as Response,
      );
      const onError = jest.fn();

      await api.subscribe('subscription S { x }', undefined, {
        onData: jest.fn(),
        onError,
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].message).toBe(
        'Massdriver subscription failed: 500 Internal Server Error',
      );
    });
  });
});
