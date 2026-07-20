import {
  ConfigApi,
  createApiRef,
  FetchApi,
} from '@backstage/frontend-plugin-api';
import {
  DEFAULT_APP_URL,
  MASSDRIVER_CONFIG_KEY,
} from '@massdriver/backstage-plugin-common';

/** @public */
export type MassdriverSubscriptionError = Error & {
  fatal?: boolean;
  status?: number;
};

/** @public */
export interface MassdriverApi {
  readonly appUrl: string;
  readonly organizationId: string;
  query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T>;
  fetchText(url: string): Promise<string>;
  subscribe<T = unknown>(
    query: string,
    variables: Record<string, unknown> | undefined,
    handlers: { onData: (data: T) => void; onError?: (error: Error) => void },
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

  async fetchText(url: string): Promise<string> {
    const response = await this.fetchApi.fetch(
      `plugin://massdriver/content?url=${encodeURIComponent(url)}`,
    );
    if (!response.ok) {
      throw new Error(
        `Massdriver content fetch failed: ${response.status} ${response.statusText}`,
      );
    }
    return response.text();
  }

  async subscribe<T = unknown>(
    query: string,
    variables: Record<string, unknown> | undefined,
    handlers: { onData: (data: T) => void; onError?: (error: Error) => void },
    signal?: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await this.fetchApi.fetch('plugin://massdriver/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal,
      });
    } catch (error) {
      if (signal?.aborted) return;
      handlers.onError?.(error as Error);
      return;
    }

    if (!response.ok || !response.body) {
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
        if (line.startsWith(':')) continue;
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
