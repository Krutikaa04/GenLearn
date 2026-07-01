import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './AppLayout';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../api/auth.api', () => ({
  authApi: { logout: vi.fn() },
}));

vi.mock('../../api/flashcards.api', () => ({
  flashcardsApi: { getDue: vi.fn() },
}));

import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { flashcardsApi } from '../../api/flashcards.api';

const mockLogout = vi.fn();

const studentUser = {
  userId: 'u1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@test.com',
  role: 'student',
};

const adminUser = { ...studentUser, role: 'admin' };

function mockStore(user = studentUser) {
  // AppLayout uses useAuthStore() without selector — return the store object
  (useAuthStore as any).mockReturnValue({ user, logout: mockLogout, accessToken: 'tok' });
}

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (flashcardsApi.getDue as any).mockResolvedValue({ data: { data: [] } });
  mockStore();
});

// AppLayout renders both a desktop sidebar and a mobile drawer simultaneously.
// Both share the same content (nav links, user info, etc.), so queries may return
// multiple matching elements — we use getAllBy* and check length >= 1.

describe('AppLayout — navigation', () => {
  it('renders GenLearn brand in sidebar', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    expect((await screen.findAllByText('GenLearn')).length).toBeGreaterThan(0);
  });

  it('renders core nav links (Dashboard, Documents, Lessons, Quizzes, Flashcards)', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    await screen.findAllByText('GenLearn');
    expect(screen.getAllByRole('link', { name: /Dashboard/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Documents/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Lessons/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Quizzes/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Flashcards/ }).length).toBeGreaterThan(0);
  });

  it('renders AI Tools nav links (AI Tutor, Study Plan)', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    await screen.findAllByText('GenLearn');
    expect(screen.getAllByRole('link', { name: /AI Tutor/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Study Plan/ }).length).toBeGreaterThan(0);
  });

  it('renders outlet content', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    expect(await screen.findByText('Dashboard Content')).toBeInTheDocument();
  });

  it('renders user name and email in sidebar footer', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    expect((await screen.findAllByText('Alice Smith')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('alice@test.com').length).toBeGreaterThan(0);
  });

  it('renders user initials in the avatar', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    expect((await screen.findAllByText('AS')).length).toBeGreaterThan(0);
  });

  it('renders Sign out button(s)', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    expect((await screen.findAllByRole('button', { name: /Sign out/ })).length).toBeGreaterThan(0);
  });

  it('does NOT show Platform Admin link for regular student', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    await screen.findAllByText('GenLearn');
    expect(screen.queryByRole('link', { name: /Platform Admin/ })).not.toBeInTheDocument();
  });

  it('shows Platform Admin link for admin user', async () => {
    mockStore(adminUser);
    render(<AppLayout />, { wrapper: wrapper() });
    expect((await screen.findAllByRole('link', { name: /Platform Admin/ })).length).toBeGreaterThan(0);
  });
});

describe('AppLayout — due cards badge', () => {
  it('does not show numeric badge when no cards are due', async () => {
    render(<AppLayout />, { wrapper: wrapper() });
    await screen.findAllByText('GenLearn');
    // No numeric badge should appear on the Flashcards link
    const flashcardsLinks = screen.getAllByRole('link', { name: /Flashcards/ });
    flashcardsLinks.forEach((link) => {
      expect(link.textContent?.match(/^\d+$/)).toBeFalsy();
    });
  });

  it('shows due count badge on Flashcards link when cards are due', async () => {
    (flashcardsApi.getDue as any).mockResolvedValue({
      data: { data: [{ cardId: 'c1' }, { cardId: 'c2' }, { cardId: 'c3' }] },
    });
    render(<AppLayout />, { wrapper: wrapper() });
    expect((await screen.findAllByText('3')).length).toBeGreaterThan(0);
  });
});

describe('AppLayout — logout', () => {
  it('calls authApi.logout, store logout, then navigates to /login', async () => {
    (authApi.logout as any).mockResolvedValue({});
    render(<AppLayout />, { wrapper: wrapper() });
    const signOutBtns = await screen.findAllByRole('button', { name: /Sign out/ });
    fireEvent.click(signOutBtns[0]);
    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('still calls store logout and navigates even if authApi.logout throws', async () => {
    (authApi.logout as any).mockRejectedValue(new Error('Network'));
    render(<AppLayout />, { wrapper: wrapper() });
    const signOutBtns = await screen.findAllByRole('button', { name: /Sign out/ });
    fireEvent.click(signOutBtns[0]);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
