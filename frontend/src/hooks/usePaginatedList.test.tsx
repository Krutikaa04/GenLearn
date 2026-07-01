import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePaginatedList } from './usePaginatedList';

function wrapper({ children }: any) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('usePaginatedList', () => {
  it('loads the first page on mount', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: ['a', 'b'], total: 5 });
    const { result } = renderHook(() => usePaginatedList(['test'], fetchPage, { pageSize: 2 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual(['a', 'b']);
    expect(result.current.total).toBe(5);
    expect(fetchPage).toHaveBeenCalledWith(1, 2);
  });

  it('reports hasNextPage when more items remain', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: ['a', 'b'], total: 5 });
    const { result } = renderHook(() => usePaginatedList(['test'], fetchPage, { pageSize: 2 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasNextPage).toBe(true);
  });

  it('reports no next page once all items are loaded', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: ['a', 'b'], total: 2 });
    const { result } = renderHook(() => usePaginatedList(['test'], fetchPage, { pageSize: 2 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('fetches and appends the next page when fetchNextPage is called', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ items: ['a', 'b'], total: 4 })
      .mockResolvedValueOnce({ items: ['c', 'd'], total: 4 });
    const { result } = renderHook(() => usePaginatedList(['test'], fetchPage, { pageSize: 2 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual(['a', 'b']);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.items).toEqual(['a', 'b', 'c', 'd']));
    expect(fetchPage).toHaveBeenLastCalledWith(2, 2);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('does not fetch when enabled is false', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: ['a'], total: 1 });
    renderHook(() => usePaginatedList(['test'], fetchPage, { pageSize: 2, enabled: false }), { wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
