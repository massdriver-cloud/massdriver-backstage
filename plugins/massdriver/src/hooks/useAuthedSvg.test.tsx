import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../api';
import { useAuthedSvg } from './useAuthedSvg';

const createMockApi = (): jest.Mocked<MassdriverApi> =>
  ({
    appUrl: 'https://app.massdriver.cloud',
    organizationId: 'org-1',
    query: jest.fn(),
    fetchText: jest.fn(),
    subscribe: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<MassdriverApi>);

const createWrapper =
  (api: MassdriverApi) =>
  ({ children }: { children: ReactNode }) =>
    (
      <TestApiProvider apis={[[massdriverApiRef, api]]}>
        {children}
      </TestApiProvider>
    );

describe('useAuthedSvg', () => {
  it('returns null without fetching when no url is given', () => {
    const api = createMockApi();
    const { result } = renderHook(() => useAuthedSvg(null), {
      wrapper: createWrapper(api),
    });

    expect(result.current).toEqual({ svg: null, loading: false });
    expect(api.fetchText).not.toHaveBeenCalled();
  });

  it('fetches the svg text through the content proxy', async () => {
    const api = createMockApi();
    api.fetchText.mockResolvedValue('<svg>icon</svg>');

    const { result } = renderHook(
      () => useAuthedSvg('https://api.massdriver.cloud/icon.svg'),
      { wrapper: createWrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.svg).toBe('<svg>icon</svg>');
    expect(api.fetchText).toHaveBeenCalledWith(
      'https://api.massdriver.cloud/icon.svg',
    );
  });

  it('degrades to null when the fetch fails', async () => {
    const api = createMockApi();
    api.fetchText.mockRejectedValue(new Error('403'));

    const { result } = renderHook(
      () => useAuthedSvg('https://api.massdriver.cloud/icon.svg'),
      { wrapper: createWrapper(api) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.svg).toBeNull();
  });
});
