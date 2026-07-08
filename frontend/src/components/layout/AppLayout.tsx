import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BookOpen, BrainCircuit,
  Layers, LogOut, GraduationCap, ChevronRight, BotMessageSquare,
  CalendarDays, Menu, Shield, TrendingUp, Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { flashcardsApi } from '../../api/flashcards.api';
import { ThemeToggle } from '../ui/ThemeToggle';
import { XpBadgeDisplay } from '../gamification/XpBadgeDisplay';
import { useGamificationToasts } from '../../hooks/useGamification';
import { springSoft } from '../../lib/motion';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/lessons', icon: BookOpen, label: 'Lessons' },
  { to: '/quizzes', icon: BrainCircuit, label: 'Quizzes' },
  { to: '/flashcards', icon: Layers, label: 'Flashcards' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
];

const aiNav = [
  { to: '/tutor', icon: BotMessageSquare, label: 'AI Tutor' },
  { to: '/study-plan', icon: CalendarDays, label: 'Study Plan' },
];

/** Nav link with a shared sliding "active" background that animates between items via layoutId. */
function NavItem({ to, icon: Icon, label, onNavigate, badge, danger }: any) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
          isActive ? '' : 'hover:bg-[var(--bg-subtle)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-bg"
              className="absolute inset-0 rounded-xl shadow-sm"
              style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'var(--brand-light)' }}
              transition={springSoft}
            />
          )}
          <div
            className="relative z-10 flex items-center gap-3 transition-colors duration-150"
            style={{ color: isActive ? (danger ? 'var(--danger)' : 'var(--brand)') : 'var(--text-secondary)' }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </div>
          <div className="relative z-10 flex items-center gap-1">
            {badge}
            {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: danger ? 'var(--danger)' : 'var(--brand)' }} />}
          </div>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ dueCards, initials, user, onNavigate, handleLogout, isAdmin, isTeacher }: any) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-glow)' }}>
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
          Learn
        </p>
        {nav.map(({ to, icon, label }) => (
          <NavItem
            key={to}
            to={to}
            icon={icon}
            label={label}
            onNavigate={onNavigate}
            badge={
              to === '/flashcards' && dueCards.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--brand)', color: '#fff', fontSize: '10px' }}>
                  {dueCards.length}
                </span>
              )
            }
          />
        ))}

        <p className="px-3 pt-4 pb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          AI Tools
        </p>
        {aiNav.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} onNavigate={onNavigate} />
        ))}

        {isTeacher && (
          <>
            <p className="px-3 pt-4 pb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Teaching
            </p>
            <NavItem to="/teacher" icon={Users} label="My Classrooms" onNavigate={onNavigate} />
          </>
        )}

        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Admin
            </p>
            <NavItem to="/admin" icon={Shield} label="Platform Admin" onNavigate={onNavigate} danger />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
        <XpBadgeDisplay />
        <ThemeToggle />
        {/* User row */}
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${isActive ? '' : 'hover:bg-[var(--bg-subtle)]'}`
          }
          style={({ isActive }) => isActive ? { background: 'var(--brand-light)' } : { color: 'var(--text-secondary)' }}
        >
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
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-150 hover:bg-[var(--danger-light)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );
}

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useGamificationToasts();

  const { data: dueCards = [] } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: () => flashcardsApi.getDue().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const sharedProps = { dueCards, initials, user, handleLogout, isAdmin, isTeacher, onNavigate: () => setMobileOpen(false) };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile header */}
        <div
          className="flex md:hidden items-center gap-3 px-4 py-3 border-b sticky top-0 z-30"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-gradient)' }}>
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>GenLearn</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
