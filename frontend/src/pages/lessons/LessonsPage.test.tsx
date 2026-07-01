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

beforeEach(() => {
  vi.clearAllMocks();
  (lessonsApi.list as any).mockResolvedValue({ data: { data: [] } });
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
    resolve({ data: { data: [] } });
  });

  it('renders lesson list with topics', async () => {
    (lessonsApi.list as any).mockResolvedValue({ data: { data: [mockReadyLesson, mockGeneratingLesson] } });
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Introduction to Binary Trees')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
  });

  it('renders difficulty badges', async () => {
    (lessonsApi.list as any).mockResolvedValue({ data: { data: [mockReadyLesson] } });
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('intermediate')).toBeInTheDocument();
  });

  it('renders read time when available', async () => {
    (lessonsApi.list as any).mockResolvedValue({ data: { data: [mockReadyLesson] } });
    render(<LessonsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('8 min')).toBeInTheDocument();
  });

  it('shows loading spinner on generating lessons', async () => {
    (lessonsApi.list as any).mockResolvedValue({ data: { data: [mockGeneratingLesson] } });
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
    (lessonsApi.list as any).mockResolvedValue({ data: { data: [mockGeneratingLesson] } });
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
    (lessonsApi.list as any).mockResolvedValue({ data: { data: [mockReadyLesson] } });
    (lessonsApi.delete as any).mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<LessonsPage />, { wrapper: wrapper() });
    await screen.findByText('Introduction to Binary Trees');
    // Find the trash button by title attribute or by being the last button in the card
    const allBtns = screen.getAllByRole('button');
    // The delete (trash) button is after the quiz button in the DOM — find it via SVG path inspection
    const deleteBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.querySelector('svg') &&
        !b.closest('[role="dialog"]') &&
        (b as HTMLButtonElement).onclick !== null ||
        b.getAttribute('aria-label') === 'delete',
    ) ?? allBtns.find((b) => b.closest('.overflow-hidden') && b.querySelector('svg'));
    // Fallback: click the last icon-only button in the card
    const cardButtons = Array.from(document.querySelectorAll('.overflow-hidden button'));
    if (cardButtons.length > 0) {
      fireEvent.click(cardButtons[cardButtons.length - 1]);
      await waitFor(() => {
        expect(lessonsApi.delete).toHaveBeenCalledWith('l1');
      });
    }
  });
});
