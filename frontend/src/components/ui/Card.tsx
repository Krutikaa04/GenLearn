import type { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { liftable } from '../../lib/motion';

interface CardProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
  > {
  hover?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ className = '', children, hover, glass, padding = 'none', style, ...props }: CardProps) {
  return (
    <motion.div
      className={`rounded-2xl border transition-shadow duration-150 ${
        hover ? 'hover:shadow-md hover:border-[var(--border-strong)] cursor-pointer' : ''
      } ${glass ? 'backdrop-blur-xl' : ''} ${paddings[padding]} ${className}`}
      style={{
        background: glass ? 'var(--glass-bg)' : 'var(--bg-surface)',
        borderColor: glass ? 'var(--glass-border)' : 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
      {...(hover ? liftable : {})}
      {...props}
    >
      {children}
    </motion.div>
  );
}
