import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, Sparkles } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      const res = await authApi.login(data);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{ background: 'var(--brand)', backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">GenLearn</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            {[
              { icon: '🧠', text: 'AI-powered lessons tailored to you' },
              { icon: '📊', text: 'Track mastery across every topic' },
              { icon: '⚡', text: 'Generate quizzes from your own documents' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-white/90">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          <blockquote className="border-l-2 border-white/30 pl-4">
            <p className="text-white/80 text-sm italic">
              "The best way to learn is to teach yourself — GenLearn makes that effortless."
            </p>
          </blockquote>
        </div>

        <p className="text-white/40 text-xs">© 2025 GenLearn · MCA Final Year Project</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle compact />
        </div>

        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand)' }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>GenLearn</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to continue learning</p>
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
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
