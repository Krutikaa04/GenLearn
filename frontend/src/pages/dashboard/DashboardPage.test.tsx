import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

vi.mock('../../api/analytics.api', () => ({
  analyticsApi: {
    getProgress: vi.fn(),
    getWeakTopics: vi.fn(),
  },
}));

vi.mock('../../api/adaptive.api', () => ({
  adaptiveApi: {
    getRecommendation: vi.fn(),
    getPlan: vi.fn(),
  },
}));

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

import { analyticsApi } from '../../api/analytics.api';
import { adaptiveApi } from '../../api/adaptive.api';
import { useAuthStore } from '../../store/auth.store';

const mockProgress = {
  currentStreak: 5,
  longestStreak: 12,
  overallMasteryScore: 73,
  totalDocumentsUploaded: 8,
  totalLessonsGenerated: 15,
  totalQuizzesTaken: 22,
  totalFlashcardSetsCreated: 4,
  topicMastery: [
    { topic: 'React Hooks', masteryScore: 90 },
    { topic: 'TypeScript', masteryScore: 65 },
    { topic: 'Algorithms', masteryScore: 42 },
  ],
};

const mockUser = { firstName: 'Rishi', lastName: 'Mahajan', email: 'rishi@test.com', role: 'student' };

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
  (useAuthStore as any).mockImplementation((sel: any) => sel({ user: mockUser }));
  (analyticsApi.getProgress as any).mockResolvedValue({ data: { data: mockProgress } });
  (analyticsApi.getWeakTopics as any).mockResolvedValue({ data: { data: [] } });
  (adaptiveApi.getRecommendation as any).mockResolvedValue({ data: { data: null } });
  (adaptiveApi.getPlan as any).mockResolvedValue({ data: { data: null } });
});

describe('DashboardPage', () => {
  it('renders greeting with user first name', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText(/Rishi/)).toBeInTheDocument();
  });

  it('renders streak count', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    const streakEls = await screen.findAllByText(/5/);
    expect(streakEls.length).toBeGreaterThan(0);
  });

  it('renders overall mastery score', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('73%')).toBeInTheDocument();
  });

  it('renders stat cards with correct values', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Documents')).toBeInTheDocument();
    expect(await screen.findByText('Lessons')).toBeInTheDocument();
    expect(await screen.findByText('Quizzes taken')).toBeInTheDocument();
    expect(await screen.findByText('Flashcard sets')).toBeInTheDocument();
  });

  it('renders topic mastery bars', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('React Hooks')).toBeInTheDocument();
    expect(await screen.findByText('TypeScript')).toBeInTheDocument();
    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
  });

  it('renders quick actions', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Upload document')).toBeInTheDocument();
    expect(await screen.findByText('Generate lesson')).toBeInTheDocument();
    expect(await screen.findByText('Take a quiz')).toBeInTheDocument();
    expect(await screen.findByText('Review flashcards')).toBeInTheDocument();
  });

  it('shows weak topics alert when topics returned', async () => {
    const weakTopics = [
      { topic: 'Pointers', masteryScore: 25 },
      { topic: 'Recursion', masteryScore: 38 },
    ];
    (analyticsApi.getWeakTopics as any).mockResolvedValue({ data: { data: weakTopics } });
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Needs attention')).toBeInTheDocument();
    expect(await screen.findByText('Pointers')).toBeInTheDocument();
    expect(await screen.findByText('Recursion')).toBeInTheDocument();
  });

  it('shows lesson and quiz links for each weak topic', async () => {
    const weakTopics = [{ topic: 'Graphs', masteryScore: 20 }];
    (analyticsApi.getWeakTopics as any).mockResolvedValue({ data: { data: weakTopics } });
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Lesson')).toBeInTheDocument();
    expect(await screen.findByText('Quiz')).toBeInTheDocument();
  });

  it('caps weak topics to 3 items', async () => {
    const weakTopics = [
      { topic: 'A', masteryScore: 10 },
      { topic: 'B', masteryScore: 20 },
      { topic: 'C', masteryScore: 30 },
      { topic: 'D', masteryScore: 40 },
    ];
    (analyticsApi.getWeakTopics as any).mockResolvedValue({ data: { data: weakTopics } });
    render(<DashboardPage />, { wrapper: wrapper() });
    await screen.findByText('A');
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });

  it('hides weak topics alert when no weak topics', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    await screen.findByText('React Hooks');
    expect(screen.queryByText('Needs attention')).not.toBeInTheDocument();
  });

  it('shows no mastery data empty state when topicMastery is empty', async () => {
    (analyticsApi.getProgress as any).mockResolvedValue({
      data: { data: { ...mockProgress, topicMastery: [] } },
    });
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('No mastery data yet')).toBeInTheDocument();
  });

  it('shows zero streak when no progress data', async () => {
    (analyticsApi.getProgress as any).mockResolvedValue({ data: { data: null } });
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText(/0 day streak/)).toBeInTheDocument();
  });

  it('renders best streak from longestStreak', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText(/Best: 12 days/)).toBeInTheDocument();
  });

  it('shows correct mastery score percentages in topic list', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    expect(await screen.findByText('90%')).toBeInTheDocument();
    expect(await screen.findByText('65%')).toBeInTheDocument();
    expect(await screen.findByText('42%')).toBeInTheDocument();
  });

  it('renders the adaptive recommendation card when one is pending', async () => {
    (adaptiveApi.getRecommendation as any).mockResolvedValue({
      data: {
        data: {
          decisionId: 'd-1',
          conceptId: 'bst-definition',
          topic: 'Binary Search Trees',
          trigger: 'misconception',
          action: 'lesson',
          difficulty: 'beginner',
          message: 'You answered confidently but incorrectly on "bst definition" — a short lesson should clear it up.',
        },
      },
    });

    render(<DashboardPage />, { wrapper: wrapper() });

    expect(await screen.findByText('Recommended next')).toBeInTheDocument();
    expect(screen.getByText(/short lesson should clear it up/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start lesson' })).toHaveAttribute(
      'href',
      '/lessons?topic=Binary%20Search%20Trees',
    );
  });

  it('carries the recommended difficulty into the quiz deep-link', async () => {
    (adaptiveApi.getRecommendation as any).mockResolvedValue({
      data: {
        data: {
          decisionId: 'd-2',
          conceptId: 'recursion',
          topic: 'Recursion',
          trigger: 'weak_concept',
          action: 'quiz',
          difficulty: 'beginner',
          message: '"recursion" looks shaky — a quick beginner quiz will build it up.',
        },
      },
    });

    render(<DashboardPage />, { wrapper: wrapper() });

    expect(await screen.findByRole('link', { name: 'Take quiz' })).toHaveAttribute(
      'href',
      '/quizzes?topic=Recursion&difficulty=beginner',
    );
  });

  it('does not render the recommendation card when none is pending', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });

    expect(await screen.findByText(/Rishi/)).toBeInTheDocument();
    expect(screen.queryByText('Recommended next')).not.toBeInTheDocument();
  });

  it('renders the Continue Learning card with objective and estimated time when a plan is active', async () => {
    (adaptiveApi.getPlan as any).mockResolvedValue({
      data: {
        data: {
          status: 'active',
          objective: 'Build a solid foundation in recursion base case (raise mastery from 40% toward 70%)',
          topic: 'Recursion',
          targetConcepts: ['recursion-base-case'],
          estimatedMinutes: 12,
          recommendedQuiz: { needed: true },
        },
      },
    });

    render(<DashboardPage />, { wrapper: wrapper() });

    expect(await screen.findByText(/Build a solid foundation in recursion base case/)).toBeInTheDocument();
    expect(screen.getByText(/~12 min/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue learning/i })).toBeInTheDocument();
  });

  it('does not render the Continue Learning card when there is no plan', async () => {
    render(<DashboardPage />, { wrapper: wrapper() });
    await screen.findByText(/Rishi/);
    expect(screen.queryByRole('button', { name: /Continue learning/i })).not.toBeInTheDocument();
  });
});
