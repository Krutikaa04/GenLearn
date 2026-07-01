import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import toast from 'react-hot-toast';
import { GraduationCap, Lock, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    try {
      await authApi.resetPassword(token, data.newPassword);
      toast.success('Password reset — please sign in');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Reset failed — the link may have expired');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg)' }}>
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Invalid reset link.</p>
          <Link to="/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

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

        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Set new password</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            icon={<Lock className="w-4 h-4" />}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat new password"
            icon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
            Reset password
          </Button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
