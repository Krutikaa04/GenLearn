import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg)' }}>
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--brand-light)' }}>
          <GraduationCap className="w-8 h-8" style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <p className="text-6xl font-bold mb-2" style={{ color: 'var(--brand)' }}>404</p>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            The page you're looking for doesn't exist or has moved.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand)' }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
