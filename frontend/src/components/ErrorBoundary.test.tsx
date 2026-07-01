import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test explosion');
  return <p>All good</p>;
}

// Suppress React's error boundary console.error noise in tests
const suppressConsole = () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return () => spy.mockRestore();
};

describe('ErrorBoundary', () => {
  let restore: () => void;

  beforeEach(() => { restore = suppressConsole(); });
  afterEach(() => restore());

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test explosion')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
  });

  it('calls window.location.reload when the Reload button is clicked', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reload page' }));
    expect(reloadMock).toHaveBeenCalledOnce();
  });

  it('renders a min-h-screen fallback by default (top-level app boundary)', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong').closest('div')).toHaveClass('min-h-screen');
  });

  it('renders a compact, non-viewport-filling fallback when compact is set', () => {
    render(
      <ErrorBoundary compact>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    const fallback = screen.getByText('Something went wrong').closest('div');
    expect(fallback).not.toHaveClass('min-h-screen');
    expect(fallback).toHaveClass('rounded-2xl');
  });
});
