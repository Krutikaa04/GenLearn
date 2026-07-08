import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, ArrowLeft, TrendingUp, BrainCircuit, Zap, FileText, UserMinus, X, AlertTriangle,
} from 'lucide-react';
import { classroomsApi } from '../../api/classrooms.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { JoinCodeChip } from './ClassroomsPage';

interface StudentRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  progress: {
    overallMasteryScore: number;
    currentStreak: number;
    totalQuizzesTaken: number;
    xpTotal: number;
    level: number;
    lastActiveDate: string | null;
  };
  weakTopics: { topic: string; masteryScore: number }[];
}

function masteryColor(score: number) {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--brand)';
  return 'var(--warning)';
}

function StatTile({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <Card padding="md" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </Card>
  );
}

function StudentReportModal({ classroomId, student, onClose }: { classroomId: string; student: StudentRow; onClose: () => void }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ['classroom-report', classroomId, student.userId],
    queryFn: () => classroomsApi.getStudentReport(classroomId, student.userId).then((r) => r.data.data),
  });

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl" className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {student.firstName} {student.lastName}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{student.email}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading report…</p>
      ) : !report ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Could not load report.</p>
      ) : (
        <>
          {/* Progress summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
              <p className="text-lg font-bold" style={{ color: masteryColor(report.progress.overallMasteryScore) }}>
                {report.progress.overallMasteryScore}%
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Overall mastery</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{report.progress.currentStreak}d</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current streak</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{report.progress.totalQuizzesTaken}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quizzes taken</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Lv {report.progress.level}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{report.progress.xpTotal} XP</p>
            </div>
          </div>

          {/* Weak topics */}
          {report.weakTopics.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Needs attention</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.weakTopics.map((t: any) => (
                  <Badge key={t.topic} label={`${t.topic} · ${t.masteryScore}%`} color="yellow" />
                ))}
              </div>
            </div>
          )}

          {/* Quiz history */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Quiz history</p>
            {report.quizzes.data.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No quizzes taken yet.</p>
            ) : (
              <div className="space-y-1.5">
                {report.quizzes.data.map((q: any) => {
                  const percent = q.totalQuestions ? Math.round(((q.score ?? 0) / q.totalQuestions) * 100) : null;
                  return (
                    <div
                      key={q.quizId}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl"
                      style={{ background: 'var(--bg-subtle)' }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {q.title || q.topic}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {q.difficulty} · {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {q.status === 'submitted' && percent !== null ? (
                        <span className="text-sm font-bold shrink-0" style={{ color: masteryColor(percent) }}>
                          {q.score}/{q.totalQuestions} ({percent}%)
                        </span>
                      ) : (
                        <Badge label={q.status} color={q.status === 'ready' ? 'blue' : 'gray'} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

export function ClassroomDashboardPage() {
  const { classroomId = '' } = useParams();
  const qc = useQueryClient();
  const [reportStudent, setReportStudent] = useState<StudentRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['classroom-dashboard', classroomId],
    queryFn: () => classroomsApi.getDashboard(classroomId).then((r) => r.data.data),
    enabled: !!classroomId,
  });

  const removeMutation = useMutation({
    mutationFn: (studentId: string) => classroomsApi.removeStudent(classroomId, studentId),
    onSuccess: () => {
      toast.success('Student removed');
      qc.invalidateQueries({ queryKey: ['classroom-dashboard', classroomId] });
      qc.invalidateQueries({ queryKey: ['classrooms'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not remove student'),
  });

  if (isLoading) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading classroom…</p>;
  }
  if (!data) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Classroom not found.</p>;
  }

  const students: StudentRow[] = data.students;
  const avg = (fn: (s: StudentRow) => number) =>
    students.length ? Math.round(students.reduce((sum, s) => sum + fn(s), 0) / students.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1 text-xs font-medium mb-2 hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All classrooms
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.classroom.name}</h1>
            {data.classroom.description && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{data.classroom.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Join code</span>
            <JoinCodeChip joinCode={data.classroom.joinCode} />
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Students" value={students.length} icon={Users} color="#3b82f6" />
        <StatTile label="Avg mastery" value={`${avg((s) => s.progress.overallMasteryScore)}%`} icon={TrendingUp} color="#10b981" />
        <StatTile label="Quizzes taken" value={students.reduce((sum, s) => sum + s.progress.totalQuizzesTaken, 0)} icon={BrainCircuit} color="#f59e0b" />
        <StatTile label="Avg streak" value={`${avg((s) => s.progress.currentStreak)}d`} icon={Zap} color="var(--brand)" />
      </div>

      {/* Students table */}
      <Card padding="none">
        {students.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No students yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Share the join code <span className="font-mono font-semibold">{data.classroom.joinCode}</span> — students
              enter it on their Profile page to join.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Student', 'Mastery', 'Streak', 'Quizzes', 'Level', 'Weak topics', 'Last active', ''].map((h) => (
                    <th key={h} className="text-left font-medium px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <motion.tbody initial="hidden" animate="visible" variants={staggerContainer}>
                {students.map((s) => (
                  <motion.tr
                    key={s.userId}
                    variants={staggerItem}
                    className="border-b last:border-0 hover:bg-[var(--bg-subtle)] cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => setReportStudent(s)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.firstName} {s.lastName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg-subtle)' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${s.progress.overallMasteryScore}%`, background: masteryColor(s.progress.overallMasteryScore) }}
                          />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: masteryColor(s.progress.overallMasteryScore) }}>
                          {s.progress.overallMasteryScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.progress.currentStreak}d</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.progress.totalQuizzesTaken}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Lv {s.progress.level}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.weakTopics.length === 0 ? (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          s.weakTopics.map((t) => <Badge key={t.topic} label={t.topic} color="yellow" />)
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.progress.lastActiveDate ? new Date(s.progress.lastActiveDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); setReportStudent(s); }}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                        >
                          <FileText className="w-3 h-3" />
                          Report
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Remove ${s.firstName} from this classroom?`)) {
                              removeMutation.mutate(s.userId);
                            }
                          }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--danger-light)]"
                          style={{ color: 'var(--text-muted)' }}
                          title="Remove student"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </Card>

      {reportStudent && (
        <StudentReportModal
          classroomId={classroomId}
          student={reportStudent}
          onClose={() => setReportStudent(null)}
        />
      )}
    </div>
  );
}
