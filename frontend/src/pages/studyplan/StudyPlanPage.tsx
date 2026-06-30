import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CalendarDays, Plus, X, BookOpen, BrainCircuit, Layers, FileText, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { studyplanApi } from '../../api/studyplan.api';
import { analyticsApi } from '../../api/analytics.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const taskIcon: Record<string, any> = {
  lesson: BookOpen,
  quiz: BrainCircuit,
  flashcard_review: Layers,
  reading: FileText,
};

const taskRoute: Record<string, string> = {
  lesson: '/lessons',
  quiz: '/quizzes',
  flashcard_review: '/flashcards',
  reading: '/documents',
};

const priorityColor: Record<string, any> = { high: 'red', medium: 'yellow', low: 'green' };

export function StudyPlanPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [plan, setPlan] = useState<any>(null);

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: () => analyticsApi.getProgress().then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const masteryData = topics.map((t) => {
        const tm = progress?.topicMastery?.find((m: any) => m.topic.toLowerCase() === t.toLowerCase());
        return { topic: t, masteryScore: tm?.masteryScore ?? 0 };
      });
      return studyplanApi.generate({ goal, targetDate, topics, masteryData, hoursPerDay });
    },
    onSuccess: (res) => {
      setPlan(res.data.data);
      toast.success('Study plan generated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Generation failed'),
  });

  const addTopic = () => {
    const t = topicInput.trim();
    if (!t || topics.includes(t)) return;
    setTopics([...topics, t]);
    setTopicInput('');
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  if (plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.title}</h1>
            <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--text-muted)' }}>{plan.summary}</p>
          </div>
          <Button variant="outline" onClick={() => setPlan(null)}>
            <Plus className="w-4 h-4" /> New plan
          </Button>
        </div>

        <div className="space-y-3">
          {plan.plan.map((day: any) => (
            <div key={day.day} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-subtle)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                  {day.day}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{day.date}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{day.totalMinutes} min · {day.tasks.length} tasks</p>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {day.tasks.map((task: any, i: number) => {
                  const Icon = taskIcon[task.type] ?? Zap;
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(taskRoute[task.type] ?? '/dashboard')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:bg-[var(--bg-subtle)]"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--brand-light)' }}>
                        <Icon className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {task.topic} — <span className="capitalize">{task.type.replace('_', ' ')}</span>
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.rationale}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge label={`${task.durationMinutes}m`} color="gray" />
                        <Badge label={task.priority} color={priorityColor[task.priority]} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Learning Plan</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Tell GenLearn your goal and timeline — it will build a personalised day-by-day plan based on what you already know.
        </p>
      </div>

      <Card padding="lg" className="space-y-5">
        <Input
          label="What do you want to learn?"
          placeholder="e.g. Learn React Hooks in 2 weeks, Master SQL joins…"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Target date</label>
          <input
            type="date"
            min={minDateStr}
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Topics to cover</label>
          <div className="flex gap-2">
            <input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              placeholder="Add a topic and press Enter"
              className="flex-1 rounded-xl px-3 py-2.5 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
            <Button size="sm" variant="secondary" onClick={addTopic} disabled={!topicInput.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {topics.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                  {t}
                  <button onClick={() => setTopics(topics.filter((x) => x !== t))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {progress?.topicMastery?.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Your existing mastery will be factored in automatically for matched topics.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Study time per day: <span style={{ color: 'var(--brand)' }}>{hoursPerDay}h</span>
          </label>
          <input
            type="range" min={0.5} max={8} step={0.5}
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
            className="w-full accent-[var(--brand)]"
          />
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>30 min</span><span>8 hours</span>
          </div>
        </div>

        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!goal.trim() || !targetDate || topics.length === 0}
          className="w-full"
        >
          <CalendarDays className="w-4 h-4" />
          {mutation.isPending ? 'Building your plan…' : 'Generate plan'}
        </Button>
      </Card>
    </div>
  );
}
