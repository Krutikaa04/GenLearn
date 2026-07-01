import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

function wrapper({ children }: any) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('NotFoundPage', () => {
  it('renders 404 number', () => {
    render(<NotFoundPage />, { wrapper });
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders page not found heading', () => {
    render(<NotFoundPage />, { wrapper });
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('renders back to dashboard link', () => {
    render(<NotFoundPage />, { wrapper });
    const link = screen.getByRole('link', { name: 'Back to dashboard' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders descriptive message', () => {
    render(<NotFoundPage />, { wrapper });
    expect(screen.getByText(/doesn't exist or has moved/)).toBeInTheDocument();
  });
});
