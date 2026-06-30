import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BookOpen, BrainCircuit,
  Layers, LogOut, GraduationCap, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { ThemeToggle } from '../ui/ThemeToggle';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 flex flex-col border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>GenLearn</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Learning Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-2 pb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Menu
          </p>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'shadow-sm'
                    : 'hover:bg-[var(--bg-subtle)]'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'var(--brand-light)', color: 'var(--brand)' }
                : { color: 'var(--text-secondary)' }
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
          <ThemeToggle />
          {/* User row */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ color: 'var(--text-secondary)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'var(--brand)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-150 hover:bg-[var(--danger-light)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
