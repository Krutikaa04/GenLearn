import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { useThemeStore } from '../../store/theme.store';

beforeEach(() => {
  useThemeStore.setState({ theme: 'light' });
  document.documentElement.classList.remove('dark');
});

describe('ThemeToggle', () => {
  it('shows the moon icon in light mode', () => {
    render(<ThemeToggle />);
    expect(screen.getByTitle('Switch to dark mode')).toBeInTheDocument();
  });

  it('shows the sun icon in dark mode', () => {
    useThemeStore.setState({ theme: 'dark' });
    render(<ThemeToggle />);
    expect(screen.getByTitle('Switch to light mode')).toBeInTheDocument();
  });

  it('shows the label text in non-compact mode', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('hides the label text in compact mode', () => {
    render(<ThemeToggle compact />);
    expect(screen.queryByText('Dark mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Light mode')).not.toBeInTheDocument();
  });

  it('calls toggle when clicked', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByTitle('Switch to dark mode'));
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
