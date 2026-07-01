import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { useAuthStore } from '../../store/auth.store';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../lib/axios', () => {
  const api: any = vi.fn();
  api.get = vi.fn();
  api.patch = vi.fn();
  return { default: api };
});

import api from '../../lib/axios';
import toast from 'react-hot-toast';

const mockUser = {
  userId: 'u1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'student',
};

const mockProfile = {
  ...mockUser,
  profile: {
    grade: 'MCA 2nd',
    preferredDifficulty: 'intermediate',
    learningGoals: ['Pass exam'],
    interests: ['Math'],
  },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, accessToken: 'tok' });
    (api.get as any).mockResolvedValue({ data: { data: mockProfile } });
    (api.patch as any).mockResolvedValue({ data: { data: mockProfile } });
  });

  it('shows a loading state initially', () => {
    (api.get as any).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('populates the form fields from the fetched profile', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MCA 2nd')).toBeInTheDocument();
    });
  });

  it('renders existing learning goals as chips', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Pass exam')).toBeInTheDocument();
    });
  });

  it('renders existing interests as badges', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument();
    });
  });

  it('adds a new goal on Enter key press (plus button path)', async () => {
    renderPage();
    await waitFor(() => screen.getByPlaceholderText(/add a goal/i));
    const goalInput = screen.getByPlaceholderText(/add a goal/i);
    fireEvent.change(goalInput, { target: { value: 'Learn React' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Learn React')).toBeInTheDocument();
    });
  });

  it('adds a new goal on Enter key press', async () => {
    renderPage();
    await waitFor(() => screen.getByPlaceholderText(/add a goal/i));
    const goalInput = screen.getByPlaceholderText(/add a goal/i);
    fireEvent.change(goalInput, { target: { value: 'Learn TypeScript' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Learn TypeScript')).toBeInTheDocument();
    });
  });

  it('does not add a duplicate goal', async () => {
    renderPage();
    await waitFor(() => screen.getByPlaceholderText(/add a goal/i));
    const goalInput = screen.getByPlaceholderText(/add a goal/i);
    fireEvent.change(goalInput, { target: { value: 'Pass exam' } });
    fireEvent.keyDown(goalInput, { key: 'Enter' });
    await waitFor(() => {
      const chips = screen.getAllByText('Pass exam');
      expect(chips).toHaveLength(1);
    });
  });

  it('shows a validation error for a first name that is too short', async () => {
    renderPage();
    await waitFor(() => screen.getByDisplayValue('Alice'));
    const firstNameInput = screen.getByDisplayValue('Alice');
    fireEvent.change(firstNameInput, { target: { value: 'A' } });
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('calls api.patch with form data and goals/interests on submit', async () => {
    renderPage();
    await waitFor(() => screen.getByDisplayValue('Alice'));
    const firstNameInput = screen.getByDisplayValue('Alice');
    fireEvent.change(firstNameInput, { target: { value: 'Alicia' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    });
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/auth/me',
        expect.objectContaining({
          firstName: 'Alicia',
          learningGoals: expect.any(Array),
          interests: expect.any(Array),
        }),
      );
    });
  });

  it('shows a success toast after a successful save', async () => {
    renderPage();
    await waitFor(() => screen.getByDisplayValue('Alice'));
    fireEvent.change(screen.getByDisplayValue('Alice'), { target: { value: 'Alicia' } });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /save changes/i }));
    });
    await waitFor(() => {
      expect((toast as any).success).toHaveBeenCalledWith('Profile updated');
    });
  });

  it('shows the user email and role in the identity card', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('student')).toBeInTheDocument();
    });
  });
});
