import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders the label text', () => {
    render(<Badge label="Ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('defaults to gray color', () => {
    const { container } = render(<Badge label="Default" />);
    const span = container.querySelector('span');
    expect(span).toHaveStyle({ background: 'var(--bg-subtle)' });
  });

  it('applies the correct text color for each variant', () => {
    const cases: Array<{ color: 'green' | 'red' | 'yellow' | 'purple' | 'blue'; textVar: string }> = [
      { color: 'green', textVar: 'var(--success)' },
      { color: 'red', textVar: 'var(--danger)' },
      { color: 'yellow', textVar: 'var(--warning)' },
      { color: 'purple', textVar: 'var(--brand)' },
    ];

    for (const { color, textVar } of cases) {
      const { container } = render(<Badge label="Test" color={color} />);
      const span = container.querySelector('span');
      expect(span).toHaveStyle({ color: textVar });
    }
  });

  it('uses smaller padding for sm size (default)', () => {
    const { container: smContainer } = render(<Badge label="sm" size="sm" />);
    expect(smContainer.querySelector('span')?.className).toContain('px-2');
  });
});
