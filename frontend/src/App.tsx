import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store/auth.store';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';

// Route-level code splitting: each page ships as its own chunk so the initial
// bundle stays small and pages load on demand (no behavioural change).
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ConfirmEmailChangePage = lazy(() => import('./pages/auth/ConfirmEmailChangePage').then((m) => ({ default: m.ConfirmEmailChangePage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const LessonsPage = lazy(() => import('./pages/lessons/LessonsPage').then((m) => ({ default: m.LessonsPage })));
const QuizzesPage = lazy(() => import('./pages/quizzes/QuizzesPage').then((m) => ({ default: m.QuizzesPage })));
const FlashcardsPage = lazy(() => import('./pages/flashcards/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage })));
const ProgressPage = lazy(() => import('./pages/analytics/ProgressPage').then((m) => ({ default: m.ProgressPage })));
const TutorPage = lazy(() => import('./pages/tutor/TutorPage').then((m) => ({ default: m.TutorPage })));
const StudyPlanPage = lazy(() => import('./pages/studyplan/StudyPlanPage').then((m) => ({ default: m.StudyPlanPage })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));
const ClassroomsPage = lazy(() => import('./pages/teacher/ClassroomsPage').then((m) => ({ default: m.ClassroomsPage })));
const ClassroomDashboardPage = lazy(() => import('./pages/teacher/ClassroomDashboardPage').then((m) => ({ default: m.ClassroomDashboardPage })));

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function TeacherRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'teacher') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <MotionConfig reducedMotion="user">
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/confirm-email-change" element={<ConfirmEmailChangePage />} />
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/lessons" element={<LessonsPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/study-plan" element={<StudyPlanPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="/teacher" element={<TeacherRoute><ClassroomsPage /></TeacherRoute>} />
            <Route path="/teacher/classrooms/:classroomId" element={<TeacherRoute><ClassroomDashboardPage /></TeacherRoute>} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
    </MotionConfig>
    </ErrorBoundary>
  );
}
