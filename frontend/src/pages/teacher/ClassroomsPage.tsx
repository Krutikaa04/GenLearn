import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Plus, Trash2, Copy, Check, ArrowRight, X } from 'lucide-react';
import { classroomsApi } from '../../api/classrooms.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { staggerContainer, staggerItem } from '../../lib/motion';

interface ClassroomSummary {
  classroomId: string;
  name: string;
  description: string;
  joinCode: string;
  memberCount: number;
}

export function JoinCodeChip({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy code');
    }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors hover:opacity-80"
      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
      title="Copy join code"
    >
      {joinCode}
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function CreateClassroomModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => classroomsApi.create({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: (res) => {
      toast.success(`Classroom created — join code ${res.data.data.joinCode}`);
      qc.invalidateQueries({ queryKey: ['classrooms'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not create classroom'),
  });

  return (
    <Modal onClose={onClose} maxWidth="max-w-md" className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New classroom</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <Input
        label="Name"
        placeholder="e.g. Physics — Grade 11A"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Description (optional)"
        placeholder="What this class covers"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button
        onClick={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={name.trim().length < 2}
        className="w-full"
      >
        Create classroom
      </Button>
    </Modal>
  );
}

export function ClassroomsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: classrooms = [], isLoading } = useQuery<ClassroomSummary[]>({
    queryKey: ['classrooms'],
    queryFn: () => classroomsApi.listOwn().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (classroomId: string) => classroomsApi.delete(classroomId),
    onSuccess: () => {
      toast.success('Classroom deleted');
      qc.invalidateQueries({ queryKey: ['classrooms'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Could not delete classroom'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>My Classrooms</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Share a join code with your students, then track their progress here
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New classroom
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : classrooms.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No classrooms yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Create your first classroom and invite students with its join code.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create classroom
          </Button>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {classrooms.map((c) => (
            <motion.div key={c.classroomId} variants={staggerItem}>
              <Link to={`/teacher/classrooms/${c.classroomId}`}>
                <Card hover padding="md" className="group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                      {c.description && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Users className="w-3.5 h-3.5" />
                        {c.memberCount} student{c.memberCount === 1 ? '' : 's'}
                      </span>
                      <JoinCodeChip joinCode={c.joinCode} />
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm(`Delete "${c.name}"? Students will lose access.`)) {
                          deleteMutation.mutate(c.classroomId);
                        }
                      }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--danger-light)]"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete classroom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {showCreate && <CreateClassroomModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
