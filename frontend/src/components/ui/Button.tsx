import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { pressable } from '../../lib/motion';

interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
  > {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants = {
  primary: 'text-white shadow-sm hover:shadow-[var(--shadow-glow)] focus-visible:ring-[var(--brand)]',
  secondary:
    'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]',
  outline:
    'border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--danger)] text-white hover:opacity-90 shadow-sm focus-visible:ring-[var(--danger)]',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, style, ...props }, ref) => (
    <motion.button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={variant === 'primary' ? { background: 'var(--brand-gradient)', ...style } : style}
      disabled={disabled || loading}
      {...(disabled || loading ? {} : pressable)}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </motion.button>
  ),
);
Button.displayName = 'Button';
