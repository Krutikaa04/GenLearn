import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        document.documentElement.classList.toggle('dark', next === 'dark');
      },
    }),
    { name: 'genlearn-theme' },
  ),
);

// Apply theme on load
export function initTheme() {
  const stored = localStorage.getItem('genlearn-theme');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }
}
