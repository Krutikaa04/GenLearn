import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GraduationCap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

type Status = 'loading' | 'success' | 'error';

export function ConfirmEmailChangePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Missing confirmation token.');
      return;
    }
    authApi.confirmEmailChange(token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error?.message || 'Confirmation failed — the link may have expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg)' }}>
      <div className="absolute top-4 right-4">
        <ThemeToggle compact />
      </div>

      <div className="w-full max-w-sm space-y-7">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand)' }}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>GenLearn</span>
        </div>

        <div className="text-center space-y-5">
          {status === 'loading' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--bg-subtle)' }}>
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Confirming…</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Please wait while we confirm your new email address.</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--brand-light)' }}>
                <CheckCircle className="w-7 h-7" style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Email updated!</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your account email address has been changed. Sign in with your new email.</p>
              </div>
              <Link
                to="/login"
                className="inline-block text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--brand)' }}
              >
                Sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Confirmation failed</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
              </div>
              <Link
                to="/profile"
                className="text-sm font-semibold hover:underline"
                style={{ color: 'var(--brand)' }}
              >
                Back to profile
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
