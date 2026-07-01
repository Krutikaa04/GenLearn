import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type Form = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      await authApi.forgotPassword(data.email);
    } catch {
      // Intentionally silent — don't leak whether the email exists
    }
    setSent(true);
  };

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

        {sent ? (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--brand-light)' }}>
              <CheckCircle className="w-7 h-7" style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Check your inbox</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                If that email is registered, you'll receive a password reset link shortly.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              style={{ color: 'var(--brand)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Forgot password?</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
                Send reset link
              </Button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
