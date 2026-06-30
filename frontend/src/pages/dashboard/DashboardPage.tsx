import { useQuery } from '@tanstack/react-query';
import { FileText, BookOpen, BrainCircuit, Layers, TrendingUp, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import { analyticsApi } from '../../api/analytics.api';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';

function StatCard({ label, value, icon: Icon, to, color }: any) {
  return (
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
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {user?.firstName} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Here's your learning summary</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-medium"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Zap className="w-4 h-4" style={{ color: 'var(--warning)' }} />
          {data?.currentStreak ?? 0} day streak
        </div>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak */}
        <Card padding="lg">
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
        <Card padding="lg">
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
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${data?.overallMasteryScore ?? 0}%`, background: 'var(--brand)' }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Weak topics alert */}
      {weakTopics.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Needs attention</h2>
          </div>
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
