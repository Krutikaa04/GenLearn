import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownContent } from './MarkdownContent';

describe('MarkdownContent', () => {
  it('renders bold text from **markdown**', () => {
    const { container } = render(<MarkdownContent content="Hello **world**" />);
    expect(container.querySelector('strong')?.textContent).toBe('world');
  });

  it('renders a bullet list from - items', () => {
    const { container } = render(<MarkdownContent content={`- Apple\n- Banana\n- Cherry`} />);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('Apple');
  });

  it('renders inline code', () => {
    const { container } = render(<MarkdownContent content="Call `useState()` to manage state" />);
    expect(container.querySelector('code')?.textContent).toBe('useState()');
  });

  it('applies the md CSS class for styling', () => {
    const { container } = render(<MarkdownContent content="test" />);
    expect(container.firstChild).toHaveClass('md');
  });
});
