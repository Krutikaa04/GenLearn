import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Plus, X, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { BadgeShowcase } from '../../components/gamification/BadgeShowcase';
import { JoinedClassroomsCard } from '../../components/classroom/JoinedClassroomsCard';
import { staggerContainer, staggerItem } from '../../lib/motion';

function DeleteAccountModal({ email, onClose, onConfirm, loading }: { email: string; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText.trim().toLowerCase() === email.toLowerCase();

  return (
    <Modal onClose={onClose} maxWidth="max-w-md" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Delete your account?</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This cannot be undone. All your documents, lessons, quizzes, and flashcards will remain associated with your
          account but you will lose access. Type <strong>{email}</strong> to confirm.
        </p>
        <input
          aria-label={`Type ${email} to confirm account deletion`}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={email}
          className="w-full rounded-xl px-3 py-2.5 text-sm ring-1 focus:ring-2 focus:ring-[var(--danger)] focus:outline-none"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
        />
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            disabled={!canDelete}
            className="flex-1"
          >
            Delete account
          </Button>
        </div>
    </Modal>
  );
}

const schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters').max(50),
  lastName: z.string().min(2, 'At least 2 characters').max(50),
  grade: z.string().max(100).optional(),
  preferredDifficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});
type Form = z.infer<typeof schema>;

export function ProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user, setAuth, accessToken, logout } = useAuthStore();
  const [goalInput, setGoalInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [emailInput, setEmailInput] = useState(() => user?.email ?? '');
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);

  const emailChangeMutation = useMutation({
    mutationFn: (newEmail: string) => authApi.changeEmail(newEmail),
    onSuccess: () => {
      setEmailChangeRequested(true);
      toast.success('Check your new email address to confirm the change');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not request email change'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      logout();
      navigate('/login');
      toast.success('Account deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not delete account'),
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', grade: '', preferredDifficulty: 'intermediate' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        grade: profile.profile?.grade ?? '',
        preferredDifficulty: profile.profile?.preferredDifficulty ?? 'intermediate',
      });
      setGoals(profile.profile?.learningGoals ?? []);
      setInterests(profile.profile?.interests ?? []);
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (data: Form) =>
      api.patch('/auth/me', { ...data, learningGoals: goals, interests }),
    onSuccess: (res) => {
      const updated = res.data.data;
      if (user && accessToken) {
        setAuth({ ...user, firstName: updated.firstName, lastName: updated.lastName }, accessToken);
      }
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Update failed'),
  });

  const addGoal = () => {
    const g = goalInput.trim();
    if (!g || goals.includes(g)) return;
    setGoals([...goals, g]);
    setGoalInput('');
  };

  const addInterest = () => {
    const i = interestInput.trim();
    if (!i || interests.includes(i)) return;
    setInterests([...interests, i]);
    setInterestInput('');
  };

  if (isLoading) return <div className="h-40 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>;

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <motion.div className="max-w-xl space-y-6" initial="hidden" animate="visible" variants={staggerContainer}>
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Account</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your profile and learning preferences.</p>
      </div>

      {/* Avatar + identity */}
      <motion.div variants={staggerItem}>
      <Card padding="lg" glass className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{ background: 'var(--brand)' }}>
          {initials}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          <p className="text-xs mt-0.5 capitalize px-2 py-0.5 rounded-full inline-block mt-1"
            style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
            {user?.role}
          </p>
        </div>
      </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
      <Card padding="lg" glass className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Email address</h2>
        {emailChangeRequested ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Check <strong>{emailInput}</strong> for a confirmation link. Your email won't change until you click it.
          </p>
        ) : (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="New email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              loading={emailChangeMutation.isPending}
              disabled={!emailInput.trim() || emailInput.trim().toLowerCase() === user?.email?.toLowerCase()}
              onClick={() => emailChangeMutation.mutate(emailInput.trim())}
            >
              Change email
            </Button>
          </div>
        )}
      </Card>
      </motion.div>

      <motion.form variants={staggerItem} onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <Card padding="lg" className="space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <User className="w-4 h-4 inline mr-1.5" />Personal info
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Grade / Year (optional)" placeholder="e.g. MCA 2nd year" {...register('grade')} />
        </Card>

        <Card padding="lg" className="space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Learning preferences</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="preferred-difficulty" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Preferred difficulty</label>
            <select
              id="preferred-difficulty"
              {...register('preferredDifficulty')}
              className="rounded-xl px-3 py-2.5 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Learning goals */}
          <div className="space-y-2">
            <label htmlFor="learning-goal-input" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Learning goals</label>
            <div className="flex gap-2">
              <input
                id="learning-goal-input"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                placeholder="Add a goal…"
                className="flex-1 rounded-xl px-3 py-2 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={addGoal} className="p-2.5 rounded-xl ring-1 hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-secondary)' }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {goals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {goals.map((g) => (
                  <span key={g} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                    {g}
                    <button type="button" onClick={() => setGoals(goals.filter((x) => x !== g))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <label htmlFor="interest-input" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Interests</label>
            <div className="flex gap-2">
              <input
                id="interest-input"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                placeholder="Add an interest…"
                className="flex-1 rounded-xl px-3 py-2 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={addInterest} className="p-2.5 rounded-xl ring-1 hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-secondary)' }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {interests.map((i) => (
                  <Badge key={i} label={i} color="gray" />
                ))}
              </div>
            )}
          </div>
        </Card>

        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!isDirty && goals.join() === (profile?.profile?.learningGoals ?? []).join() && interests.join() === (profile?.profile?.interests ?? []).join()}
          className="w-full"
        >
          Save changes
        </Button>
      </motion.form>

      <motion.div variants={staggerItem}>
        <BadgeShowcase />
      </motion.div>

      {user?.role === 'student' && (
        <motion.div variants={staggerItem}>
          <JoinedClassroomsCard />
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
      <Card padding="lg" className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
          <AlertTriangle className="w-4 h-4" />Danger zone
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Deleting your account is permanent and cannot be undone.
        </p>
        <Button type="button" variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete account
        </Button>
      </Card>
      </motion.div>

      {showDeleteModal && user && (
        <DeleteAccountModal
          email={user.email}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
        />
      )}
    </motion.div>
  );
}
