import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, Plus, Trash2, Loader2, CheckCircle, XCircle, X, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizzesApi } from '../../api/quizzes.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

const statusColor: Record<string, any> = { pending: 'gray', generating: 'yellow', ready: 'green', failed: 'red' };

function GenerateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [count, setCount] = useState(10);

  const mutation = useMutation({
    mutationFn: () => quizzesApi.generate({ topic, difficulty, questionCount: count }),
    onSuccess: () => { toast.success('Quiz generation started'); qc.invalidateQueries({ queryKey: ['quizzes'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Generate Quiz</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI will create MCQ questions with explanations</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <Input label="Topic" placeholder="e.g. Recursion, World War II…" value={topic} onChange={(e) => setTopic(e.target.value)} />

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
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Number of questions</label>
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
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!topic.trim()} className="flex-1">Generate</Button>
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

  if (isLoading) return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  const quiz = data;
  const questions = quiz?.questions ?? [];
  const q = questions[current];
  const total = questions.length;
  const answered = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xl rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{quiz.title}</h3>
            {!result && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{answered}/{total} answered</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        {result ? (
          /* Results */
          <div className="p-6 space-y-5">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: result.scorePercent >= 70 ? 'var(--success-light)' : 'var(--warning-light)' }}>
                <Trophy className="w-8 h-8" style={{ color: result.scorePercent >= 70 ? 'var(--success)' : 'var(--warning)' }} />
              </div>
              <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{result.scorePercent}%</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {result.correctCount} of {result.totalCount} correct
              </p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {result.results?.map((r: any, i: number) => (
                <div key={i} className="rounded-xl p-3.5 border" style={{
                  background: r.isCorrect ? 'var(--success-light)' : 'var(--danger-light)',
                  borderColor: r.isCorrect ? 'var(--success)' : 'var(--danger)',
                  borderOpacity: 0.3,
                }}>
                  <div className="flex gap-2">
                    {r.isCorrect
                      ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                      : <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                    }
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.questionText}</p>
                      {!r.isCorrect && r.explanation && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          /* Question */
          <div className="p-6 space-y-5">
            {/* Progress bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / total) * 100}%`, background: 'var(--brand)' }} />
            </div>

            <div>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                Question {current + 1} of {total}
              </p>
              <p className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{q?.text}</p>
            </div>

            <div className="space-y-2">
              {q?.options?.map((opt: string, j: number) => (
                <button
                  key={j}
                  onClick={() => setAnswers((a) => ({ ...a, [q.questionId]: j }))}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all"
                  style={answers[q.questionId] === j
                    ? { background: 'var(--brand-light)', borderColor: 'var(--brand)', color: 'var(--brand)' }
                    : { background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-primary)' }
                  }
                >
                  <span className="w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0"
                    style={answers[q.questionId] === j
                      ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: '#fff' }
                      : { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }
                    }>
                    {['A','B','C','D'][j]}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="flex-1">Previous</Button>
              {current < total - 1
                ? <Button onClick={() => setCurrent((c) => c + 1)} disabled={answers[q?.questionId] === undefined} className="flex-1">Next</Button>
                : <Button onClick={submit} loading={submitting} disabled={answered < total} className="flex-1">Submit Quiz</Button>
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
  const [showModal, setShowModal] = useState(false);
  const [takingId, setTakingId] = useState<string | null>(null);

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
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Test your knowledge with AI-generated questions</p>
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
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <BrainCircuit className="w-4 h-4" style={{ color: 'var(--warning)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{quiz.title || quiz.topic}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge label={quiz.difficulty} color="purple" />
                  <Badge label={quiz.status} color={statusColor[quiz.status]} />
                  {quiz.questionCount && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{quiz.questionCount} questions</span>}
                </div>
              </div>
              {quiz.status === 'generating' && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--brand)' }} />}
              {quiz.status === 'ready' && (
                <Button size="sm" variant="secondary" onClick={() => setTakingId(quiz.quizId)}>Take Quiz</Button>
              )}
              <button
                onClick={() => { if (confirm('Delete this quiz?')) deleteMutation.mutate(quiz.quizId); }}
                className="p-1.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--danger-light)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showModal && <GenerateModal onClose={() => setShowModal(false)} />}
      {takingId && <QuizTaker quizId={takingId} onClose={() => setTakingId(null)} />}
    </div>
  );
}
