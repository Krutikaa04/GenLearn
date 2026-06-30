import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders a label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('does not render a label element when label is omitted', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('label')).toBeNull();
  });

  it('displays an error message and applies no hint', () => {
    render(<Input label="Name" error="Required" hint="Enter your name" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your name')).toBeNull();
  });

  it('displays a hint when there is no error', () => {
    render(<Input hint="Must be 8+ characters" />);
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  it('forwards the value and onChange to the underlying input', () => {
    const onChange = vi.fn();
    render(<Input value="hello" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('hello');
    fireEvent.change(input, { target: { value: 'world' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('forwards extra HTML attributes (placeholder, type)', () => {
    render(<Input placeholder="Search…" type="search" />);
    const input = screen.getByPlaceholderText('Search…');
    expect(input).toHaveAttribute('type', 'search');
  });
});
