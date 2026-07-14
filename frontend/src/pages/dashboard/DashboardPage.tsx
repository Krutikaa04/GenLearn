import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, BookOpen, BrainCircuit, Layers, TrendingUp, ArrowRight, Zap, AlertTriangle, Sparkles, Compass, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { analyticsApi } from '../../api/analytics.api';
import { adaptiveApi } from '../../api/adaptive.api';
import { quizzesApi } from '../../api/quizzes.api';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/motion';

interface LearningPlan {
  status: 'active' | 'awaiting_topic';
  objective: string;
  topic: string | null;
  targetConcepts: string[];
  estimatedMinutes: number;
  recommendedLesson?: { needed?: boolean };
  recommendedQuiz?: { needed?: boolean };
}

/**
 * The primary learning action (Sprint 3): GenLearn has already planned the next
 * session, so "Continue Learning" starts it directly instead of asking the
 * learner to configure a quiz. Manual generation stays available below as the
 * secondary path for new topics / custom practice.
 */
function ContinueLearningCard({ plan }: { plan: LearningPlan }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const awaiting = plan.status === 'awaiting_topic';

  const continueLearning = async () => {
    if (awaiting) { navigate('/quizzes'); return; }
    setStarting(true);
    try {
      await quizzesApi.generateAdaptive();
      toast.success('Your next session is ready');
      navigate('/quizzes');
    } catch (err: any) {
      if (err?.response?.data?.error?.code === 'NO_ADAPTIVE_PLAN') {
        navigate(plan.topic ? `/quizzes?topic=${encodeURIComponent(plan.topic)}` : '/quizzes');
      } else {
        toast.error('Could not start the next session — try again from Quizzes.');
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <Card padding="lg" glass className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--brand-gradient)' }} />
      <div className="relative flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Compass className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand)' }}>
              {awaiting ? 'Start learning' : 'Continue learning'}
            </p>
          </div>
          <p className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{plan.objective}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
            {plan.topic && <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{plan.topic}</span>}
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />~{plan.estimatedMinutes} min</span>
            {plan.recommendedLesson?.needed && <span>· includes a short lesson</span>}
          </div>
        </div>
        <button
          onClick={continueLearning}
          disabled={starting}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--brand)' }}
        >
          {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {awaiting ? 'Choose a topic' : 'Continue learning'}
        </button>
      </div>
    </Card>
  );
}

interface Recommendation {
  decisionId: string;
  conceptId: string;
  topic: string;
  trigger: string;
  action: 'lesson' | 'quiz';
  difficulty: string;
  message: string;
}

function RecommendedNext({ rec }: { rec: Recommendation }) {
  const to = rec.action === 'lesson'
    ? `/lessons?topic=${encodeURIComponent(rec.topic)}`
    : `/quizzes?topic=${encodeURIComponent(rec.topic)}&difficulty=${encodeURIComponent(rec.difficulty)}`;
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl mb-3" style={{ background: 'var(--brand-light)' }}>
      <div className="flex items-start gap-2.5 min-w-0">
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--brand)' }} />
        <div className="min-w-0">
          <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--brand)' }}>Recommended next</p>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{rec.message}</p>
        </div>
      </div>
      <Link
        to={to}
        className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--brand)' }}
      >
        {rec.action === 'lesson' ? 'Start lesson' : 'Take quiz'}
      </Link>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, to, color }: any) {
  return (
    <motion.div variants={staggerItem}>
      <Link to={to}>
        <Card hover padding="md" className="group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </Card>
      </Link>
    </motion.div>
  );
}

function MasteryBar({ topic, score }: { topic: string; score: number }) {
  const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--brand)' : 'var(--warning)';
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{topic}</span>
        <span className="text-xs font-semibold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-subtle)' }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
        />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['progress'],
    queryFn: () => analyticsApi.getProgress().then((r) => r.data.data),
  });
  const { data: weakTopics = [] } = useQuery({
    queryKey: ['weak-topics'],
    queryFn: () => analyticsApi.getWeakTopics().then((r) => r.data.data),
  });
  const { data: recommendation } = useQuery<Recommendation | null>({
    queryKey: ['adaptive-recommendation'],
    queryFn: () => adaptiveApi.getRecommendation().then((r) => r.data.data),
  });
  const { data: plan } = useQuery<LearningPlan | null>({
    queryKey: ['learning-plan'],
    queryFn: () => adaptiveApi.getPlan().then((r) => r.data.data),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Documents', value: data?.totalDocumentsUploaded ?? 0, icon: FileText, to: '/documents', color: '#3b82f6' },
    { label: 'Lessons', value: data?.totalLessonsGenerated ?? 0, icon: BookOpen, to: '/lessons', color: '#10b981' },
    { label: 'Quizzes taken', value: data?.totalQuizzesTaken ?? 0, icon: BrainCircuit, to: '/quizzes', color: '#f59e0b' },
    { label: 'Flashcard sets', value: data?.totalFlashcardSetsCreated ?? 0, icon: Layers, to: '/flashcards', color: 'var(--brand)' },
  ];

  const quickActions = [
    { label: 'Upload document', to: '/documents', icon: FileText, desc: 'PDF, DOCX, TXT, MD' },
    { label: 'Generate lesson', to: '/lessons', icon: BookOpen, desc: 'Any topic, any level' },
    { label: 'Take a quiz', to: '/quizzes', icon: BrainCircuit, desc: 'Test your knowledge' },
    { label: 'Review flashcards', to: '/flashcards', icon: Layers, desc: 'Active recall practice' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative flex items-start justify-between overflow-hidden rounded-3xl px-1 py-1">
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--brand-gradient)' }}
        />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {user?.firstName} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Here's your learning summary</p>
        </div>
        <div
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-medium"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Zap className="w-4 h-4" style={{ color: 'var(--warning)' }} />
          {data?.currentStreak ?? 0} day streak
        </div>
      </div>

      {/* Continue Learning — the primary, AI-planned next session (Sprint 3) */}
      {plan && <ContinueLearningCard plan={plan} />}

      {/* Hero metrics — bento: mastery card wider than streak */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Streak */}
        <Card padding="lg" glass className="md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(245,158,11,0.12)' }}>
              🔥
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {data?.currentStreak ?? 0}
                <span className="text-base font-normal ml-1" style={{ color: 'var(--text-muted)' }}>days</span>
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Current streak · Best: {data?.longestStreak ?? 0} days
              </p>
            </div>
          </div>
        </Card>

        {/* Mastery */}
        <Card padding="lg" glass className="md:col-span-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--brand-light)' }}>
              <TrendingUp className="w-6 h-6" style={{ color: 'var(--brand)' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-end gap-2 mb-2">
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {data?.overallMasteryScore ?? 0}%
                </p>
                <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>overall mastery</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                <motion.div
                  className="h-2 rounded-full"
                  style={{ background: 'var(--brand-gradient)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${data?.overallMasteryScore ?? 0}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </motion.div>

      {/* Weak topics alert (+ adaptive recommendation when available) */}
      {(weakTopics.length > 0 || recommendation) && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Needs attention</h2>
          </div>
          {recommendation && <RecommendedNext rec={recommendation} />}
          <div className="space-y-2">
            {weakTopics.slice(0, 3).map((t: any) => (
              <div key={t.topic} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.topic}</p>
                  <div className="h-1.5 rounded-full mt-1" style={{ background: 'var(--bg-subtle)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${t.masteryScore}%`, background: 'var(--danger)' }} />
                  </div>
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--danger)' }}>{t.masteryScore}%</span>
                <div className="flex gap-1 shrink-0">
                  <Link
                    to={`/lessons?topic=${encodeURIComponent(t.topic)}`}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                  >Lesson</Link>
                  <Link
                    to={`/quizzes?topic=${encodeURIComponent(t.topic)}`}
                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}
                  >Quiz</Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Topic mastery */}
        {(data?.topicMastery?.length ?? 0) > 0 ? (
          <Card padding="lg">
            <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
              Topic Mastery
            </h2>
            <div className="space-y-4">
              {data.topicMastery.slice(0, 5).map((t: any) => (
                <MasteryBar key={t.topic} topic={t.topic} score={t.masteryScore} />
              ))}
            </div>
          </Card>
        ) : (
          <Card padding="lg" className="flex flex-col items-center justify-center text-center min-h-40">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No mastery data yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Take a quiz to start tracking</p>
          </Card>
        )}

        {/* Quick actions */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h2>
          <div className="space-y-1">
            {quickActions.map(({ label, to, icon: Icon, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-[var(--bg-subtle)] group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-light)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
