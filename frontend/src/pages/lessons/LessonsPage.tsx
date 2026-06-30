import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Trash2, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { lessonsApi } from '../../api/lessons.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

const statusColor: Record<string, any> = { pending: 'gray', generating: 'yellow', ready: 'green', failed: 'red' };

function GenerateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');

  const mutation = useMutation({
    mutationFn: () => lessonsApi.generate({ topic, difficulty }),
    onSuccess: () => { toast.success('Lesson generation started'); qc.invalidateQueries({ queryKey: ['lessons'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Generate Lesson</h3>
        <Input label="Topic" placeholder="e.g. Binary Search Trees" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Difficulty</label>
          <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!topic.trim()}>Generate</Button>
        </div>
      </div>
    </div>
  );
}

function LessonDetail({ lesson }: { lesson: any }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-gray-600">{lesson.summary}</p>
      <div className="space-y-2">
        {lesson.sections?.map((s: any, i: number) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span className="font-medium text-gray-900 text-sm">{s.heading}</span>
              {expanded === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expanded === i && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">{s.content}</p>
                {s.keyPoints?.length > 0 && (
                  <ul className="space-y-1">
                    {s.keyPoints.map((kp: string, j: number) => (
                      <li key={j} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-violet-500 mt-0.5">•</span>{kp}
                      </li>
                    ))}
                  </ul>
                )}
                {s.codeExample && (
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto">{s.codeExample}</pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {lesson.keyTakeaways?.length > 0 && (
        <div className="bg-violet-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-violet-800 mb-2">Key Takeaways</p>
          <ul className="space-y-1">
            {lesson.keyTakeaways.map((t: string, i: number) => (
              <li key={i} className="text-sm text-violet-700 flex gap-2"><span>✓</span>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function LessonsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => lessonsApi.list().then((r) => r.data.data),
    refetchInterval: (q) => q.state.data?.some((l: any) => l.status === 'generating' || l.status === 'pending') ? 3000 : false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lessonsApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['lessons'] }); },
  });

  const openLesson = async (lesson: any) => {
    if (openId === lesson.lessonId) { setOpenId(null); return; }
    if (lesson.status !== 'ready') { toast.error('Lesson is not ready yet'); return; }
    setOpenId(lesson.lessonId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lessons</h1>
          <p className="text-gray-500 mt-1">AI-generated lessons on any topic</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Generate</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No lessons yet. Generate your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson: any) => (
            <Card key={lesson.lessonId} className="overflow-hidden">
              <div className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => openLesson(lesson)}>
                <BookOpen className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{lesson.title || lesson.topic}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge label={lesson.difficulty} color="violet" />
                    <Badge label={lesson.status} color={statusColor[lesson.status]} />
                    {lesson.estimatedReadMinutes && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />{lesson.estimatedReadMinutes} min
                      </span>
                    )}
                  </div>
                </div>
                {lesson.status === 'generating' && <Loader2 className="w-4 h-4 animate-spin text-violet-400 shrink-0" />}
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete lesson?')) deleteMutation.mutate(lesson.lessonId); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {openId === lesson.lessonId && lesson.sections && (
                <div className="border-t border-gray-100 p-4">
                  <LessonDetail lesson={lesson} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showModal && <GenerateModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
