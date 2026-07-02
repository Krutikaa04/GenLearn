import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store/auth.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ConfirmEmailChangePage } from './pages/auth/ConfirmEmailChangePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { LessonsPage } from './pages/lessons/LessonsPage';
import { QuizzesPage } from './pages/quizzes/QuizzesPage';
import { FlashcardsPage } from './pages/flashcards/FlashcardsPage';
import { ProgressPage } from './pages/analytics/ProgressPage';
import { TutorPage } from './pages/tutor/TutorPage';
import { StudyPlanPage } from './pages/studyplan/StudyPlanPage';
import { AdminPage } from './pages/admin/AdminPage';

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
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
    </MotionConfig>
    </ErrorBoundary>
  );
}
