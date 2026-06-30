import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, Plus, Trash2, Loader2, CheckCircle, XCircle, X, Trophy, Zap, AlertTriangle, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quizzesApi } from '../../api/quizzes.api';
import { analyticsApi } from '../../api/analytics.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

const statusColor: Record<string, any> = { pending: 'gray', generating: 'yellow', ready: 'green', failed: 'red' };

function GenerateModal({ onClose, defaultTopic = '' }: { onClose: () => void; defaultTopic?: string }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'normal' | 'challenge'>('normal');
  const [topic, setTopic] = useState(defaultTopic);
  const [difficulty, setDifficulty] = useState('beginner');
  const [count, setCount] = useState(10);
  const [topicInput, setTopicInput] = useState('');
  const [challengeTopics, setChallengeTopics] = useState<string[]>(defaultTopic ? [defaultTopic] : []);
  const [timeLimit, setTimeLimit] = useState(15);

  const mutation = useMutation({
    mutationFn: () => quizzesApi.generate({
      topic: mode === 'challenge' ? (challengeTopics[0] ?? 'General') : topic,
      difficulty,
      questionCount: count,
      challengeMode: mode === 'challenge',
      challengeTopics: mode === 'challenge' ? challengeTopics : undefined,
      timeLimitMinutes: mode === 'challenge' ? timeLimit : undefined,
    }),
    onSuccess: () => { toast.success('Quiz generation started'); qc.invalidateQueries({ queryKey: ['quizzes'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const addChallengeTopic = () => {
    const t = topicInput.trim();
    if (!t || challengeTopics.includes(t)) return;
    setChallengeTopics([...challengeTopics, t]);
    setTopicInput('');
  };

  const canGenerate = mode === 'normal' ? !!topic.trim() : challengeTopics.length > 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-5 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Generate Quiz</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI-powered MCQ with detailed explanations</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMode('normal')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={mode === 'normal'
              ? { background: 'var(--brand-light)', color: 'var(--brand)', borderColor: 'var(--brand)' }
              : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
            }>
            <BrainCircuit className="w-4 h-4" /> Normal
          </button>
          <button onClick={() => setMode('challenge')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={mode === 'challenge'
              ? { background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', borderColor: 'var(--warning)' }
              : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
            }>
            <Zap className="w-4 h-4" /> Challenge
          </button>
        </div>

        {mode === 'normal' ? (
          <Input label="Topic" placeholder="e.g. Recursion, World War II…" value={topic} onChange={(e) => setTopic(e.target.value)} />
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Topics (ordered by priority)</label>
            <div className="flex gap-2">
              <input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChallengeTopic()}
                placeholder="Add topic, press Enter"
                className="flex-1 rounded-xl px-3 py-2 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <Button size="sm" variant="secondary" onClick={addChallengeTopic} disabled={!topicInput.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {challengeTopics.map((t, i) => (
                <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                  {i === 0 && <span className="font-bold">↑</span>} {t}
                  <button onClick={() => setChallengeTopics(challengeTopics.filter((x) => x !== t))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Time limit: <span style={{ color: 'var(--warning)' }}>{timeLimit} min</span></label>
              <input type="range" min={5} max={90} step={5} value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {['beginner', 'intermediate', 'advanced'].map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className="py-2 rounded-xl text-sm font-medium border transition-all capitalize"
                style={difficulty === d
                  ? { background: 'var(--brand-light)', color: 'var(--brand)', borderColor: 'var(--brand)' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }>{d}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Questions</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button key={n} onClick={() => setCount(n)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                style={count === n
                  ? { background: 'var(--brand-light)', color: 'var(--brand)', borderColor: 'var(--brand)' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }>{n}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!canGenerate} className="flex-1">Generate</Button>
        </div>
      </div>
    </div>
  );
}

function WeakTopicsPanel({ topic }: { topic: string }) {
  const navigate = useNavigate();
  const { data: weakTopics = [] } = useQuery({
    queryKey: ['weak-topics'],
    queryFn: () => analyticsApi.getWeakTopics().then((r) => r.data.data),
  });

  const relevant = weakTopics.filter((t: any) =>
    t.topic.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(t.topic.toLowerCase())
  );
  const others = weakTopics.filter((t: any) => !relevant.includes(t)).slice(0, 2);
  const show = [...relevant, ...others].slice(0, 3);

  if (show.length === 0) return null;

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)' }}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>Topics to revisit</p>
      </div>
      {show.map((t: any) => (
        <div key={t.topic} className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.topic}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.masteryScore}% mastery · {t.quizzesTaken} quizzes</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => navigate(`/lessons?topic=${encodeURIComponent(t.topic)}`)}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
            >Lesson</button>
            <button
              onClick={() => navigate(`/flashcards?topic=${encodeURIComponent(t.topic)}`)}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >Cards</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewModal({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['quiz-review', quizId],
    queryFn: () => quizzesApi.reviewQuiz(quizId).then((r) => r.data.data),
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xl rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Quiz Results</h3>
            {data && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{data.score} of {data.totalQuestions} correct</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : data ? (
            <>
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: data.scorePercent >= 70 ? 'var(--success-light)' : 'var(--warning-light)' }}>
                  <Trophy className="w-7 h-7" style={{ color: data.scorePercent >= 70 ? 'var(--success)' : 'var(--warning)' }} />
                </div>
                <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.scorePercent}%</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{data.score} of {data.totalQuestions} correct</p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(data.answers ?? []).map((r: any, i: number) => (
                  <div key={i} className="rounded-xl p-3 border flex gap-2" style={{
                    background: r.isCorrect ? 'var(--success-light)' : 'var(--danger-light)',
                    borderColor: r.isCorrect ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {r.isCorrect
                      ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                      : <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.questionText}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Your answer: {r.options?.[r.selectedIndex] ?? '—'}
                      </p>
                      {!r.isCorrect && r.correctIndex !== undefined && r.options?.[r.correctIndex] && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--success)' }}>
                          ✓ {r.options[r.correctIndex]}
                        </p>
                      )}
                      {!r.isCorrect && r.explanation && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-sm py-4" style={{ color: 'var(--text-muted)' }}>Failed to load results</p>
          )}

          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

function QuizTaker({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizzesApi.getById(quizId).then((r) => r.data.data),
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const quiz = data;
  const isChallenge = quiz?.challengeMode;

  const submit = async () => {
    const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }));
    setSubmitting(true);
    try {
      const res = await quizzesApi.submit(quizId, payload);
      setResult(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Keep a stable ref so the interval closure always calls the latest submit
  const submitRef = useRef(submit);
  submitRef.current = submit;

  // Initialise the countdown once the quiz data arrives
  useEffect(() => {
    if (quiz?.timeLimitMinutes && timeLeft === null) {
      setTimeLeft(quiz.timeLimitMinutes * 60);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz?.timeLimitMinutes]);

  // Countdown tick — one interval per second, properly cleaned up
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft === 0) {
      toast('Time\'s up! Submitting…', { icon: '⏱' });
      submitRef.current();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timeLeft, result]);

  if (isLoading) return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  const questions = quiz?.questions ?? [];
  const q = questions[current];
  const total = questions.length;
  const answered = Object.keys(answers).length;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const timeWarning = timeLeft !== null && timeLeft < 60;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xl rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{quiz?.title}</h3>
              {isChallenge && <Badge label="Challenge" color="yellow" />}
            </div>
            {!result && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{answered}/{total} answered</p>}
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && !result && (
              <span className="text-sm font-bold font-mono px-2.5 py-1 rounded-lg" style={{
                background: timeWarning ? 'var(--danger-light)' : 'var(--bg-subtle)',
                color: timeWarning ? 'var(--danger)' : 'var(--text-primary)',
              }}>
                {formatTime(timeLeft)}
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
          </div>
        </div>

        {result ? (
          <div className="p-6 space-y-5">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: result.scorePercent >= 70 ? 'var(--success-light)' : 'var(--warning-light)' }}>
                <Trophy className="w-8 h-8" style={{ color: result.scorePercent >= 70 ? 'var(--success)' : 'var(--warning)' }} />
              </div>
              <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{result.scorePercent}%</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{result.score} of {result.totalQuestions} correct</p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(result.answers ?? []).map((r: any, i: number) => (
                <div key={i} className="rounded-xl p-3 border flex gap-2" style={{
                  background: r.isCorrect ? 'var(--success-light)' : 'var(--danger-light)',
                  borderColor: r.isCorrect ? 'var(--success)' : 'var(--danger)',
                }}>
                  {r.isCorrect
                    ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                    : <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.questionText}</p>
                    {!r.isCorrect && r.correctIndex !== undefined && (
                      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--success)' }}>
                        ✓ {questions[questions.findIndex((q: any) => q.questionId === r.questionId)]?.options?.[r.correctIndex]}
                      </p>
                    )}
                    {!r.isCorrect && r.explanation && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <WeakTopicsPanel topic={quiz?.topic ?? ''} />
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / total) * 100}%`, background: isChallenge ? 'var(--warning)' : 'var(--brand)' }} />
            </div>

            <div>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Question {current + 1} of {total}</p>
              <p className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{q?.text}</p>
            </div>

            <div className="space-y-2">
              {q?.options?.map((opt: string, j: number) => (
                <button
                  key={j}
                  onClick={() => !isChallenge || answers[q.questionId] === undefined
                    ? setAnswers((a) => ({ ...a, [q.questionId]: j }))
                    : undefined
                  }
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
                  style={answers[q.questionId] === j
                    ? { background: isChallenge ? 'rgba(245,158,11,0.12)' : 'var(--brand-light)', borderColor: isChallenge ? 'var(--warning)' : 'var(--brand)', color: isChallenge ? 'var(--warning)' : 'var(--brand)' }
                    : { background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-primary)' }
                  }
                >
                  <span className="w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0"
                    style={answers[q.questionId] === j
                      ? { background: isChallenge ? 'var(--warning)' : 'var(--brand)', borderColor: 'transparent', color: '#fff' }
                      : { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }
                    }>
                    {['A','B','C','D'][j]}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {!isChallenge && (
                <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="flex-1">Previous</Button>
              )}
              {current < total - 1
                ? <Button
                    onClick={() => setCurrent((c) => c + 1)}
                    disabled={answers[q?.questionId] === undefined}
                    className="flex-1"
                    style={isChallenge ? { background: 'var(--warning)' } : undefined}
                  >Next</Button>
                : <Button
                    onClick={submit}
                    loading={submitting}
                    disabled={answered < total}
                    className="flex-1"
                  >Submit Quiz</Button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuizzesPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultTopic = searchParams.get('topic') ?? '';
  const [showModal, setShowModal] = useState(!!defaultTopic);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => quizzesApi.list().then((r) => r.data.data),
    refetchInterval: (q) => q.state.data?.some((q: any) => q.status === 'generating' || q.status === 'pending') ? 3000 : false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizzesApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['quizzes'] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Quizzes</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Test your knowledge · Challenge mode for timed pressure tests</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Generate</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16">
          <BrainCircuit className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No quizzes yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Generate your first quiz to start testing</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz: any) => (
            <Card key={quiz.quizId} padding="md" className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: quiz.challengeMode ? 'rgba(245,158,11,0.12)' : 'rgba(124,58,237,0.1)' }}>
                {quiz.challengeMode
                  ? <Zap className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                  : <BrainCircuit className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{quiz.title || quiz.topic}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge label={quiz.difficulty} color="purple" />
                  <Badge label={quiz.status} color={statusColor[quiz.status]} />
                  {quiz.challengeMode && <Badge label="Challenge" color="yellow" />}
                  {quiz.timeLimitMinutes && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{quiz.timeLimitMinutes}min limit</span>}
                  {quiz.questionCount && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{quiz.questionCount}q</span>}
                  {quiz.status === 'submitted' && quiz.score != null && quiz.questionCount && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: quiz.score / quiz.questionCount >= 0.7 ? 'var(--success-light)' : 'var(--warning-light)',
                        color: quiz.score / quiz.questionCount >= 0.7 ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      {Math.round((quiz.score / quiz.questionCount) * 100)}%
                    </span>
                  )}
                </div>
              </div>
              {quiz.status === 'generating' && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--brand)' }} />}
              {quiz.status === 'ready' && (
                <Button size="sm" variant={quiz.challengeMode ? 'secondary' : 'secondary'} onClick={() => setTakingId(quiz.quizId)}
                  style={quiz.challengeMode ? { background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: '1px solid var(--warning)' } : undefined}>
                  {quiz.challengeMode ? <><Zap className="w-3.5 h-3.5" /> Challenge</> : 'Take Quiz'}
                </Button>
              )}
              {quiz.status === 'submitted' && (
                <Button size="sm" variant="outline" onClick={() => setReviewId(quiz.quizId)}>
                  <ClipboardList className="w-3.5 h-3.5" /> Results
                </Button>
              )}
              <button
                onClick={() => { if (confirm('Delete this quiz?')) deleteMutation.mutate(quiz.quizId); }}
                className="p-1.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--danger-light)]"
                style={{ color: 'var(--text-muted)' }}
              ><Trash2 className="w-4 h-4" /></button>
            </Card>
          ))}
        </div>
      )}

      {showModal && <GenerateModal onClose={() => setShowModal(false)} defaultTopic={defaultTopic} />}
      {takingId && <QuizTaker quizId={takingId} onClose={() => { setTakingId(null); qc.invalidateQueries({ queryKey: ['quizzes'] }); }} />}
      {reviewId && <ReviewModal quizId={reviewId} onClose={() => setReviewId(null)} />}
    </div>
  );
}
