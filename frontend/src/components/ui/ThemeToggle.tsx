import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/theme.store';
import { pressable } from '../../lib/motion';

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, toggle } = useThemeStore();

  return (
    <motion.button
      onClick={toggle}
      className={`relative flex items-center gap-2 rounded-xl transition-colors duration-150 hover:bg-[var(--bg-hover)] ${
        compact ? 'p-2' : 'px-3 py-2 w-full'
      }`}
      style={{ color: 'var(--text-secondary)' }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      {...pressable}
    >
      <span className="relative w-4 h-4 shrink-0 grid place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'dark' ? (
            <motion.span
              key="sun"
              className="absolute grid place-items-center"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-4 h-4" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              className="absolute grid place-items-center"
              initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-4 h-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {!compact && (
        <span className="text-sm font-medium">
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </motion.button>
  );
}
