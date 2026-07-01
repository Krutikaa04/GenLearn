import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConfirmEmailChangePage } from './ConfirmEmailChangePage';

vi.mock('../../api/auth.api', () => ({
  authApi: {
    confirmEmailChange: vi.fn(),
  },
}));

import { authApi } from '../../api/auth.api';

function renderWithToken(token?: string) {
  const url = token ? `/confirm-email-change?token=${encodeURIComponent(token)}` : '/confirm-email-change';
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/confirm-email-change" element={<ConfirmEmailChangePage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/profile" element={<div>Profile Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConfirmEmailChangePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while the API call is in-flight', () => {
    (authApi.confirmEmailChange as any).mockReturnValue(new Promise(() => {}));
    renderWithToken('pending-token');
    expect(screen.getByText(/confirming/i)).toBeInTheDocument();
  });

  it('shows success state after successful confirmation', async () => {
    (authApi.confirmEmailChange as any).mockResolvedValue({});
    renderWithToken('valid-token');
    await waitFor(() => {
      expect(screen.getByText(/email updated/i)).toBeInTheDocument();
    });
  });

  it('shows a sign-in link after successful confirmation', async () => {
    (authApi.confirmEmailChange as any).mockResolvedValue({});
    renderWithToken('valid-token');
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('shows error state when the API call fails', async () => {
    (authApi.confirmEmailChange as any).mockRejectedValue({
      response: { data: { error: { message: 'Confirmation link is invalid or has already been used' } } },
    });
    renderWithToken('expired-token');
    await waitFor(() => {
      expect(screen.getByText(/confirmation failed/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid or has already been used/i)).toBeInTheDocument();
    });
  });

  it('shows error state when no token is present in the URL', async () => {
    renderWithToken();
    await waitFor(() => {
      expect(screen.getByText(/confirmation failed/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/missing confirmation token/i)).toBeInTheDocument();
    expect(authApi.confirmEmailChange).not.toHaveBeenCalled();
  });

  it('links back to the profile page on error', async () => {
    renderWithToken();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to profile/i })).toBeInTheDocument();
    });
  });
});
