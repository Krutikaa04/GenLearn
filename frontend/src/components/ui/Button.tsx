import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variants = {
  primary:
    'bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] shadow-sm hover:shadow-md active:scale-[0.98] focus-visible:ring-[var(--brand)]',
  secondary:
    'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border)] active:scale-[0.98]',
  outline:
    'border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:scale-[0.98]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] active:scale-[0.98]',
  danger:
    'bg-[var(--danger)] text-white hover:opacity-90 shadow-sm active:scale-[0.98] focus-visible:ring-[var(--danger)]',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
