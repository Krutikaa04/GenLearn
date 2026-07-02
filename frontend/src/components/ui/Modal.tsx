import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useModalA11y } from './useModalA11y';
import { ErrorBoundary } from '../ErrorBoundary';
import { scaleIn } from '../../lib/motion';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

/**
 * Shared centered dialog: glass backdrop blur, spring scale-in panel, focus
 * trap + Escape-to-close (via useModalA11y), and an ErrorBoundary around the
 * panel content so a failure inside a modal never takes down the whole page.
 */
export function Modal({ onClose, children, maxWidth = 'max-w-lg', className = '' }: ModalProps) {
  const panelRef = useModalA11y(onClose);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <ErrorBoundary compact>
        <motion.div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className={`w-full ${maxWidth} rounded-2xl border backdrop-blur-xl ${className}`}
          style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', boxShadow: 'var(--shadow-lg)' }}
          initial="hidden"
          animate="visible"
          variants={scaleIn}
        >
          {children}
        </motion.div>
      </ErrorBoundary>
    </motion.div>
  );
}
