import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  /** Icon diameter in px. Defaults to 24 (w-6/h-6). */
  size?: number;
  /** Wrap in a centered block with vertical padding — use for full-section loading states. */
  center?: boolean;
  className?: string;
  color?: string;
  label?: string;
}

/** Shared loading spinner. Use `center` for page/section loaders to keep them uniform app-wide. */
export function Spinner({ size = 24, center, className = '', color = 'var(--text-muted)', label = 'Loading' }: SpinnerProps) {
  const icon = (
    <Loader2
      className={`animate-spin ${className}`}
      style={{ width: size, height: size, color }}
      role="status"
      aria-label={label}
    />
  );
  if (!center) return icon;
  return <div className="flex justify-center py-16">{icon}</div>;
}
