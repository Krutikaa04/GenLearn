import { useQuery } from '@tanstack/react-query';
import { FileText, BookOpen, BrainCircuit, Layers, Flame, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../../api/analytics.api';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['progress'],
    queryFn: () => analyticsApi.getProgress().then((r) => r.data.data),
  });

  const stats = [
    { label: 'Documents', value: data?.totalDocumentsUploaded ?? 0, icon: FileText, to: '/documents', color: 'text-blue-600' },
    { label: 'Lessons', value: data?.totalLessonsGenerated ?? 0, icon: BookOpen, to: '/lessons', color: 'text-green-600' },
    { label: 'Quizzes', value: data?.totalQuizzesTaken ?? 0, icon: BrainCircuit, to: '/quizzes', color: 'text-orange-600' },
    { label: 'Flashcard Sets', value: data?.totalFlashcardSetsCreated ?? 0, icon: Layers, to: '/flashcards', color: 'text-violet-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-500 mt-1">Here's your learning summary</p>
      </div>

      {/* Streak + Mastery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900">{data?.currentStreak ?? 0} days</p>
            <p className="text-xs text-gray-400">Best: {data?.longestStreak ?? 0} days</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Overall Mastery</p>
            <p className="text-2xl font-bold text-gray-900">{data?.overallMasteryScore ?? 0}%</p>
            <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1">
              <div
                className="h-1.5 bg-violet-500 rounded-full transition-all"
                style={{ width: `${data?.overallMasteryScore ?? 0}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Activity stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to}>
            <Card className="p-4 hover:border-violet-200 transition-colors cursor-pointer">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Topic Mastery */}
      {data?.topicMastery?.length > 0 && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Topic Mastery</h2>
          <div className="space-y-3">
            {data.topicMastery.slice(0, 5).map((t: any) => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{t.topic}</span>
                  <span className="text-gray-500">{t.masteryScore}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 bg-violet-500 rounded-full transition-all"
                    style={{ width: `${t.masteryScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/documents" className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
            Upload document
          </Link>
          <Link to="/lessons" className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Generate lesson
          </Link>
          <Link to="/quizzes" className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Take a quiz
          </Link>
        </div>
      </Card>
    </div>
  );
}
