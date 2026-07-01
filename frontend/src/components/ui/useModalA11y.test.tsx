import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { useModalA11y } from './useModalA11y';

function TestModal({ onClose }: { onClose: () => void }) {
  const ref = useModalA11y(onClose);
  return (
    <div ref={ref} data-testid="panel">
      <button>First</button>
      <button>Second</button>
      <button>Last</button>
    </div>
  );
}

describe('useModalA11y', () => {
  it('autofocuses the first focusable element on mount', () => {
    render(<TestModal onClose={vi.fn()} />);
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('wraps focus from last to first element on Tab', () => {
    render(<TestModal onClose={vi.fn()} />);
    screen.getByText('Last').focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('wraps focus from first to last element on Shift+Tab', () => {
    render(<TestModal onClose={vi.fn()} />);
    screen.getByText('First').focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('Last')).toHaveFocus();
  });

  it('restores focus to the previously focused element on unmount', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open modal';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<TestModal onClose={vi.fn()} />);
    expect(screen.getByText('First')).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    document.body.removeChild(trigger);
  });
});
