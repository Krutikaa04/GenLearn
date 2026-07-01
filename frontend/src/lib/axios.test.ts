import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../store/auth.store', () => ({
  useAuthStore: { getState: () => ({ accessToken: null, setAccessToken: vi.fn(), logout: vi.fn() }) },
}));

import toast from 'react-hot-toast';
import api from './axios';

// axios exposes registered interceptors via this internal-but-stable array,
// letting us exercise the rejection handler without a real HTTP mocking library.
function getResponseErrorHandler() {
  const handlers = (api.interceptors.response as any).handlers;
  return handlers[handlers.length - 1].rejected;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('axios response interceptor — 429 handling', () => {
  it('shows a friendly toast with countdown when Retry-After header is present', async () => {
    const rejected = getResponseErrorHandler();
    const err = { response: { status: 429, headers: { 'retry-after': '30' } }, config: {} };
    await expect(rejected(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith('Too many attempts — try again in 30s', { id: 'rate-limit-429' });
  });

  it('shows a generic friendly toast when no Retry-After header is present', async () => {
    const rejected = getResponseErrorHandler();
    const err = { response: { status: 429, headers: {} }, config: {} };
    await expect(rejected(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledWith(
      'Too many attempts — please wait a moment and try again',
      { id: 'rate-limit-429' },
    );
  });

  it('does not show the rate-limit toast for non-429 errors', async () => {
    const rejected = getResponseErrorHandler();
    const err = { response: { status: 500, headers: {} }, config: {} };
    await expect(rejected(err)).rejects.toBe(err);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('uses a fixed toast id so repeated 429s do not stack', async () => {
    const rejected = getResponseErrorHandler();
    const err = { response: { status: 429, headers: {} }, config: {} };
    await expect(rejected(err)).rejects.toBe(err);
    await expect(rejected(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledTimes(2);
    expect((toast.error as any).mock.calls[0][1]).toEqual({ id: 'rate-limit-429' });
    expect((toast.error as any).mock.calls[1][1]).toEqual({ id: 'rate-limit-429' });
  });
});
