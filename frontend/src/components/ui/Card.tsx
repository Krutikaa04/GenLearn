import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ className = '', children, hover, padding = 'none', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-150 ${
        hover ? 'hover:shadow-md hover:border-[var(--border-strong)] cursor-pointer active:scale-[0.99]' : ''
      } ${paddings[padding]} ${className}`}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
