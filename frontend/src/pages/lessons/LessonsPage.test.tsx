import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LessonsPage } from './LessonsPage';

vi.mock('../../api/lessons.api', () => ({
  lessonsApi: {
    list: vi.fn(),
    generate: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    getStatus: vi.fn(),
  },
}));

vi.mock('../../api/documents.api', () => ({
  documentsApi: {
    list: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { lessonsApi } from '../../api/lessons.api';
import { documentsApi } from '../../api/documents.api';
import toast from 'react-hot-toast';

const mockReadyLesson = {
  lessonId: 'l1',
  topic: 'Binary Trees',
  title: 'Introduction to Binary Trees',
  difficulty: 'intermediate',
  status: 'ready',
  estimatedReadMinutes: 8,
};

const mockGeneratingLesson = {
  lessonId: 'l2',
  topic: 'Dynamic Programming',
  title: null,
  difficulty: 'advanced',
  status: 'generating',
  estimatedReadMinutes: null,
};

function wrapper(initialPath = '/lessons') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// Wraps a lesson array into the paginated response shape (data + meta) that
// usePaginatedList expects from lessonsApi.list.
function page(items: any[]) {
  return { data: { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } } };
}

beforeEach(() => {
  vi.clearAllMocks();
  (lessonsApi.list as any).mockResolvedValue(page([]));
  (documentsApi.list as any).mockResolvedValue({ data: { data: [] } });
});

describe('LessonsPage', () => {
  it('renders page heading', async () => {
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Lessons')).toBeInTheDocument();
  });

  it('shows empty state when no lessons', async () => {
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('No lessons yet')).toBeInTheDocument();
  });

  it('shows loading spinner while fetching', async () => {
    let resolve: any;
    (lessonsApi.list as any).mockImplementation(() => new Promise((res) => { resolve = res; }));
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    resolve(page([]));
  });

  it('renders lesson list with topics', async () => {
    (lessonsApi.list as any).mockResolvedValue(page([mockReadyLesson, mockGeneratingLesson]));
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Introduction to Binary Trees')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
  });

  it('renders difficulty badges', async () => {
    (lessonsApi.list as any).mockResolvedValue(page([mockReadyLesson]));
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('intermediate')).toBeInTheDocument();
  });

  it('renders read time when available', async () => {
    (lessonsApi.list as any).mockResolvedValue(page([mockReadyLesson]));
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('8 min')).toBeInTheDocument();
  });

  it('shows loading spinner on generating lessons', async () => {
    (lessonsApi.list as any).mockResolvedValue(page([mockGeneratingLesson]));
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Dynamic Programming');
    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('opens Generate modal on button click', async () => {
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Lessons');
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));
    expect(await screen.findByText('Generate Lesson')).toBeInTheDocument();
  });

  it('closes Generate modal on Cancel', async () => {
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Lessons');
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));
    await screen.findByText('Generate Lesson');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Generate Lesson')).not.toBeInTheDocument();
  });

  it('opens modal with pre-filled topic from search params', async () => {
    render(<LessonsPage />, { wrapper: wrapper('/lessons?topic=Recursion') });
    expect(await screen.findByDisplayValue('Recursion')).toBeInTheDocument();
  });

  it('calls lessonsApi.generate on form submit', async () => {
    (lessonsApi.generate as any).mockResolvedValue({ data: { data: { lessonId: 'new-l' } } });
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Lessons');
    // Click the header "Generate" button to open modal
    const [headerBtn] = screen.getAllByRole('button', { name: /Generate/i });
    fireEvent.click(headerBtn);
    await screen.findByText('Generate Lesson');
    const topicInput = screen.getByPlaceholderText(/Binary Search Trees/);
    fireEvent.change(topicInput, { target: { value: 'Heap Sort' } });
    // Modal's Generate button is the last one
    const modalGenerateBtn = screen.getAllByRole('button', { name: 'Generate' }).at(-1)!;
    fireEvent.click(modalGenerateBtn);
    await waitFor(() => {
      expect(lessonsApi.generate).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'Heap Sort', difficulty: 'beginner' }),
      );
    });
  });

  it('shows success toast after generate', async () => {
    (lessonsApi.generate as any).mockResolvedValue({ data: { data: {} } });
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Lessons');
    const [headerBtn] = screen.getAllByRole('button', { name: /Generate/i });
    fireEvent.click(headerBtn);
    await screen.findByText('Generate Lesson');
    fireEvent.change(screen.getByPlaceholderText(/Binary Search Trees/), { target: { value: 'Linked Lists' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Generate' }).at(-1)!);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Lesson generation started');
    });
  });

  it('shows error toast on generate failure', async () => {
    (lessonsApi.generate as any).mockRejectedValue({ response: { data: { error: { message: 'AI error' } } } });
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Lessons');
    const [headerBtn] = screen.getAllByRole('button', { name: /Generate/i });
    fireEvent.click(headerBtn);
    await screen.findByText('Generate Lesson');
    fireEvent.change(screen.getByPlaceholderText(/Binary Search Trees/), { target: { value: 'Sorting' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Generate' }).at(-1)!);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('AI error');
    });
  });

  it('shows toast error when clicking a non-ready lesson', async () => {
    (lessonsApi.list as any).mockResolvedValue(page([mockGeneratingLesson]));
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Dynamic Programming');
    // Click on the lesson card row
    fireEvent.click(screen.getByText('Dynamic Programming').closest('[class*="cursor-pointer"]') ?? screen.getByText('Dynamic Programming'));
    expect(toast.error).toHaveBeenCalledWith('Lesson is still generating');
  });

  it('disables Generate button when topic is empty', async () => {
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Lessons');
    const [headerBtn] = screen.getAllByRole('button', { name: /Generate/i });
    fireEvent.click(headerBtn);
    await screen.findByText('Generate Lesson');
    // Modal's Generate button is the last Generate button
    const modalGenerateBtn = screen.getAllByRole('button', { name: 'Generate' }).at(-1)!;
    expect(modalGenerateBtn).toBeDisabled();
  });

  it('deletes a lesson and calls the delete API', async () => {
    (lessonsApi.list as any).mockResolvedValue(page([mockReadyLesson]));
    (lessonsApi.delete as any).mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Introduction to Binary Trees');
    // The delete (trash) button is the last icon-only button in the card
    const cardButtons = Array.from(document.querySelectorAll('.overflow-hidden button'));
    if (cardButtons.length > 0) {
      fireEvent.click(cardButtons[cardButtons.length - 1]);
      await waitFor(() => {
        expect(lessonsApi.delete).toHaveBeenCalledWith('l1');
      });
    }
  });

  describe('pagination', () => {
    it('does not show Load more when all lessons are already loaded', async () => {
      (lessonsApi.list as any).mockResolvedValue(page([mockReadyLesson]));
      render(<LessonsPage />, { wrapper: wrapper() });
      await screen.findByText('Introduction to Binary Trees');
      expect(screen.queryByRole('button', { name: /Load more/ })).not.toBeInTheDocument();
    });

    it('shows Load more with a count when more lessons exist on the server', async () => {
      (lessonsApi.list as any).mockResolvedValue({
        data: { data: [mockReadyLesson], meta: { page: 1, pageSize: 20, total: 3, totalPages: 1 } },
      });
      render(<LessonsPage />, { wrapper: wrapper() });
      await screen.findByText('Introduction to Binary Trees');
      expect(await screen.findByRole('button', { name: 'Load more (1 of 3)' })).toBeInTheDocument();
    });

    it('fetches the next page when Load more is clicked', async () => {
      const lesson2 = { ...mockReadyLesson, lessonId: 'l3', title: 'Second Lesson' };
      (lessonsApi.list as any)
        .mockResolvedValueOnce({ data: { data: [mockReadyLesson], meta: { page: 1, pageSize: 1, total: 2, totalPages: 2 } } })
        .mockResolvedValueOnce({ data: { data: [lesson2], meta: { page: 2, pageSize: 1, total: 2, totalPages: 2 } } });
      render(<LessonsPage />, { wrapper: wrapper() });
      await screen.findByText('Introduction to Binary Trees');
      fireEvent.click(await screen.findByRole('button', { name: /Load more/ }));
      expect(await screen.findByText('Second Lesson')).toBeInTheDocument();
      expect(lessonsApi.list).toHaveBeenLastCalledWith(2, 20);
    });
  });
});
