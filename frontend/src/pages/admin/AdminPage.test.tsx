import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from './AdminPage';

vi.mock('../../api/admin.api', () => ({
  adminApi: {
    getStats: vi.fn(),
    listUsers: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { adminApi } from '../../api/admin.api';
import toast from 'react-hot-toast';

const mockStats = {
  users: { total: 120, active: 95, suspended: 10, unverified: 15 },
  learning: { averageMasteryScore: 68, totalQuizzesTaken: 5430 },
};

const mockUsers = [
  {
    userId: 'u1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@test.com',
    role: 'student',
    status: 'active',
    emailVerified: true,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    userId: 'u2',
    firstName: 'Bob',
    lastName: 'Jones',
    email: 'bob@test.com',
    role: 'student',
    status: 'suspended',
    emailVerified: false,
    createdAt: '2024-02-20T00:00:00Z',
  },
  {
    userId: 'u3',
    firstName: 'Carol',
    lastName: 'Admin',
    email: 'carol@test.com',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (adminApi.getStats as any).mockResolvedValue({ data: { data: mockStats } });
  (adminApi.listUsers as any).mockResolvedValue({ data: { data: mockUsers, total: 3 } });
});

describe('AdminPage', () => {
  it('renders page header', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Platform overview and user management')).toBeInTheDocument();
  });

  it('renders admin-only badge', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Admin only')).toBeInTheDocument();
  });

  it('displays platform stats', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('5,430')).toBeInTheDocument();
  });

  it('renders user table with user data', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    expect(screen.getByText('Carol Admin')).toBeInTheDocument();
  });

  it('shows Suspend button for active non-admin users', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    expect(screen.getByRole('button', { name: 'Suspend' })).toBeInTheDocument();
  });

  it('shows Activate button for suspended users', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Bob Jones');
    expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
  });

  it('hides action button for admin users', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Carol Admin');
    // Alice (active) → Suspend, Bob (suspended) → Activate, Carol (admin) → none
    // We verify no third action button exists in the table by checking exact matches
    const suspendBtns = screen.queryAllByRole('button', { name: 'Suspend' });
    const activateBtns = screen.queryAllByRole('button', { name: 'Activate' });
    expect(suspendBtns.length).toBe(1);
    expect(activateBtns.length).toBe(1);
  });

  it('calls updateUserStatus when Suspend clicked', async () => {
    (adminApi.updateUserStatus as any).mockResolvedValue({ data: {} });
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    await waitFor(() => {
      expect(adminApi.updateUserStatus).toHaveBeenCalledWith('u1', 'suspended');
    });
  });

  it('shows success toast after status update', async () => {
    (adminApi.updateUserStatus as any).mockResolvedValue({ data: {} });
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('User status updated');
    });
  });

  it('shows error toast when status update fails', async () => {
    (adminApi.updateUserStatus as any).mockRejectedValue({
      response: { data: { error: { message: 'Permission denied' } } },
    });
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Permission denied');
    });
  });

  it('filters users by search on Enter', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    const input = screen.getByPlaceholderText('Search by name or email…');
    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('shows no users message when filter matches nothing', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    const input = screen.getByPlaceholderText('Search by name or email…');
    fireEvent.change(input, { target: { value: 'zzz_nobody' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('No users match this filter')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching users', async () => {
    let resolve: any;
    (adminApi.listUsers as any).mockImplementation(
      () => new Promise((res) => { resolve = res; }),
    );
    render(<AdminPage />, { wrapper: wrapper() });
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
    resolve({ data: { data: [], total: 0 } });
  });

  it('status filter buttons shown', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suspended' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unverified' })).toBeInTheDocument();
  });

  it('calls listUsers with status when filter clicked', async () => {
    render(<AdminPage />, { wrapper: wrapper() });
    await screen.findByText('Alice Smith');
    fireEvent.click(screen.getByRole('button', { name: 'Active' }));
    await waitFor(() => {
      expect(adminApi.listUsers).toHaveBeenCalledWith(1, 20, 'active');
    });
  });
});
