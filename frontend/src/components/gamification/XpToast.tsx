import { motion } from 'framer-motion';
import type { Toast } from 'react-hot-toast';
import { Zap, Award } from 'lucide-react';
import { springSnappy } from '../../lib/motion';

interface XpToastProps {
  toast: Toast;
  xpGained?: number;
  badgeName?: string;
}

export function XpToast({ toast, xpGained, badgeName }: XpToastProps) {
  const isBadge = !!badgeName;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: toast.visible ? 1 : 0, y: 0, scale: 1 }}
      transition={springSnappy}
      className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.12))' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isBadge ? 'var(--brand-light)' : 'var(--warning-light)' }}
      >
        {isBadge ? (
          <Award className="w-5 h-5" style={{ color: 'var(--brand)' }} />
        ) : (
          <Zap className="w-5 h-5" style={{ color: 'var(--warning)' }} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {isBadge ? 'Badge unlocked!' : 'XP earned'}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {isBadge ? badgeName : `+${xpGained} XP`}
        </p>
      </div>
    </motion.div>
  );
}
