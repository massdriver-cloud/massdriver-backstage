import { useEffect, useState } from 'react';

// Ported from the Massdriver web app. Returns a ref-setter;
// attach it to a 1px sentinel at the bottom of a scrollable list and it fires
// `onLoadMore` when the sentinel scrolls into view.
export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  loading,
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}) => {
  const [sentinel, setSentinel] = useState<Element | null>(null);

  useEffect(() => {
    if (!sentinel || !hasMore || loading) return undefined;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) onLoadMore();
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, loading, onLoadMore]);

  return setSentinel;
};

export default useInfiniteScroll;
