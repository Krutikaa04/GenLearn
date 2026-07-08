import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, User, BookOpen, Presentation } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});
type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      await authApi.register({ ...data, role });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: 'var(--bg)' }}>
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
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start learning with AI in minutes</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role selector */}
          <div>
            <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>I am a</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'student', label: 'Student', icon: BookOpen },
                { value: 'teacher', label: 'Teacher', icon: Presentation },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  style={role === value
                    ? { background: 'var(--brand-light)', borderColor: 'var(--brand)', color: 'var(--brand)' }
                    : { background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="Rishi"
              icon={<User className="w-4 h-4" />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              placeholder="Mahajan"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
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
            placeholder="Min. 8 characters"
            icon={<Lock className="w-4 h-4" />}
            hint="Use at least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
            Create free account
          </Button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
