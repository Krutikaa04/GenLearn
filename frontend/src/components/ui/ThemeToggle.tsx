import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      className={`relative flex items-center gap-2 rounded-xl transition-all duration-150 hover:bg-[var(--bg-hover)] active:scale-95 ${
        compact ? 'p-2' : 'px-3 py-2 w-full'
      }`}
      style={{ color: 'var(--text-secondary)' }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 shrink-0" />
      ) : (
        <Moon className="w-4 h-4 shrink-0" />
      )}
      {!compact && (
        <span className="text-sm font-medium">
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
}
