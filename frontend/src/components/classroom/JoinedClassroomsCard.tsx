import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, LogOut } from 'lucide-react';
import { classroomsApi } from '../../api/classrooms.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface JoinedClassroom {
  classroomId: string;
  name: string;
  description: string;
  teacherName: string;
}

/** Student-facing classroom membership: list joined classes + join by code. */
export function JoinedClassroomsCard() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');

  const { data: classrooms = [] } = useQuery<JoinedClassroom[]>({
    queryKey: ['joined-classrooms'],
    queryFn: () => classroomsApi.listJoined().then((r) => r.data.data),
  });

  const joinMutation = useMutation({
    mutationFn: () => classroomsApi.join(code.trim()),
    onSuccess: (res) => {
      toast.success(`Joined ${res.data.data.name}`);
      setCode('');
      qc.invalidateQueries({ queryKey: ['joined-classrooms'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not join classroom'),
  });

  const leaveMutation = useMutation({
    mutationFn: (classroomId: string) => classroomsApi.leave(classroomId),
    onSuccess: () => {
      toast.success('Left classroom');
      qc.invalidateQueries({ queryKey: ['joined-classrooms'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not leave classroom'),
  });

  const canJoin = /^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(code.trim());

  return (
    <Card padding="lg" className="space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
        <Users className="w-4 h-4" style={{ color: 'var(--brand)' }} />
        Classrooms
      </h2>

      {classrooms.length > 0 && (
        <div className="space-y-2">
          {classrooms.map((c) => (
            <div
              key={c.classroomId}
              className="flex items-center justify-between gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Taught by {c.teacherName}</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Leave "${c.name}"?`)) leaveMutation.mutate(c.classroomId);
                }}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg shrink-0 transition-colors hover:bg-[var(--danger-light)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut className="w-3 h-3" />
                Leave
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Have a join code from your teacher?
        </p>
        <div className="flex gap-2">
          <input
            aria-label="Classroom join code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm font-mono ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canJoin) joinMutation.mutate();
            }}
          />
          <Button onClick={() => joinMutation.mutate()} loading={joinMutation.isPending} disabled={!canJoin}>
            Join
          </Button>
        </div>
      </div>
    </Card>
  );
}
