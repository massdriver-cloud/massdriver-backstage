import { useEffect, useState } from 'react';

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
