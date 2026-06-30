import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Trash2, Clock, Loader2, ChevronDown, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { lessonsApi } from '../../api/lessons.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { MarkdownContent } from '../../components/ui/MarkdownContent';

const statusColor: Record<string, any> = { pending: 'gray', generating: 'yellow', ready: 'green', failed: 'red' };

function GenerateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');

  const mutation = useMutation({
    mutationFn: () => lessonsApi.generate({ topic, difficulty }),
    onSuccess: () => { toast.success('Lesson generation started'); qc.invalidateQueries({ queryKey: ['lessons'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Generate Lesson</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI will create a structured lesson on any topic</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <Input label="Topic" placeholder="e.g. Binary Search Trees, Photosynthesis…" value={topic} onChange={(e) => setTopic(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {['beginner', 'intermediate', 'advanced'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="py-2 rounded-xl text-sm font-medium border transition-all capitalize"
                style={difficulty === d
                  ? { background: 'var(--brand-light)', color: 'var(--brand)', borderColor: 'var(--brand)' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }
              >{d}</button>
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

function LessonViewer({ lesson }: { lesson: any }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <div style={{ color: 'var(--text-secondary)' }}>
        <MarkdownContent content={lesson.summary ?? ''} className="text-sm" />
      </div>

      <div className="space-y-2">
        {lesson.sections?.map((s: any, i: number) => (
          <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--bg-subtle)]"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.heading}</span>
              {expanded === i
                ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
              }
            </button>
            {expanded === i && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="pt-3" style={{ color: 'var(--text-secondary)' }}>
                  <MarkdownContent content={s.content ?? ''} className="text-sm" />
                </div>
                {s.keyPoints?.length > 0 && (
                  <ul className="space-y-1.5 pl-1">
                    {s.keyPoints.map((kp: string, j: number) => (
                      <li key={j} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="mt-0.5 shrink-0" style={{ color: 'var(--brand)' }}>•</span>{kp}
                      </li>
                    ))}
                  </ul>
                )}
                {s.codeExample && (
                  <pre className="rounded-xl p-4 text-xs overflow-auto leading-relaxed" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace' }}>
                    {s.codeExample}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {lesson.keyTakeaways?.length > 0 && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--brand-light)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand)' }}>Key Takeaways</p>
          <ul className="space-y-1.5">
            {lesson.keyTakeaways.map((t: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--brand)' }}>
                <span className="shrink-0">✓</span>{t}
              </li>
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Lessons</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>AI-generated lessons on any topic, any level</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Generate</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No lessons yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Generate your first lesson to begin</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson: any) => (
            <Card key={lesson.lessonId} className="overflow-hidden">
              <div
                className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors"
                onClick={() => {
                  if (lesson.status !== 'ready') return toast.error('Lesson is still generating');
                  setOpenId(openId === lesson.lessonId ? null : lesson.lessonId);
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand-light)' }}>
                  <BookOpen className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {lesson.title || lesson.topic}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge label={lesson.difficulty} color="purple" />
                    <Badge label={lesson.status} color={statusColor[lesson.status]} />
                    {lesson.estimatedReadMinutes && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3" />{lesson.estimatedReadMinutes} min
                      </span>
                    )}
                  </div>
                </div>
                {lesson.status === 'generating' && <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-1" style={{ color: 'var(--brand)' }} />}
                {lesson.status === 'ready' && (
                  openId === lesson.lessonId
                    ? <ChevronDown className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />
                    : <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete this lesson?')) deleteMutation.mutate(lesson.lessonId); }}
                  className="p-1.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--danger-light)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {openId === lesson.lessonId && lesson.sections && (
                <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <LessonViewer lesson={lesson} />
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
