import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ResetPasswordPage } from './ResetPasswordPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api/auth.api', () => ({
  authApi: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { authApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

function renderWithToken(token?: string) {
  const url = token ? `/reset-password?token=${token}` : '/reset-password';
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Invalid reset link" when no token is in the URL', () => {
    renderWithToken();
    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
  });

  it('shows the form when a token is present', () => {
    renderWithToken('valid-token');
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows a validation error when password is too short', async () => {
    renderWithToken('tok');
    const [newPass] = screen.getAllByPlaceholderText(/at least 8 characters/i);
    fireEvent.input(newPass, { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("shows a mismatch error when passwords don't match", async () => {
    renderWithToken('tok');
    const inputs = screen.getAllByPlaceholderText(/characters|password/i);
    fireEvent.input(inputs[0], { target: { value: 'password123' } });
    fireEvent.input(inputs[1], { target: { value: 'different99' } });
    fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText(/don't match/i)).toBeInTheDocument();
    });
  });

  it('calls authApi.resetPassword with token and new password', async () => {
    (authApi.resetPassword as any).mockResolvedValue({});
    renderWithToken('abc123');
    const inputs = screen.getAllByDisplayValue('');
    fireEvent.input(inputs[0], { target: { value: 'newpassword1' } });
    fireEvent.input(inputs[1], { target: { value: 'newpassword1' } });
    fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith('abc123', 'newpassword1');
    });
  });

  it('navigates to /login on successful reset', async () => {
    (authApi.resetPassword as any).mockResolvedValue({});
    renderWithToken('tok123');
    const inputs = screen.getAllByDisplayValue('');
    fireEvent.input(inputs[0], { target: { value: 'password99!' } });
    fireEvent.input(inputs[1], { target: { value: 'password99!' } });
    fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows a toast error when the API call fails', async () => {
    (authApi.resetPassword as any).mockRejectedValue(new Error('Link expired'));
    renderWithToken('expired-tok');
    const inputs = screen.getAllByDisplayValue('');
    fireEvent.input(inputs[0], { target: { value: 'password99!' } });
    fireEvent.input(inputs[1], { target: { value: 'password99!' } });
    fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect((toast as any).error).toHaveBeenCalled();
    });
  });
});
