import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, BrainCircuit, Layers, BarChart3, LogOut, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';

const nav = [
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/lessons', icon: BookOpen, label: 'Lessons' },
  { to: '/quizzes', icon: BrainCircuit, label: 'Quizzes' },
  { to: '/flashcards', icon: Layers, label: 'Flashcards' },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200 flex items-center gap-2">
          <GraduationCap className="text-violet-600 w-6 h-6" />
          <span className="font-semibold text-gray-900 text-lg">GenLearn</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 text-sm">
            <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-500 text-xs">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
