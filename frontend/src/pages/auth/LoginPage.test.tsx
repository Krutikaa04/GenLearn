import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../../api/auth.api', () => ({
  authApi: { login: vi.fn() },
}));

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

const mockSetAuth = vi.fn();

function wrapper({ children }: any) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

beforeEach(() => {
  vi.clearAllMocks();
  (useAuthStore as any).mockImplementation((sel: any) => sel({ setAuth: mockSetAuth }));
});

describe('LoginPage', () => {
  it('renders email and password inputs', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders Sign in button', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('has link to register page', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByRole('link', { name: 'Create one free' })).toBeInTheDocument();
  });

  it('has link to forgot password', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'not-an-email' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows validation error for empty password', async () => {
    render(<LoginPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'test@test.com' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Password required')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('calls authApi.login and navigates on success', async () => {
    const mockUser = { userId: 'u1', firstName: 'Alice', email: 'alice@test.com', role: 'student' };
    (authApi.login as any).mockResolvedValue({ data: { data: { user: mockUser, accessToken: 'tok-abc' } } });
    render(<LoginPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'alice@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({ email: 'alice@test.com', password: 'password123' });
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, 'tok-abc');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows toast error on login failure', async () => {
    (authApi.login as any).mockRejectedValue({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });
    render(<LoginPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'x@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows generic error toast when error message is missing', async () => {
    (authApi.login as any).mockRejectedValue(new Error('Network error'));
    render(<LoginPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'x@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'somepass' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed');
    });
  });
});
