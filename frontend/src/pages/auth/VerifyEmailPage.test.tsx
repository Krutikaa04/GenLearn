import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VerifyEmailPage } from './VerifyEmailPage';

vi.mock('../../api/auth.api', () => ({
  authApi: {
    verifyEmail: vi.fn(),
  },
}));

import { authApi } from '../../api/auth.api';

function renderWithToken(token?: string) {
  const url = token ? `/verify-email?token=${encodeURIComponent(token)}` : '/verify-email';
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while the API call is in-flight', () => {
    (authApi.verifyEmail as any).mockReturnValue(new Promise(() => {}));
    renderWithToken('pending-token');
    expect(screen.getByText(/verifying/i)).toBeInTheDocument();
  });

  it('shows success state after successful verification', async () => {
    (authApi.verifyEmail as any).mockResolvedValue({});
    renderWithToken('valid-token');
    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });
  });

  it('shows a sign-in link after successful verification', async () => {
    (authApi.verifyEmail as any).mockResolvedValue({});
    renderWithToken('valid-token');
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('shows error state when the API call fails', async () => {
    (authApi.verifyEmail as any).mockRejectedValue({
      response: { data: { error: { message: 'Token expired' } } },
    });
    renderWithToken('expired-token');
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
  });

  it('shows the API error message in the error state', async () => {
    (authApi.verifyEmail as any).mockRejectedValue({
      response: { data: { error: { message: 'Token has already been used' } } },
    });
    renderWithToken('used-token');
    await waitFor(() => {
      expect(screen.getByText(/token has already been used/i)).toBeInTheDocument();
    });
  });

  it('shows error state when no token is present in the URL', async () => {
    renderWithToken();
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/missing verification token/i)).toBeInTheDocument();
  });

  it('does not call the API when no token is provided', async () => {
    renderWithToken();
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
    expect(authApi.verifyEmail).not.toHaveBeenCalled();
  });
});
