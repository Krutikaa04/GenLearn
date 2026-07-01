import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /**
   * Renders a smaller, non-viewport-filling fallback for boundaries scoped to
   * a single component (e.g. a modal) rather than the whole app — so a crash
   * confined to that component doesn't visually read as the entire app going
   * down behind it.
   */
  compact?: boolean;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GenLearn] Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className={`flex flex-col items-center justify-center gap-4 p-8 text-center ${this.props.compact ? 'rounded-2xl' : 'min-h-screen'}`}
          style={{ background: 'var(--bg-subtle)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'var(--danger-light)' }}
          >
            ⚠
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Something went wrong
          </h1>
          <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
