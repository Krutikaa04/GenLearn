import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TutorPage } from './TutorPage';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('../../api/conversation.api', () => ({
  conversationApi: {
    sendMessage: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/documents.api', () => ({
  documentsApi: { list: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { conversationApi } from '../../api/conversation.api';
import { documentsApi } from '../../api/documents.api';
import toast from 'react-hot-toast';

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
  (documentsApi.list as any).mockResolvedValue({ data: { data: [] } });
  (conversationApi.list as any).mockResolvedValue({ data: { data: { items: [] } } });
});

describe('TutorPage — setup screen', () => {
  it('renders AI Tutor heading on setup screen', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    expect(await screen.findByText('AI Tutor')).toBeInTheDocument();
  });

  it('renders What do you want to learn input', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    expect(await screen.findByLabelText('What do you want to learn?')).toBeInTheDocument();
  });

  it('renders Start learning button', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    expect(await screen.findByRole('button', { name: 'Start learning' })).toBeInTheDocument();
  });

  it('Start learning button is disabled when topic is empty', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    expect(await screen.findByRole('button', { name: 'Start learning' })).toBeDisabled();
  });

  it('Start learning becomes enabled after typing a topic', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    const input = await screen.findByLabelText('What do you want to learn?');
    fireEvent.change(input, { target: { value: 'Recursion' } });
    expect(screen.getByRole('button', { name: 'Start learning' })).not.toBeDisabled();
  });

  it('transitions to chat view after clicking Start learning', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    const input = await screen.findByLabelText('What do you want to learn?');
    fireEvent.change(input, { target: { value: 'Dynamic Programming' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start learning' }));
    // Topic appears in both the header bar and the greeting message — at least one present
    expect((await screen.findAllByText('Dynamic Programming')).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Ask your tutor anything…')).toBeInTheDocument();
  });

  it('shows greeting message in chat with follow-up suggestions', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    const input = await screen.findByLabelText('What do you want to learn?');
    fireEvent.change(input, { target: { value: 'Graphs' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start learning' }));
    expect(await screen.findByText(/I'm your AI tutor for/)).toBeInTheDocument();
    expect(screen.getByText('Explain Graphs from scratch')).toBeInTheDocument();
  });

  it('shows document selection panel when documents are available', async () => {
    const doc = { documentId: 'doc1', originalFilename: 'algorithms.pdf', status: 'ready' };
    (documentsApi.list as any).mockResolvedValue({ data: { data: [doc] } });
    render(<TutorPage />, { wrapper: wrapper() });
    expect(await screen.findByText(/Ground on my documents/)).toBeInTheDocument();
  });

  it('renders History button', async () => {
    render(<TutorPage />, { wrapper: wrapper() });
    expect(await screen.findByRole('button', { name: /History/ })).toBeInTheDocument();
  });
});

describe('TutorPage — chat view', () => {
  async function startSession(topic = 'Binary Trees') {
    render(<TutorPage />, { wrapper: wrapper() });
    const input = await screen.findByLabelText('What do you want to learn?');
    fireEvent.change(input, { target: { value: topic } });
    fireEvent.click(screen.getByRole('button', { name: 'Start learning' }));
    await screen.findByPlaceholderText('Ask your tutor anything…');
  }

  it('sends a message and displays reply', async () => {
    (conversationApi.sendMessage as any).mockResolvedValue({
      data: {
        data: {
          conversationId: 'conv-1',
          reply: 'A binary tree has at most 2 children per node.',
          followUpSuggestions: ['What is a BST?'],
        },
      },
    });
    await startSession();
    const msgInput = screen.getByPlaceholderText('Ask your tutor anything…');
    fireEvent.change(msgInput, { target: { value: 'What is a binary tree?' } });
    const sendBtn = msgInput.nextElementSibling as HTMLButtonElement;
    fireEvent.click(sendBtn);
    await waitFor(() => {
      expect(conversationApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'Binary Trees', message: 'What is a binary tree?' }),
      );
    });
    expect(await screen.findByText('A binary tree has at most 2 children per node.')).toBeInTheDocument();
  });

  it('shows follow-up suggestion chips after AI reply', async () => {
    (conversationApi.sendMessage as any).mockResolvedValue({
      data: {
        data: {
          conversationId: 'conv-1',
          reply: 'Good question!',
          followUpSuggestions: ['Tell me more about traversals', 'Give me a problem'],
        },
      },
    });
    await startSession();
    const msgInput = screen.getByPlaceholderText('Ask your tutor anything…');
    fireEvent.change(msgInput, { target: { value: 'Explain nodes' } });
    const sendBtn = msgInput.nextElementSibling as HTMLButtonElement;
    fireEvent.click(sendBtn);
    expect(await screen.findByText('Tell me more about traversals')).toBeInTheDocument();
    expect(screen.getByText('Give me a problem')).toBeInTheDocument();
  });

  it('clicking a suggestion chip sends that message', async () => {
    (conversationApi.sendMessage as any).mockResolvedValue({
      data: {
        data: {
          conversationId: 'conv-1',
          reply: 'Sure!',
          followUpSuggestions: ['Next question'],
        },
      },
    });
    await startSession('Sorting');
    const msgInput = screen.getByPlaceholderText('Ask your tutor anything…');
    fireEvent.change(msgInput, { target: { value: 'Start' } });
    fireEvent.click(msgInput.nextElementSibling as HTMLButtonElement);
    const chip = await screen.findByText('Next question');
    (conversationApi.sendMessage as any).mockResolvedValue({
      data: { data: { conversationId: 'conv-1', reply: 'Here we go!', followUpSuggestions: [] } },
    });
    fireEvent.click(chip);
    await waitFor(() => {
      expect(conversationApi.sendMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: 'Next question' }),
      );
    });
  });

  it('shows error toast when sendMessage fails', async () => {
    (conversationApi.sendMessage as any).mockRejectedValue({
      response: { data: { error: { message: 'AI unavailable' } } },
    });
    await startSession();
    const msgInput = screen.getByPlaceholderText('Ask your tutor anything…');
    fireEvent.change(msgInput, { target: { value: 'Hello' } });
    fireEvent.click(msgInput.nextElementSibling as HTMLButtonElement);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('AI unavailable');
    });
  });

  it('New topic button resets to setup screen', async () => {
    await startSession('Graphs');
    fireEvent.click(screen.getByRole('button', { name: 'New topic' }));
    expect(await screen.findByText('AI Tutor')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Ask your tutor anything…')).not.toBeInTheDocument();
  });
});
