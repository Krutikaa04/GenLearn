import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';

vi.mock('../../api/auth.api', () => ({
  authApi: {
    forgotPassword: vi.fn(),
  },
}));

import { authApi } from '../../api/auth.api';

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email form initially', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email', async () => {
    renderPage();
    fireEvent.input(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'not-an-email' } });
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('calls authApi.forgotPassword with the submitted email', async () => {
    (authApi.forgotPassword as any).mockResolvedValue({});
    renderPage();
    fireEvent.input(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'user@test.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith('user@test.com');
    });
  });

  it('shows the success state after submission even when the API call fails', async () => {
    (authApi.forgotPassword as any).mockRejectedValue(new Error('Not found'));
    renderPage();
    fireEvent.input(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'unknown@test.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it('does not leak whether the email exists (no error message on API failure)', async () => {
    (authApi.forgotPassword as any).mockRejectedValue(new Error('User not found'));
    renderPage();
    fireEvent.input(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'noone@test.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('shows the success message with a back-to-sign-in link', async () => {
    (authApi.forgotPassword as any).mockResolvedValue({});
    renderPage();
    fireEvent.input(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'user@test.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
    });
  });
});
