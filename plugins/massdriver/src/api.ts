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
 * Subscription errors carry `fatal: true` when retrying cannot succeed — a 4xx
 * from the relay (unauthenticated/invalid request) or an upstream Absinthe
 * channel rejection (bad document / unknown environment). The reconnect loop in
 * `useMassdriverSubscription` stops on fatal errors instead of retrying forever.
 *
 * @public
 */
export type MassdriverSubscriptionError = Error & {
  fatal?: boolean;
  status?: number;
};

/**
 * Flattened presence snapshot streamed by the backend presence relay: one
 * entry per account currently viewing the environment in the web app, carrying
 * the platform's presence meta (snake_case, as built by EnvironmentChannel).
 *
 * @public
 */
export type MassdriverPresenceViewers = Record<
  string,
  {
    id?: string;
    first_name?: string;
    email?: string;
    avatar?: { url?: string } | null;
    cursor?: {
      x: number | null;
      y: number | null;
      package_identifier?: string | null;
      updated_at?: number;
    } | null;
    joined_at?: number;
    _metasCount?: number;
  }
>;

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
  /**
   * Open a GraphQL subscription via the backend SSE relay. Invokes
   * `handlers.onData` with each streamed result's `data`. The returned promise
   * resolves when the stream ends (server close, error, or abort). Pass a
   * `signal` to tear the subscription down.
   */
  subscribe<T = unknown>(
    query: string,
    variables: Record<string, unknown> | undefined,
    handlers: { onData: (data: T) => void; onError?: (error: Error) => void },
    signal?: AbortSignal,
  ): Promise<void>;
  /**
   * Stream the environment's live presence (who's viewing, cursor positions)
   * via the backend spectator relay. Invokes `handlers.onData` with the full
   * flattened viewers snapshot on every change. Read-only — the Backstage
   * viewer is never broadcast to web-app users.
   */
  subscribePresence(
    environmentId: string,
    handlers: {
      onData: (viewers: MassdriverPresenceViewers) => void;
      onError?: (error: Error) => void;
    },
    signal?: AbortSignal,
  ): Promise<void>;
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
      options.configApi.getOptionalString(`${MASSDRIVER_CONFIG_KEY}.appUrl`) ??
      DEFAULT_APP_URL;
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

  async subscribe<T = unknown>(
    query: string,
    variables: Record<string, unknown> | undefined,
    handlers: { onData: (data: T) => void; onError?: (error: Error) => void },
    signal?: AbortSignal,
  ): Promise<void> {
    return this.streamSse(
      'plugin://massdriver/subscribe',
      { query, variables },
      handlers,
      signal,
    );
  }

  async subscribePresence(
    environmentId: string,
    handlers: {
      onData: (viewers: MassdriverPresenceViewers) => void;
      onError?: (error: Error) => void;
    },
    signal?: AbortSignal,
  ): Promise<void> {
    return this.streamSse<{ viewers: MassdriverPresenceViewers }>(
      'plugin://massdriver/presence',
      { environmentId },
      {
        onData: payload => handlers.onData(payload?.viewers ?? {}),
        onError: handlers.onError,
      },
      signal,
    );
  }

  private async streamSse<T = unknown>(
    url: string,
    body: Record<string, unknown>,
    handlers: { onData: (data: T) => void; onError?: (error: Error) => void },
    signal?: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await this.fetchApi.fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      // A fetch abort is an intentional teardown, not an error.
      if (signal?.aborted) return;
      handlers.onError?.(error as Error);
      return;
    }

    if (!response.ok || !response.body) {
      // 4xx (except 429) won't heal on retry — flag fatal so the reconnect
      // loop stops instead of hammering the relay.
      const requestFailed: MassdriverSubscriptionError = Object.assign(
        new Error(
          `Massdriver subscription failed: ${response.status} ${response.statusText}`,
        ),
        {
          status: response.status,
          fatal:
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429,
        },
      );
      handlers.onError?.(requestFailed);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const handleFrame = (frame: string) => {
      let eventName: string | null = null;
      const dataLines: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith(':')) continue; // keepalive comment
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) return;

      const payload = JSON.parse(dataLines.join('\n'));
      if (eventName === 'error') {
        const streamError: MassdriverSubscriptionError = Object.assign(
          new Error(payload?.message ?? 'Subscription error'),
          { fatal: Boolean(payload?.fatal) },
        );
        handlers.onError?.(streamError);
        return;
      }
      handlers.onData(payload as T);
    };

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE frames are separated by a blank line.
        let index = buffer.indexOf('\n\n');
        while (index !== -1) {
          const frame = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          if (frame.trim()) handleFrame(frame);
          index = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (!signal?.aborted) handlers.onError?.(error as Error);
    } finally {
      reader.cancel().catch(() => {});
    }
  }
}
