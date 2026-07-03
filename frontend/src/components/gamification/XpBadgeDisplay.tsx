import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

export function XpBadgeDisplay() {
  const { xpTotal, level, xpToNextLevel, isLoading } = useGamification();

  if (isLoading) return null;

  // Mirrors the backend's per-level XP band size (xp.util.ts thresholdForLevel: 100 * level).
  const bandSize = 100 * level;
  const percent = Math.max(0, Math.min(100, ((bandSize - xpToNextLevel) / bandSize) * 100));

  return (
    <div className="px-3 py-2 rounded-xl mb-1" style={{ background: 'var(--bg-subtle)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Level {level}</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{xpTotal} XP</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: 'var(--warning)' }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
        />
      </div>
    </div>
  );
}
