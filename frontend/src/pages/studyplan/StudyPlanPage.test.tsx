import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StudyPlanPage } from './StudyPlanPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../../api/studyplan.api', () => ({
  studyplanApi: { generate: vi.fn() },
}));

vi.mock('../../api/analytics.api', () => ({
  analyticsApi: { getProgress: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { studyplanApi } from '../../api/studyplan.api';
import { analyticsApi } from '../../api/analytics.api';
import toast from 'react-hot-toast';

const mockPlan = {
  title: 'React in 7 Days',
  summary: 'A focused plan to master React Hooks.',
  plan: [
    {
      day: 1,
      date: '2026-07-08',
      totalMinutes: 120,
      tasks: [
        { type: 'lesson', topic: 'useState', durationMinutes: 30, priority: 'high', rationale: 'Foundation concept' },
        { type: 'quiz', topic: 'useState', durationMinutes: 20, priority: 'medium', rationale: 'Reinforce learning' },
      ],
    },
    {
      day: 2,
      date: '2026-07-09',
      totalMinutes: 90,
      tasks: [
        { type: 'lesson', topic: 'useEffect', durationMinutes: 30, priority: 'high', rationale: 'Essential hook' },
      ],
    },
  ],
};

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
  sessionStorage.clear();
  (analyticsApi.getProgress as any).mockResolvedValue({ data: { data: { topicMastery: [] } } });
});

afterEach(() => {
  sessionStorage.clear();
});

describe('StudyPlanPage — form', () => {
  it('renders Learning Plan heading', async () => {
    render(<StudyPlanPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Learning Plan')).toBeInTheDocument();
  });

  it('renders goal input', async () => {
    render(<StudyPlanPage />, { wrapper: wrapper() });
    expect(await screen.findByLabelText('What do you want to learn?')).toBeInTheDocument();
  });

  it('renders Generate plan button disabled with empty form', async () => {
    render(<StudyPlanPage />, { wrapper: wrapper() });
    expect(await screen.findByRole('button', { name: /Generate plan/ })).toBeDisabled();
  });

  it('adds topic chip when Enter is pressed', async () => {
    render(<StudyPlanPage />, { wrapper: wrapper() });
    const topicInput = await screen.findByPlaceholderText('Add a topic and press Enter');
    fireEvent.change(topicInput, { target: { value: 'React Hooks' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    expect(await screen.findByText('React Hooks')).toBeInTheDocument();
    expect((topicInput as HTMLInputElement).value).toBe('');
  });

  it('removes topic chip when X is clicked', async () => {
    render(<StudyPlanPage />, { wrapper: wrapper() });
    const topicInput = await screen.findByPlaceholderText('Add a topic and press Enter');
    fireEvent.change(topicInput, { target: { value: 'TypeScript' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    await screen.findByText('TypeScript');
    const removeBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.closest('.flex.flex-wrap') && b.querySelector('svg'),
    ) as HTMLButtonElement;
    if (removeBtn) fireEvent.click(removeBtn);
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
  });

  it('does not add duplicate topic', async () => {
    render(<StudyPlanPage />, { wrapper: wrapper() });
    const topicInput = await screen.findByPlaceholderText('Add a topic and press Enter');
    fireEvent.change(topicInput, { target: { value: 'SQL' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    fireEvent.change(topicInput, { target: { value: 'SQL' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    const chips = screen.getAllByText('SQL');
    expect(chips.length).toBe(1);
  });

  it('Generate plan button becomes enabled when all fields are filled', async () => {
    render(<StudyPlanPage />, { wrapper: wrapper() });
    fireEvent.change(await screen.findByLabelText('What do you want to learn?'), { target: { value: 'Learn React' } });
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-07-15' } });
    const topicInput = screen.getByPlaceholderText('Add a topic and press Enter');
    fireEvent.change(topicInput, { target: { value: 'React' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    await screen.findByText('React');
    expect(screen.getByRole('button', { name: /Generate plan/ })).not.toBeDisabled();
  });
});

describe('StudyPlanPage — plan view', () => {
  async function generatePlan() {
    (studyplanApi.generate as any).mockResolvedValue({ data: { data: mockPlan } });
    render(<StudyPlanPage />, { wrapper: wrapper() });
    fireEvent.change(await screen.findByLabelText('What do you want to learn?'), { target: { value: 'Learn React' } });
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-07-15' } });
    const topicInput = screen.getByPlaceholderText('Add a topic and press Enter');
    fireEvent.change(topicInput, { target: { value: 'React Hooks' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    await screen.findByText('React Hooks');
    fireEvent.click(screen.getByRole('button', { name: /Generate plan/ }));
    await screen.findByText('React in 7 Days');
  }

  it('shows plan title and summary after generation', async () => {
    await generatePlan();
    expect(screen.getByText('React in 7 Days')).toBeInTheDocument();
    expect(screen.getByText('A focused plan to master React Hooks.')).toBeInTheDocument();
  });

  it('shows success toast after generation', async () => {
    await generatePlan();
    expect(toast.success).toHaveBeenCalledWith('Study plan generated!');
  });

  it('renders day cards with task count and minutes', async () => {
    await generatePlan();
    expect(screen.getByText('2026-07-08')).toBeInTheDocument();
    expect(screen.getByText('120 min · 2 tasks')).toBeInTheDocument();
  });

  it('renders task entries with topic and type', async () => {
    await generatePlan();
    // Topic text appears in task buttons; rationale text is shown below each task
    const taskBtns = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.textContent?.includes('useState'),
    );
    expect(taskBtns.length).toBeGreaterThan(0);
    expect(screen.getByText('Foundation concept')).toBeInTheDocument();
  });

  it('navigates to lessons page with topic when lesson task is clicked', async () => {
    await generatePlan();
    // Find task button that has both 'useState' and 'lesson' in its textContent (case-insensitive)
    const taskBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => {
        const text = b.textContent?.toLowerCase() ?? '';
        return text.includes('usestate') && text.includes('lesson');
      },
    ) as HTMLButtonElement;
    expect(taskBtn).toBeTruthy();
    fireEvent.click(taskBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/lessons?topic=useState');
  });

  it('shows New plan button in plan view', async () => {
    await generatePlan();
    expect(screen.getByRole('button', { name: /New plan/ })).toBeInTheDocument();
  });

  it('resets to form when New plan is clicked', async () => {
    await generatePlan();
    fireEvent.click(screen.getByRole('button', { name: /New plan/ }));
    expect(await screen.findByText('Learning Plan')).toBeInTheDocument();
    expect(screen.queryByText('React in 7 Days')).not.toBeInTheDocument();
  });

  it('shows error toast when generation fails', async () => {
    (studyplanApi.generate as any).mockRejectedValue({
      response: { data: { error: { message: 'AI service down' } } },
    });
    render(<StudyPlanPage />, { wrapper: wrapper() });
    fireEvent.change(await screen.findByLabelText('What do you want to learn?'), { target: { value: 'Learn Python' } });
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-08-01' } });
    const topicInput = screen.getByPlaceholderText('Add a topic and press Enter');
    fireEvent.change(topicInput, { target: { value: 'Python basics' } });
    fireEvent.keyDown(topicInput, { key: 'Enter' });
    await screen.findByText('Python basics');
    fireEvent.click(screen.getByRole('button', { name: /Generate plan/ }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('AI service down');
    });
  });
});
