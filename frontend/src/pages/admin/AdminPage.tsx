import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, TrendingUp, BrainCircuit, Shield, CheckCircle, XCircle,
  AlertTriangle, Loader2, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const statusColor: Record<string, any> = {
  active: 'green', suspended: 'red', unverified: 'yellow',
};

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </Card>
  );
}

export function AdminPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data.data),
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, statusFilter],
    queryFn: () => adminApi.listUsers(page, 20, statusFilter || undefined).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      toast.success('User status updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update status'),
  });

  const users: any[] = usersData?.data ?? [];
  const total: number = usersData?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const filtered = search
    ? users.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Admin</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Platform overview and user management</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
          <Shield className="w-3.5 h-3.5" /> Admin only
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total users" value={stats.users.total} icon={Users} color="#3b82f6" />
          <StatCard label="Active" value={stats.users.active} icon={CheckCircle} color="#10b981" />
          <StatCard label="Suspended" value={stats.users.suspended} icon={XCircle} color="#ef4444" />
          <StatCard label="Unverified" value={stats.users.unverified} icon={AlertTriangle} color="#f59e0b" />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card padding="md" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.learning.averageMasteryScore}%</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg. mastery across platform</p>
            </div>
          </Card>
          <Card padding="md" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <BrainCircuit className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.learning.totalQuizzesTaken.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total quizzes taken</p>
            </div>
          </Card>
        </div>
      )}

      {/* Users table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] ring-1"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-1">
            {[
              { label: 'All', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'Unverified', value: 'unverified' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={statusFilter === f.value
                  ? { background: 'var(--brand)', color: '#fff' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-muted)' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users match this filter</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
                  {['User', 'Role', 'Status', 'Verified', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user: any, i: number) => (
                  <tr
                    key={user.userId}
                    className="border-b transition-colors hover:bg-[var(--bg-subtle)]"
                    style={{ borderColor: i === filtered.length - 1 ? 'transparent' : 'var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize px-2 py-0.5 rounded-full"
                        style={{ background: user.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'var(--brand-light)', color: user.role === 'admin' ? 'var(--danger)' : 'var(--brand)' }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={user.status} color={statusColor[user.status] ?? 'gray'} />
                    </td>
                    <td className="px-4 py-3">
                      {user.emailVerified
                        ? <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                        : <XCircle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => statusMutation.mutate({
                            userId: user.userId,
                            status: user.status === 'active' ? 'suspended' : 'active',
                          })}
                          disabled={statusMutation.isPending}
                          className="text-xs px-2.5 py-1 rounded-lg border transition-colors hover:bg-[var(--bg-subtle)]"
                          style={{
                            borderColor: 'var(--border)',
                            color: user.status === 'active' ? 'var(--danger)' : 'var(--success)',
                          }}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Page {page} of {totalPages} · {total} users
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
