import { motion } from 'framer-motion';
import { scaleIn } from '../../lib/motion';

interface BadgeProps {
  label: string;
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size?: 'sm' | 'md';
  pop?: boolean;
}

const colors = {
  gray:   { bg: 'var(--bg-subtle)',       text: 'var(--text-secondary)', border: 'var(--border)' },
  blue:   { bg: '#dbeafe',                text: '#1d4ed8',               border: '#bfdbfe' },
  green:  { bg: 'var(--success-light)',   text: 'var(--success)',        border: 'transparent' },
  yellow: { bg: 'var(--warning-light)',   text: 'var(--warning)',        border: 'transparent' },
  red:    { bg: 'var(--danger-light)',    text: 'var(--danger)',         border: 'transparent' },
  purple: { bg: 'var(--brand-light)',     text: 'var(--brand)',          border: 'transparent' },
};

export function Badge({ label, color = 'gray', size = 'sm', pop }: BadgeProps) {
  const c = colors[color];
  const className = `inline-flex items-center font-medium rounded-full border ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`;
  const style = { background: c.bg, color: c.text, borderColor: c.border };

  if (pop) {
    return (
      <motion.span
        className={className}
        style={style}
        initial="hidden"
        animate="visible"
        variants={scaleIn}
      >
        {label}
      </motion.span>
    );
  }

  return (
    <span className={className} style={style}>
      {label}
    </span>
  );
}
