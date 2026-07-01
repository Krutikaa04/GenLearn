import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DocumentsPage } from './DocumentsPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../../api/documents.api', () => ({
  documentsApi: {
    list: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    ask: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { documentsApi } from '../../api/documents.api';
import toast from 'react-hot-toast';

const mockReadyDoc = {
  documentId: 'd1',
  originalFilename: 'lecture-notes.pdf',
  fileType: 'pdf',
  fileSizeBytes: 204800,
  status: 'ready',
};

const mockProcessingDoc = {
  documentId: 'd2',
  originalFilename: 'chapter2.docx',
  fileType: 'docx',
  fileSizeBytes: 51200,
  status: 'processing',
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
  (documentsApi.list as any).mockResolvedValue({ data: { data: [] } });
});

describe('DocumentsPage', () => {
  it('renders page heading', async () => {
    render(<DocumentsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('Documents')).toBeInTheDocument();
  });

  it('renders the drop zone', async () => {
    render(<DocumentsPage />, { wrapper: wrapper() });
    expect(await screen.findByText(/Drop files here/)).toBeInTheDocument();
  });

  it('shows empty state when no documents', async () => {
    render(<DocumentsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('No documents yet')).toBeInTheDocument();
  });

  it('renders document list with filename and status', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    expect(await screen.findByText('lecture-notes.pdf')).toBeInTheDocument();
    // 'ready' appears in both the status badge and the filter button
    expect(screen.getAllByText('ready').length).toBeGreaterThan(0);
  });

  it('shows processing spinner for processing documents', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockProcessingDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('chapter2.docx');
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows search and filter controls when documents exist', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    expect(screen.getByPlaceholderText('Search documents…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('filters documents by search term', async () => {
    const doc2 = { ...mockReadyDoc, documentId: 'd2', originalFilename: 'textbook.pdf' };
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc, doc2] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    await screen.findByText('textbook.pdf');
    fireEvent.change(screen.getByPlaceholderText('Search documents…'), { target: { value: 'textbook' } });
    expect(screen.queryByText('lecture-notes.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('textbook.pdf')).toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    fireEvent.change(screen.getByPlaceholderText('Search documents…'), { target: { value: 'zzznomatch' } });
    expect(await screen.findByText('No documents match your search')).toBeInTheDocument();
  });

  it('shows file size in KB', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    expect(await screen.findByText(/200 KB/)).toBeInTheDocument();
  });

  it('opens ask modal when MessageSquare button is clicked', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    const askBtn = document.querySelector('button[title="Ask a question"]') as HTMLButtonElement;
    fireEvent.click(askBtn);
    expect(await screen.findByText('Ask about this document')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask a question…')).toBeInTheDocument();
  });

  it('closes ask modal on X button', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    fireEvent.click(document.querySelector('button[title="Ask a question"]') as HTMLButtonElement);
    await screen.findByText('Ask about this document');
    // The X close button is the first button inside the modal header (.fixed)
    const modalHeader = document.querySelector('.fixed .flex.items-center.justify-between');
    const modalCloseBtn = modalHeader?.querySelector('button') as HTMLButtonElement;
    if (modalCloseBtn) fireEvent.click(modalCloseBtn);
    await waitFor(() => {
      expect(screen.queryByText('Ask about this document')).not.toBeInTheDocument();
    });
  });

  it('closes ask modal on Escape key', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    fireEvent.click(document.querySelector('button[title="Ask a question"]') as HTMLButtonElement);
    await screen.findByText('Ask about this document');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('Ask about this document')).not.toBeInTheDocument();
    });
  });

  it('confirms before closing on backdrop click when a question is typed', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    fireEvent.click(document.querySelector('button[title="Ask a question"]') as HTMLButtonElement);
    await screen.findByText('Ask about this document');
    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: 'Unsent question' } });
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    expect(window.confirm).toHaveBeenCalledWith('Discard your unsent question?');
    expect(screen.getByText('Ask about this document')).toBeInTheDocument();
  });

  it('closes on backdrop click without confirm when no question is typed', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    fireEvent.click(document.querySelector('button[title="Ask a question"]') as HTMLButtonElement);
    await screen.findByText('Ask about this document');
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(screen.queryByText('Ask about this document')).not.toBeInTheDocument();
    });
  });

  it('sends question in ask modal and shows answer', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    (documentsApi.ask as any).mockResolvedValue({ data: { data: { answer: 'Binary search runs in O(log n).' } } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    fireEvent.click(document.querySelector('button[title="Ask a question"]') as HTMLButtonElement);
    await screen.findByText('Ask about this document');
    const questionInput = screen.getByPlaceholderText('Ask a question…');
    fireEvent.change(questionInput, { target: { value: 'What is binary search?' } });
    // Send button is adjacent to the input in the modal footer
    const sendBtn = questionInput.nextElementSibling as HTMLButtonElement;
    if (sendBtn) fireEvent.click(sendBtn);
    await waitFor(() => {
      expect(documentsApi.ask).toHaveBeenCalledWith('d1', 'What is binary search?');
    });
    expect(await screen.findByText('Binary search runs in O(log n).')).toBeInTheDocument();
  });

  it('navigates to lessons page when lesson button is clicked', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    const lessonBtn = document.querySelector('button[title="Generate lesson from this document"]') as HTMLButtonElement;
    fireEvent.click(lessonBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/lessons?docId=d1');
  });

  it('deletes a document after confirm', async () => {
    (documentsApi.list as any).mockResolvedValue({ data: { data: [mockReadyDoc] } });
    (documentsApi.delete as any).mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('lecture-notes.pdf');
    const docCardBtns = Array.from(document.querySelectorAll('.space-y-2 button'));
    const lastBtn = docCardBtns[docCardBtns.length - 1] as HTMLButtonElement;
    if (lastBtn) fireEvent.click(lastBtn);
    await waitFor(() => {
      expect(documentsApi.delete).toHaveBeenCalledWith('d1');
    });
  });

  it('shows success toast after upload', async () => {
    (documentsApi.upload as any).mockResolvedValue({ data: {} });
    render(<DocumentsPage />, { wrapper: wrapper() });
    await screen.findByText('Documents');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'slides.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);
    await waitFor(() => {
      expect(documentsApi.upload).toHaveBeenCalledWith(file);
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Uploaded — processing started');
    });
  });
});
