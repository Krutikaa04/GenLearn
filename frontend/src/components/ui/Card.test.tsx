import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies padding class for "md" padding', () => {
    const { container } = render(<Card padding="md">Content</Card>);
    expect(container.firstChild).toHaveClass('p-5');
  });

  it('applies padding class for "lg" padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('has no padding class when padding is "none"', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toMatch(/\bp-\d/);
  });

  it('adds hover styles when the hover prop is set', () => {
    const { container } = render(<Card hover>Hoverable</Card>);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('does not add hover styles by default', () => {
    const { container } = render(<Card>Static</Card>);
    expect(container.firstChild).not.toHaveClass('cursor-pointer');
  });

  it('forwards extra className', () => {
    const { container } = render(<Card className="extra-class">X</Card>);
    expect(container.firstChild).toHaveClass('extra-class');
  });
});
