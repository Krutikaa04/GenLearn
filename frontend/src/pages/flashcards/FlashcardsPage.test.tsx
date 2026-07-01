import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { FlashcardsPage } from './FlashcardsPage';

vi.mock('../../api/flashcards.api', () => ({
  flashcardsApi: {
    list: vi.fn(),
    generate: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    getDue: vi.fn(),
    reviewCard: vi.fn(),
    getStatus: vi.fn(),
  },
}));

vi.mock('../../api/documents.api', () => ({
  documentsApi: { list: vi.fn() },
}));

vi.mock('../../api/lessons.api', () => ({
  lessonsApi: { list: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { flashcardsApi } from '../../api/flashcards.api';
import { documentsApi } from '../../api/documents.api';
import { lessonsApi } from '../../api/lessons.api';
import toast from 'react-hot-toast';

const mockSet = {
  setId: 'set-1',
  title: 'Data Structures Cards',
  sourceType: 'document',
  status: 'ready',
  cardCount: 15,
};

const mockGeneratingSet = {
  setId: 'set-2',
  title: null,
  sourceType: 'lesson',
  status: 'generating',
  cardCount: null,
};

const mockCards = [
  { cardId: 'c1', front: 'What is a stack?', back: 'LIFO data structure', hint: 'Last In First Out' },
  { cardId: 'c2', front: 'What is a queue?', back: 'FIFO data structure', hint: null },
];

const mockDueCards = [
  { cardId: 'c3', front: 'Define recursion', back: 'A function calling itself', hint: null, setId: 'set-1', setTitle: 'Data Structures Cards' },
];

function wrapper(initialPath = '/flashcards') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (flashcardsApi.list as any).mockResolvedValue({ data: { data: [] } });
  (flashcardsApi.getDue as any).mockResolvedValue({ data: { data: [] } });
  (documentsApi.list as any).mockResolvedValue({ data: { data: [] } });
  (lessonsApi.list as any).mockResolvedValue({ data: { data: [] } });
});

describe('FlashcardsPage', () => {
  it('renders page heading', async () => {
    render(<FlashcardsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Flashcards')).toBeInTheDocument();
  });

  it('shows empty state when no sets', async () => {
    render(<FlashcardsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('No flashcard sets yet')).toBeInTheDocument();
  });

  it('renders flashcard sets with title and card count', async () => {
    (flashcardsApi.list as any).mockResolvedValue({ data: { data: [mockSet] } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Data Structures Cards')).toBeInTheDocument();
    expect(screen.getByText('15 cards · from document')).toBeInTheDocument();
  });

  it('shows fallback title for sets without a title', async () => {
    (flashcardsApi.list as any).mockResolvedValue({ data: { data: [mockGeneratingSet] } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Flashcards from lesson')).toBeInTheDocument();
  });

  it('shows "Review cards" button for ready sets', async () => {
    (flashcardsApi.list as any).mockResolvedValue({ data: { data: [mockSet] } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    expect(await screen.findByRole('button', { name: 'Review cards' })).toBeInTheDocument();
  });

  it('shows generating indicator for sets still processing', async () => {
    (flashcardsApi.list as any).mockResolvedValue({ data: { data: [mockGeneratingSet] } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    await screen.findByText('Flashcards from lesson');
    expect(screen.getByText('Generating…')).toBeInTheDocument();
  });

  it('shows due cards alert banner when cards are due', async () => {
    (flashcardsApi.getDue as any).mockResolvedValue({ data: { data: mockDueCards } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('1 card due for review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start review' })).toBeInTheDocument();
  });

  it('shows plural due cards text', async () => {
    const many = [
      { cardId: 'a', setId: 's1', setTitle: 'Set', front: 'Q1', back: 'A1', hint: null },
      { cardId: 'b', setId: 's1', setTitle: 'Set', front: 'Q2', back: 'A2', hint: null },
      { cardId: 'c', setId: 's1', setTitle: 'Set', front: 'Q3', back: 'A3', hint: null },
    ];
    (flashcardsApi.getDue as any).mockResolvedValue({ data: { data: many } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('3 cards due for review')).toBeInTheDocument();
  });

  it('opens review modal when clicking Review cards', async () => {
    (flashcardsApi.list as any).mockResolvedValue({ data: { data: [mockSet] } });
    (flashcardsApi.getById as any).mockResolvedValue({ data: { data: { ...mockSet, cards: mockCards } } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Review cards' });
    fireEvent.click(screen.getByRole('button', { name: 'Review cards' }));
    expect(await screen.findByText('What is a stack?')).toBeInTheDocument();
    expect(screen.getByText('Tap to reveal answer')).toBeInTheDocument();
  });

  it('flips card to show answer when clicked', async () => {
    (flashcardsApi.list as any).mockResolvedValue({ data: { data: [mockSet] } });
    (flashcardsApi.getById as any).mockResolvedValue({ data: { data: { ...mockSet, cards: mockCards } } });
    render(<FlashcardsPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Review cards' });
    fireEvent.click(screen.getByRole('button', { name: 'Review cards' }));
    const cardEl = await screen.findByText('Tap to reveal answer');
    fireEvent.click(cardEl.closest('[class*="cursor-pointer"]') ?? cardEl);
    expect(await screen.findByText('LIFO data structure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Easy' })).toBeInTheDocument();
  });

  it('calls reviewCard when rating is clicked', async () => {
    (flashcardsApi.list as any).mockResolvedValue({ data: { data: [mockSet] } });
    (flashcardsApi.getById as any).mockResolvedValue({ data: { data: { ...mockSet, cards: mockCards } } });
    (flashcardsApi.reviewCard as any).mockResolvedValue({});
    render(<FlashcardsPage />, { wrapper: wrapper() });
    await screen.findByRole('button', { name: 'Review cards' });
    fireEvent.click(screen.getByRole('button', { name: 'Review cards' }));
    const tapHint = await screen.findByText('Tap to reveal answer');
    fireEvent.click(tapHint.closest('[class*="cursor-pointer"]') ?? tapHint);
    await screen.findByRole('button', { name: 'Good' });
    fireEvent.click(screen.getByRole('button', { name: 'Good' }));
    await waitFor(() => {
      expect(flashcardsApi.reviewCard).toHaveBeenCalledWith('set-1', 'c1', 3);
    });
  });

  it('opens Generate modal on button click', async () => {
    render(<FlashcardsPage />, { wrapper: wrapper() });
    await screen.findByText('Flashcards');
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));
    expect(await screen.findByText('Generate Flashcards')).toBeInTheDocument();
  });

  it('closes Generate modal on Cancel', async () => {
    render(<FlashcardsPage />, { wrapper: wrapper() });
    await screen.findByText('Flashcards');
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }));
    await screen.findByText('Generate Flashcards');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Generate Flashcards')).not.toBeInTheDocument();
  });

  it('shows success toast after generation starts', async () => {
    (flashcardsApi.generate as any).mockResolvedValue({ data: {} });
    const doc = { documentId: 'd1', originalFilename: 'notes.pdf', status: 'ready' };
    (documentsApi.list as any).mockResolvedValue({ data: { data: [doc] } });
    // Open modal via docId param so initialDocId pre-fills the sourceId
    render(<FlashcardsPage />, { wrapper: wrapper('/flashcards?docId=d1') });
    await screen.findByText('Generate Flashcards');
    // Generate button should be enabled because sourceId is pre-filled
    const generateBtns = await screen.findAllByRole('button', { name: 'Generate' });
    const modalGenBtn = generateBtns.at(-1)!;
    await waitFor(() => expect(modalGenBtn).not.toBeDisabled());
    fireEvent.click(modalGenBtn);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Flashcard generation started');
    });
  });

  it('does not show due banner when no cards are due', async () => {
    render(<FlashcardsPage />, { wrapper: wrapper() });
    await screen.findByText('Flashcards');
    expect(screen.queryByText(/due for review/)).not.toBeInTheDocument();
  });
});
