import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { useAuthStore } from '../../store/auth.store';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../lib/axios', () => {
  const api: any = vi.fn();
  api.get = vi.fn();
  api.patch = vi.fn();
  return { default: api };
});

vi.mock('../../api/auth.api', () => ({
  authApi: { deleteAccount: vi.fn(), changeEmail: vi.fn() },
}));

import api from '../../lib/axios';
import { authApi } from '../../api/auth.api';
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

  describe('accessibility — label associations', () => {
    it('associates the Preferred difficulty label with its select via getByLabelText', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      expect(screen.getByLabelText('Preferred difficulty')).toBeInTheDocument();
    });

    it('associates the Learning goals label with its input via getByLabelText', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      expect(screen.getByLabelText('Learning goals')).toBeInTheDocument();
    });

    it('associates the Interests label with its input via getByLabelText', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      expect(screen.getByLabelText('Interests')).toBeInTheDocument();
    });
  });

  describe('account deletion', () => {
    it('renders a Danger zone section with a Delete account button', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      expect(screen.getByText('Danger zone')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete account' })).toBeInTheDocument();
    });

    it('opens the confirm modal when Delete account is clicked', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
      expect(await screen.findByText('Delete your account?')).toBeInTheDocument();
    });

    it('disables the confirm button until the email is typed exactly', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
      await screen.findByText('Delete your account?');
      const confirmBtns = screen.getAllByRole('button', { name: 'Delete account' });
      const modalConfirmBtn = confirmBtns[confirmBtns.length - 1];
      expect(modalConfirmBtn).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText('alice@example.com'), { target: { value: 'wrong@example.com' } });
      expect(modalConfirmBtn).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText('alice@example.com'), { target: { value: 'alice@example.com' } });
      expect(modalConfirmBtn).not.toBeDisabled();
    });

    it('calls authApi.deleteAccount, logs out, and navigates to /login on confirm', async () => {
      (authApi.deleteAccount as any).mockResolvedValue({});
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
      await screen.findByText('Delete your account?');
      fireEvent.change(screen.getByPlaceholderText('alice@example.com'), { target: { value: 'alice@example.com' } });
      const confirmBtns = screen.getAllByRole('button', { name: 'Delete account' });
      fireEvent.click(confirmBtns[confirmBtns.length - 1]);
      await waitFor(() => {
        expect(authApi.deleteAccount).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('shows an error toast when deletion fails', async () => {
      (authApi.deleteAccount as any).mockRejectedValue({
        response: { data: { error: { message: 'Server error' } } },
      });
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
      await screen.findByText('Delete your account?');
      fireEvent.change(screen.getByPlaceholderText('alice@example.com'), { target: { value: 'alice@example.com' } });
      const confirmBtns = screen.getAllByRole('button', { name: 'Delete account' });
      fireEvent.click(confirmBtns[confirmBtns.length - 1]);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('closes the modal on Cancel without deleting', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
      await screen.findByText('Delete your account?');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => {
        expect(screen.queryByText('Delete your account?')).not.toBeInTheDocument();
      });
      expect(authApi.deleteAccount).not.toHaveBeenCalled();
    });

    it('closes the modal on Escape key', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
      await screen.findByText('Delete your account?');
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByText('Delete your account?')).not.toBeInTheDocument();
      });
    });
  });

  describe('email change', () => {
    it('renders the current email pre-filled in the New email field', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      expect(screen.getByLabelText('New email')).toHaveValue('alice@example.com');
    });

    it('disables Change email when the input matches the current email', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      expect(screen.getByRole('button', { name: 'Change email' })).toBeDisabled();
    });

    it('enables Change email once a different address is typed', async () => {
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.change(screen.getByLabelText('New email'), { target: { value: 'new@example.com' } });
      expect(screen.getByRole('button', { name: 'Change email' })).not.toBeDisabled();
    });

    it('calls authApi.changeEmail and shows a pending-confirmation message on success', async () => {
      (authApi.changeEmail as any).mockResolvedValue({});
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.change(screen.getByLabelText('New email'), { target: { value: 'new@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
      await waitFor(() => {
        expect(authApi.changeEmail).toHaveBeenCalledWith('new@example.com');
      });
      expect(await screen.findByText(/Check/)).toBeInTheDocument();
      expect(screen.getByText('new@example.com')).toBeInTheDocument();
    });

    it('shows an error toast when the request fails', async () => {
      (authApi.changeEmail as any).mockRejectedValue({
        response: { data: { error: { message: 'Email already registered' } } },
      });
      renderPage();
      await waitFor(() => screen.getByDisplayValue('Alice'));
      fireEvent.change(screen.getByLabelText('New email'), { target: { value: 'taken@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already registered');
      });
      expect(screen.queryByText(/Check/)).not.toBeInTheDocument();
    });
  });
});
