import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { QuizzesPage } from './QuizzesPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../../api/quizzes.api', () => ({
  quizzesApi: {
    list: vi.fn(),
    generate: vi.fn(),
    getById: vi.fn(),
    submit: vi.fn(),
    delete: vi.fn(),
    reviewQuiz: vi.fn(),
  },
}));

vi.mock('../../api/analytics.api', () => ({
  analyticsApi: { getWeakTopics: vi.fn() },
}));

vi.mock('../../api/documents.api', () => ({
  documentsApi: { list: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { quizzesApi } from '../../api/quizzes.api';
import { analyticsApi } from '../../api/analytics.api';
import { documentsApi } from '../../api/documents.api';
import toast from 'react-hot-toast';

const mockReadyQuiz = {
  quizId: 'q1',
  title: 'Binary Trees Quiz',
  topic: 'Binary Trees',
  difficulty: 'intermediate',
  status: 'ready',
  challengeMode: false,
  questionCount: 10,
  timeLimitMinutes: null,
};

const mockChallenge = {
  quizId: 'q2',
  title: 'Algorithm Challenge',
  topic: 'Algorithms',
  difficulty: 'advanced',
  status: 'ready',
  challengeMode: true,
  questionCount: 15,
  timeLimitMinutes: 20,
};

const mockSubmittedQuiz = {
  quizId: 'q3',
  title: 'Sorting Quiz',
  topic: 'Sorting',
  difficulty: 'beginner',
  status: 'submitted',
  challengeMode: false,
  questionCount: 5,
  score: 4,
};

const mockGeneratingQuiz = {
  quizId: 'q4',
  title: null,
  topic: 'Graphs',
  difficulty: 'intermediate',
  status: 'generating',
  challengeMode: false,
  questionCount: 10,
};

const mockQuizWithQuestions = {
  ...mockReadyQuiz,
  questions: [
    { questionId: 'qq1', text: 'What is a BST?', options: ['A tree with sorting', 'A graph', 'A hash map', 'A linked list'] },
    { questionId: 'qq2', text: 'What is tree height?', options: ['Depth from root', 'Count of nodes', 'Count of leaves', 'Width'] },
  ],
};

function wrapper(initialPath = '/quizzes') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// Wraps a quiz array into the paginated response shape (data + meta) that
// usePaginatedList expects from quizzesApi.list.
function page(items: any[]) {
  return { data: { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } } };
}

beforeEach(() => {
  vi.clearAllMocks();
  (quizzesApi.list as any).mockResolvedValue(page([]));
  (documentsApi.list as any).mockResolvedValue({ data: { data: [] } });
  (analyticsApi.getWeakTopics as any).mockResolvedValue({ data: { data: [] } });
});

describe('QuizzesPage — list view', () => {
  it('renders Quizzes heading', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Quizzes')).toBeInTheDocument();
  });

  it('shows empty state when no quizzes', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    expect(await screen.findByText('No quizzes yet')).toBeInTheDocument();
  });

  it('renders quiz list with title and difficulty badge', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    render(<QuizzesPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Binary Trees Quiz')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('shows "Take Quiz" button for ready normal quizzes', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    render(<QuizzesPage />, { wrapper: wrapper() });
    expect(await screen.findByRole('button', { name: 'Take Quiz' })).toBeInTheDocument();
  });

  it('shows Challenge button with Zap icon for challenge quizzes', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockChallenge]));
    render(<QuizzesPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Algorithm Challenge')).toBeInTheDocument();
    expect(screen.getByText('20min limit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Challenge/ })).toBeInTheDocument();
  });

  it('shows Results button for submitted quizzes', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockSubmittedQuiz]));
    render(<QuizzesPage />, { wrapper: wrapper() });
    expect(await screen.findByRole('button', { name: /Results/ })).toBeInTheDocument();
  });

  it('shows score percentage for submitted quizzes', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockSubmittedQuiz]));
    render(<QuizzesPage />, { wrapper: wrapper() });
    expect(await screen.findByText('80%')).toBeInTheDocument();
  });

  it('shows generating spinner for quizzes being generated', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockGeneratingQuiz]));
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Graphs');
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deletes a quiz after confirm', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    (quizzesApi.delete as any).mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Binary Trees Quiz');
    const trashBtns = Array.from(document.querySelectorAll('button')).filter((b) => b.querySelector('svg'));
    const trashBtn = trashBtns[trashBtns.length - 1] as HTMLButtonElement;
    if (trashBtn) fireEvent.click(trashBtn);
    await waitFor(() => {
      expect(quizzesApi.delete).toHaveBeenCalledWith('q1');
    });
    expect(toast.success).toHaveBeenCalledWith('Deleted');
  });
});

describe('QuizzesPage — Generate modal', () => {
  it('opens Generate modal on button click', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    expect(await screen.findByText('Generate Quiz')).toBeInTheDocument();
  });

  it('closes modal on Cancel', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Generate Quiz');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Generate Quiz')).not.toBeInTheDocument();
  });

  it('shows Normal and Challenge mode toggle buttons', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Generate Quiz');
    expect(screen.getByRole('button', { name: /Normal/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Challenge/ })).toBeInTheDocument();
  });

  it('Generate button is disabled when topic is empty in normal mode', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Generate Quiz');
    const modalGenerateBtn = screen.getAllByRole('button', { name: 'Generate' }).at(-1)!;
    expect(modalGenerateBtn).toBeDisabled();
  });

  it('calls quizzesApi.generate with correct params in normal mode', async () => {
    (quizzesApi.generate as any).mockResolvedValue({ data: {} });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Generate Quiz');
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Binary Search' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Generate' }).at(-1)!);
    await waitFor(() => {
      expect(quizzesApi.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Binary Search',
          difficulty: 'beginner',
          questionCount: 10,
          challengeMode: false,
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Quiz generation started');
  });

  it('opens modal pre-filled with topic from URL param', async () => {
    render(<QuizzesPage />, { wrapper: wrapper('/quizzes?topic=Recursion') });
    expect(await screen.findByText('Generate Quiz')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toHaveValue('Recursion');
  });

  it('switches to challenge mode and shows time limit slider', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Generate Quiz');
    fireEvent.click(screen.getByRole('button', { name: /Challenge/ }));
    expect(await screen.findByText('Topics (ordered by priority)')).toBeInTheDocument();
    expect(screen.getByText(/Time limit:/)).toBeInTheDocument();
  });

  it('adds challenge topic chips in challenge mode', async () => {
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Generate Quiz');
    fireEvent.click(screen.getByRole('button', { name: /Challenge/ }));
    await screen.findByText('Topics (ordered by priority)');
    const topicInput = screen.getByPlaceholderText('Add topic, press Enter');
    fireEvent.change(topicInput, { target: { value: 'Sorting' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    expect(await screen.findByText(/Sorting/)).toBeInTheDocument();
  });

  it('calls generate with challengeMode: true params', async () => {
    (quizzesApi.generate as any).mockResolvedValue({ data: {} });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Quizzes');
    fireEvent.click(screen.getByRole('button', { name: /Generate/ }));
    await screen.findByText('Generate Quiz');
    fireEvent.click(screen.getByRole('button', { name: /Challenge/ }));
    await screen.findByText('Topics (ordered by priority)');
    const topicInput = screen.getByPlaceholderText('Add topic, press Enter');
    fireEvent.change(topicInput, { target: { value: 'Graphs' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    await screen.findByText(/Graphs/);
    fireEvent.click(screen.getAllByRole('button', { name: 'Generate' }).at(-1)!);
    await waitFor(() => {
      expect(quizzesApi.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          challengeMode: true,
          challengeTopics: ['Graphs'],
          timeLimitMinutes: expect.any(Number),
        }),
      );
    });
  });
});

describe('QuizzesPage — QuizTaker', () => {
  it('opens quiz taker modal when Take Quiz is clicked', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    (quizzesApi.getById as any).mockResolvedValue({ data: { data: mockQuizWithQuestions } });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Take Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Take Quiz' }));
    expect(await screen.findByText('What is a BST?')).toBeInTheDocument();
  });

  it('shows question with answer options', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    (quizzesApi.getById as any).mockResolvedValue({ data: { data: mockQuizWithQuestions } });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Take Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Take Quiz' }));
    await screen.findByText('What is a BST?');
    expect(screen.getByText('A tree with sorting')).toBeInTheDocument();
    expect(screen.getByText('A graph')).toBeInTheDocument();
  });

  it('selects an answer and advances to next question', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    (quizzesApi.getById as any).mockResolvedValue({ data: { data: mockQuizWithQuestions } });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Take Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Take Quiz' }));
    await screen.findByText('What is a BST?');
    fireEvent.click(screen.getByText('A tree with sorting'));
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    expect(await screen.findByText('What is tree height?')).toBeInTheDocument();
  });

  it('submits quiz and shows score', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    (quizzesApi.getById as any).mockResolvedValue({ data: { data: mockQuizWithQuestions } });
    (quizzesApi.submit as any).mockResolvedValue({
      data: { data: { score: 2, totalQuestions: 2, scorePercent: 100, answers: [] } },
    });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Take Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Take Quiz' }));
    await screen.findByText('What is a BST?');
    fireEvent.click(screen.getByText('A tree with sorting'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('What is tree height?');
    fireEvent.click(screen.getByText('Depth from root'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Quiz' }));
    await waitFor(() => {
      expect(quizzesApi.submit).toHaveBeenCalledWith('q1', [
        { questionId: 'qq1', selectedIndex: 0 },
        { questionId: 'qq2', selectedIndex: 0 },
      ]);
    });
    expect(await screen.findByText('100%')).toBeInTheDocument();
  });

  it('shows progress bar during quiz', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    (quizzesApi.getById as any).mockResolvedValue({ data: { data: mockQuizWithQuestions } });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Take Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Take Quiz' }));
    await screen.findByText('What is a BST?');
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });

  it('shows 0/N answered text initially', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    (quizzesApi.getById as any).mockResolvedValue({ data: { data: mockQuizWithQuestions } });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Take Quiz' });
    fireEvent.click(screen.getByRole('button', { name: 'Take Quiz' }));
    await screen.findByText('What is a BST?');
    expect(screen.getByText('0/2 answered')).toBeInTheDocument();
  });
});

describe('QuizzesPage — ReviewModal', () => {
  it('opens results modal when Results button is clicked', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockSubmittedQuiz]));
    (quizzesApi.reviewQuiz as any).mockResolvedValue({
      data: {
        data: {
          score: 4,
          totalQuestions: 5,
          scorePercent: 80,
          answers: [
            { questionId: 'qq1', questionText: 'Q1?', selectedIndex: 0, isCorrect: true, options: ['A', 'B'] },
          ],
        },
      },
    });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: /Results/ });
    fireEvent.click(screen.getByRole('button', { name: /Results/ }));
    expect(await screen.findByText('Quiz Results')).toBeInTheDocument();
    // '4 of 5 correct' appears in both the header subtitle and results body
    expect((await screen.findAllByText('4 of 5 correct')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0);
  });

  it('shows answer correctness in results modal', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockSubmittedQuiz]));
    (quizzesApi.reviewQuiz as any).mockResolvedValue({
      data: {
        data: {
          score: 4,
          totalQuestions: 5,
          scorePercent: 80,
          answers: [
            { questionId: 'qq1', questionText: 'What is a stack?', selectedIndex: 0, isCorrect: true, options: ['LIFO', 'FIFO'] },
            { questionId: 'qq2', questionText: 'What is a queue?', selectedIndex: 0, isCorrect: false, correctIndex: 1, options: ['LIFO', 'FIFO'], explanation: 'Queue is FIFO.' },
          ],
        },
      },
    });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: /Results/ });
    fireEvent.click(screen.getByRole('button', { name: /Results/ }));
    await screen.findByText('Quiz Results');
    expect(await screen.findByText('What is a stack?')).toBeInTheDocument();
    expect(screen.getByText('Queue is FIFO.')).toBeInTheDocument();
  });
});

describe('QuizzesPage — pagination', () => {
  it('does not show Load more when all quizzes are already loaded', async () => {
    (quizzesApi.list as any).mockResolvedValue(page([mockReadyQuiz]));
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Binary Trees Quiz');
    expect(screen.queryByRole('button', { name: /Load more/ })).not.toBeInTheDocument();
  });

  it('shows Load more with a count when more quizzes exist on the server', async () => {
    (quizzesApi.list as any).mockResolvedValue({
      data: { data: [mockReadyQuiz], meta: { page: 1, pageSize: 20, total: 4, totalPages: 1 } },
    });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Binary Trees Quiz');
    expect(await screen.findByRole('button', { name: 'Load more (1 of 4)' })).toBeInTheDocument();
  });

  it('fetches the next page when Load more is clicked', async () => {
    (quizzesApi.list as any)
      .mockResolvedValueOnce({ data: { data: [mockReadyQuiz], meta: { page: 1, pageSize: 1, total: 2, totalPages: 2 } } })
      .mockResolvedValueOnce({ data: { data: [mockSubmittedQuiz], meta: { page: 2, pageSize: 1, total: 2, totalPages: 2 } } });
    render(<QuizzesPage />, { wrapper: wrapper() });
    await screen.findByText('Binary Trees Quiz');
    fireEvent.click(await screen.findByRole('button', { name: /Load more/ }));
    expect(await screen.findByText('Sorting Quiz')).toBeInTheDocument();
    expect(quizzesApi.list).toHaveBeenLastCalledWith(2, 20);
  });
});
