import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../../api/auth.api', () => ({
  authApi: { register: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { authApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

function wrapper({ children }: any) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegisterPage', () => {
  it('renders all form fields', () => {
    render(<RegisterPage />, { wrapper });
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders Create free account button', () => {
    render(<RegisterPage />, { wrapper });
    expect(screen.getByRole('button', { name: 'Create free account' })).toBeInTheDocument();
  });

  it('has link to login page', () => {
    render(<RegisterPage />, { wrapper });
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows required validation for empty first name', async () => {
    render(<RegisterPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'x@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }));
    const errors = await screen.findAllByText('Required');
    expect(errors.length).toBeGreaterThan(0);
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email', async () => {
    render(<RegisterPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('First name'), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'notanemail' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }));
    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    render(<RegisterPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('First name'), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'alice@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }));
    expect(await screen.findByText('Minimum 8 characters')).toBeInTheDocument();
  });

  it('calls authApi.register and navigates to login on success', async () => {
    (authApi.register as any).mockResolvedValue({ data: {} });
    render(<RegisterPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('First name'), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'alice@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }));
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@test.com',
        password: 'password123',
        role: 'student',
      });
      expect(toast.success).toHaveBeenCalledWith('Account created! Please sign in.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('registers as a teacher when the Teacher role is selected', async () => {
    (authApi.register as any).mockResolvedValue({ data: {} });
    render(<RegisterPage />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /Teacher/ }));
    fireEvent.input(screen.getByLabelText('First name'), { target: { value: 'Priya' } });
    fireEvent.input(screen.getByLabelText('Last name'), { target: { value: 'Shah' } });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'priya@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }));
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({ role: 'teacher' }));
    });
  });

  it('shows toast error on registration failure', async () => {
    (authApi.register as any).mockRejectedValue({
      response: { data: { error: { message: 'Email already registered' } } },
    });
    render(<RegisterPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('First name'), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'alice@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already registered');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows generic error when no response message', async () => {
    (authApi.register as any).mockRejectedValue(new Error('Network'));
    render(<RegisterPage />, { wrapper });
    fireEvent.input(screen.getByLabelText('First name'), { target: { value: 'Alice' } });
    fireEvent.input(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.input(screen.getByLabelText('Email address'), { target: { value: 'alice@test.com' } });
    fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Registration failed');
    });
  });
});
