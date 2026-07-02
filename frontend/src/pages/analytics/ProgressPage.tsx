import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, BookOpen, BrainCircuit, Layers, FileText, Zap, AlertTriangle, BarChart3, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { analyticsApi } from '../../api/analytics.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

type SortKey = 'mastery' | 'name' | 'quizzes' | 'recent';
type SortDir = 'asc' | 'desc';

function AnimatedBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-subtle)' }}>
      <motion.div
        className="h-1.5 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 22 }}
      />
    </div>
  );
}

function masteryColor(score: number) {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--brand)';
  return 'var(--warning)';
}

function masteryBadgeColor(score: number): any {
  if (score >= 80) return 'green';
  if (score >= 50) return 'blue';
  return 'yellow';
}

function StatTile({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

export function ProgressPage() {
  const [sortKey, setSortKey] = useState<SortKey>('mastery');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => analyticsApi.getProgress().then((r) => r.data.data),
  });

  const { data: weakTopics = [] } = useQuery({
    queryKey: ['weak-topics'],
    queryFn: () => analyticsApi.getWeakTopics().then((r) => r.data.data),
  });

  const allTopics: any[] = data?.topicMastery ?? [];

  const filtered = allTopics.filter((t) =>
    !search || t.topic.toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'mastery') cmp = a.masteryScore - b.masteryScore;
    else if (sortKey === 'name') cmp = a.topic.localeCompare(b.topic);
    else if (sortKey === 'quizzes') cmp = (a.quizzesTaken ?? 0) - (b.quizzesTaken ?? 0);
    else if (sortKey === 'recent') {
      const aDate = a.lastAttemptAt ? new Date(a.lastAttemptAt).getTime() : 0;
      const bDate = b.lastAttemptAt ? new Date(b.lastAttemptAt).getTime() : 0;
      cmp = aDate - bDate;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const overallLevel =
    (data?.overallMasteryScore ?? 0) >= 80
      ? 'Expert'
      : (data?.overallMasteryScore ?? 0) >= 50
      ? 'Intermediate'
      : 'Beginner';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Progress</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Full topic mastery breakdown and learning activity</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Zap className="w-4 h-4" style={{ color: 'var(--warning)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{data?.currentStreak ?? 0}</span>
          <span>day streak</span>
        </div>
      </div>

      {/* Overview tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card padding="md" glass className="flex items-center gap-3 md:col-span-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--brand-light)' }}>
            <TrendingUp className="w-6 h-6" style={{ color: 'var(--brand)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-2 mb-1.5">
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{data?.overallMasteryScore ?? 0}%</p>
              <Badge label={overallLevel} color={masteryBadgeColor(data?.overallMasteryScore ?? 0)} />
            </div>
            <AnimatedBar percent={data?.overallMasteryScore ?? 0} color="var(--brand)" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Overall mastery · {allTopics.length} topic{allTopics.length !== 1 ? 's' : ''} tracked</p>
          </div>
        </Card>
        <StatTile label="Quizzes taken" value={data?.totalQuizzesTaken ?? 0} icon={BrainCircuit} color="#f59e0b" />
        <StatTile label="Streak best" value={`${data?.longestStreak ?? 0}d`} icon={Zap} color="#f59e0b" />
        <StatTile label="Lessons" value={data?.totalLessonsGenerated ?? 0} icon={BookOpen} color="#10b981" />
        <StatTile label="Flashcard sets" value={data?.totalFlashcardSetsCreated ?? 0} icon={Layers} color="var(--brand)" />
        <StatTile label="Documents" value={data?.totalDocumentsUploaded ?? 0} icon={FileText} color="#3b82f6" />
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Needs attention</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              {weakTopics.length} topic{weakTopics.length !== 1 ? 's' : ''} below 60%
            </span>
          </div>
          <div className="space-y-3">
            {weakTopics.map((t: any) => (
              <div key={t.topic} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.topic}</p>
                    <span className="text-xs font-semibold ml-2 shrink-0" style={{ color: 'var(--danger)' }}>{t.masteryScore}%</span>
                  </div>
                  <AnimatedBar percent={t.masteryScore} color="var(--danger)" />
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.quizzesTaken} quiz{t.quizzesTaken !== 1 ? 'zes' : ''} taken</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link to={`/lessons?topic=${encodeURIComponent(t.topic)}`} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                    Lesson
                  </Link>
                  <Link to={`/quizzes?topic=${encodeURIComponent(t.topic)}`} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                    Quiz
                  </Link>
                  <Link to={`/flashcards?topic=${encodeURIComponent(t.topic)}`} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    Cards
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Full topic table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <BarChart3 className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
            All Topics {allTopics.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({allTopics.length})</span>}
          </h2>
          {allTopics.length > 4 && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter topics…"
              className="text-xs px-3 py-1.5 rounded-lg ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none w-40"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            />
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 mx-auto animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
          </div>
        ) : allTopics.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-3xl mb-3">📊</div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No topics tracked yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Take quizzes to start building your mastery profile</p>
            <Link to="/quizzes" className="inline-block mt-4 text-xs px-4 py-2 rounded-xl font-medium" style={{ background: 'var(--brand)', color: '#fff' }}>
              Generate a quiz
            </Link>
          </div>
        ) : (
          <>
            {/* Sort bar */}
            <div className="flex gap-1 px-4 py-2 border-b text-xs font-medium" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
              {([
                { key: 'name' as SortKey, label: 'Topic' },
                { key: 'mastery' as SortKey, label: 'Mastery' },
                { key: 'quizzes' as SortKey, label: 'Quizzes' },
                { key: 'recent' as SortKey, label: 'Last attempt' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
                  style={sortKey === key
                    ? { background: 'var(--brand-light)', color: 'var(--brand)' }
                    : { color: 'var(--text-muted)' }
                  }
                >
                  {label}
                  {sortKey === key && <ArrowUpDown className="w-3 h-3" />}
                </button>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {sorted.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No topics match "{search}"</p>
                </div>
              ) : (
                sorted.map((t) => {
                  const color = masteryColor(t.masteryScore);
                  const lastDate = t.lastAttemptAt ? new Date(t.lastAttemptAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                  return (
                    <div key={t.topic} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '15' }}>
                        <BrainCircuit className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.topic}</p>
                          <span className="text-sm font-bold ml-2 shrink-0" style={{ color }}>{t.masteryScore}%</span>
                        </div>
                        <AnimatedBar percent={t.masteryScore} color={color} />
                      </div>
                      <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5 min-w-24">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.quizzesTaken ?? 0} quiz{(t.quizzesTaken ?? 0) !== 1 ? 'zes' : ''}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lastDate}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Link to={`/quizzes?topic=${encodeURIComponent(t.topic)}`} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                          Quiz
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
