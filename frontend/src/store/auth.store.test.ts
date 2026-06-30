import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';

const mockUser = {
  userId: 'u1',
  email: 'test@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  role: 'student',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it('starts with null user and no token', () => {
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it('setAuth stores user and token', () => {
    useAuthStore.getState().setAuth(mockUser, 'tok-123');
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(accessToken).toBe('tok-123');
  });

  it('setAccessToken updates only the token', () => {
    useAuthStore.getState().setAuth(mockUser, 'old-tok');
    useAuthStore.getState().setAccessToken('new-tok');
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(accessToken).toBe('new-tok');
  });

  it('logout clears user and token', () => {
    useAuthStore.getState().setAuth(mockUser, 'tok-123');
    useAuthStore.getState().logout();
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });
});
