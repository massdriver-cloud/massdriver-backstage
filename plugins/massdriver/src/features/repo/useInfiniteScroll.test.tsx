import { act, renderHook } from '@testing-library/react';
import { useInfiniteScroll } from './useInfiniteScroll';

type IntersectCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

const observers: MockIntersectionObserver[] = [];
const lastObserver = () => observers[observers.length - 1] ?? null;

class MockIntersectionObserver {
  callback: IntersectCallback;
  observe = jest.fn();
  disconnect = jest.fn();
  constructor(callback: IntersectCallback) {
    this.callback = callback;
    observers.push(this);
  }
  takeRecords() {
    return [];
  }
  unobserve() {}
}

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    observers.length = 0;
    (global as any).IntersectionObserver = MockIntersectionObserver;
  });

  it('fires onLoadMore when the sentinel intersects', () => {
    const onLoadMore = jest.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({ onLoadMore, hasMore: true, loading: false }),
    );

    act(() => result.current(document.createElement('div')));
    expect(lastObserver()?.observe).toHaveBeenCalled();

    act(() => lastObserver()?.callback([{ isIntersecting: true }]));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not observe the sentinel while loading, then wires up once idle', () => {
    const onLoadMore = jest.fn();
    const { result, rerender } = renderHook(
      ({ hasMore, loading }) =>
        useInfiniteScroll({ onLoadMore, hasMore, loading }),
      { initialProps: { hasMore: true, loading: true } },
    );

    act(() => result.current(document.createElement('div')));
    expect(lastObserver()).toBeNull();

    rerender({ hasMore: true, loading: false });
    expect(lastObserver()?.observe).toHaveBeenCalled();
  });
});
