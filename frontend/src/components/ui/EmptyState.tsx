import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../lib/motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional action, e.g. a Button, rendered below the copy. */
  action?: ReactNode;
  /** Vertical rhythm — `sm` for in-card empties, `md` (default) for full-page. */
  size?: 'sm' | 'md';
  className?: string;
}

/** Shared empty-state block: icon + title + description + optional action. Keeps empties consistent. */
export function EmptyState({ icon: Icon, title, description, action, size = 'md', className = '' }: EmptyStateProps) {
  const iconSize = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  const pad = size === 'md' ? 'py-16' : 'py-12';
  return (
    <motion.div
      className={`text-center ${pad} ${className}`}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <Icon className={`${iconSize} mx-auto mb-3`} style={{ color: 'var(--border-strong)' }} aria-hidden="true" />
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </motion.div>
  );
}
