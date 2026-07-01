import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore, initTheme } from './theme.store';

beforeEach(() => {
  useThemeStore.setState({ theme: 'light' });
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('useThemeStore', () => {
  it('starts in light mode', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggle switches from light to dark and adds the dark class', () => {
    useThemeStore.getState().toggle();

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggle switches from dark back to light and removes the dark class', () => {
    useThemeStore.setState({ theme: 'dark' });
    document.documentElement.classList.add('dark');

    useThemeStore.getState().toggle();

    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('initTheme', () => {
  it('adds the dark class when the stored theme is dark', () => {
    localStorage.setItem('genlearn-theme', JSON.stringify({ state: { theme: 'dark' } }));

    initTheme();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not add the dark class when the stored theme is light', () => {
    localStorage.setItem('genlearn-theme', JSON.stringify({ state: { theme: 'light' } }));

    initTheme();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('does nothing when there is no stored theme', () => {
    initTheme();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
