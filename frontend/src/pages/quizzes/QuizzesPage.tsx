import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, Plus, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Generate Quiz</h3>
        <Input label="Topic" placeholder="e.g. Recursion" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Difficulty</label>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Questions</label>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!topic.trim()}>Generate</Button>
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

  const submit = async () => {
    const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }));
    setSubmitting(true);
    try {
      const res = await quizzesApi.submit(quizId, payload);
      setResult(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  const quiz = data;

  return (
    <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl mx-auto p-6 space-y-6 my-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className={`rounded-xl p-5 text-center ${result.scorePercent >= 70 ? 'bg-green-50' : 'bg-orange-50'}`}>
              <p className="text-3xl font-bold text-gray-900">{result.scorePercent}%</p>
              <p className="text-sm text-gray-600">{result.correctCount} / {result.totalCount} correct</p>
            </div>
            {result.results?.map((r: any, i: number) => (
              <div key={i} className={`rounded-lg p-4 border ${r.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex gap-2 mb-2">
                  {r.isCorrect ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  <p className="text-sm font-medium text-gray-900">{r.questionText}</p>
                </div>
                {!r.isCorrect && <p className="text-xs text-gray-600 ml-6">{r.explanation}</p>}
              </div>
            ))}
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {quiz.questions?.map((q: any, i: number) => (
              <div key={q.questionId} className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{i + 1}. {q.text}</p>
                <div className="space-y-2">
                  {q.options?.map((opt: string, j: number) => (
                    <label key={j} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.questionId] === j ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name={q.questionId} checked={answers[q.questionId] === j} onChange={() => setAnswers((a) => ({ ...a, [q.questionId]: j }))} className="text-violet-600" />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button
              onClick={submit}
              loading={submitting}
              disabled={Object.keys(answers).length < (quiz.questions?.length ?? 0)}
              className="w-full"
            >
              Submit Quiz
            </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quizzes</h1>
          <p className="text-gray-500 mt-1">Test your knowledge with AI-generated quizzes</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Generate</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12">
          <BrainCircuit className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No quizzes yet. Generate your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz: any) => (
            <Card key={quiz.quizId} className="p-4 flex items-center gap-4">
              <BrainCircuit className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{quiz.title || quiz.topic}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge label={quiz.difficulty} color="violet" />
                  <Badge label={quiz.status} color={statusColor[quiz.status]} />
                  {quiz.questionCount && <span className="text-xs text-gray-400">{quiz.questionCount} questions</span>}
                </div>
              </div>
              {quiz.status === 'generating' && <Loader2 className="w-4 h-4 animate-spin text-violet-400 shrink-0" />}
              {quiz.status === 'ready' && (
                <Button size="sm" variant="secondary" onClick={() => setTakingId(quiz.quizId)}>Take Quiz</Button>
              )}
              <button
                onClick={() => { if (confirm('Delete quiz?')) deleteMutation.mutate(quiz.quizId); }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
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
