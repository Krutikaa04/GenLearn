import { useInfiniteQuery } from '@tanstack/react-query';

interface Page<T> {
  items: T[];
  total: number;
}

/**
 * Wraps useInfiniteQuery for "Load more" style pagination against endpoints
 * that return a page of items plus a total count. Normalizes the differing
 * response shapes across list endpoints via the caller-supplied fetchPage.
 */
interface UsePaginatedListOptions<T> {
  pageSize?: number;
  refetchInterval?: (items: T[]) => number | false;
  enabled?: boolean;
}

export function usePaginatedList<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number, pageSize: number) => Promise<Page<T>>,
  options: UsePaginatedListOptions<T> = {},
) {
  const { pageSize = 20, refetchInterval, enabled } = options;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (_lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      const total = allPages[allPages.length - 1]?.total ?? 0;
      return loaded < total ? allPages.length + 1 : undefined;
    },
    refetchInterval: refetchInterval
      ? (query) => refetchInterval(query.state.data?.pages.flatMap((p) => p.items) ?? [])
      : undefined,
    enabled,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[query.data.pages.length - 1]?.total ?? 0;

  return {
    items,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
