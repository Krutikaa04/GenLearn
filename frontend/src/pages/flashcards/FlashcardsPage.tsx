import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Trash2, Loader2, RotateCcw, ChevronLeft, ChevronRight, X, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { flashcardsApi } from '../../api/flashcards.api';
import { documentsApi } from '../../api/documents.api';
import { lessonsApi } from '../../api/lessons.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useModalA11y } from '../../components/ui/useModalA11y';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { springSoft } from '../../lib/motion';

/** SRS review card with a 3D flip between question (front) and answer (back). */
function FlipCard({ flipped, onFlip, setLabel, front, back, hint }: {
  flipped: boolean;
  onFlip: () => void;
  setLabel?: string;
  front: string;
  back: string;
  hint?: string;
}) {
  return (
    <div className="min-h-52" style={{ perspective: '1400px' }}>
      <motion.div
        className="relative w-full h-full min-h-52 cursor-pointer select-none"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={springSoft}
        onClick={onFlip}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border p-8 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)', backfaceVisibility: 'hidden' }}
        >
          {setLabel && <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{setLabel}</p>}
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--brand)' }}>Question</p>
          <p className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{front}</p>
          {hint && (
            <p className="text-xs mt-4 px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
              💡 {hint}
            </p>
          )}
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>Tap to reveal answer</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border p-8 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {setLabel && <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{setLabel}</p>}
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--success)' }}>Answer</p>
          <p className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{back}</p>
        </div>
      </motion.div>
    </div>
  );
}

const statusColor: Record<string, any> = { pending: 'gray', generating: 'yellow', ready: 'green', failed: 'red' };

function GenerateModal({ onClose, initialDocId = '' }: { onClose: () => void; initialDocId?: string }) {
  const qc = useQueryClient();
  const [sourceType, setSourceType] = useState<'document' | 'lesson'>(initialDocId ? 'document' : 'document');
  const [sourceId, setSourceId] = useState(initialDocId);
  const [count, setCount] = useState(15);
  const [title, setTitle] = useState('');

  const { data: docs = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list().then((r) => r.data.data.filter((d: any) => d.status === 'ready')),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => lessonsApi.list().then((r) => r.data.data.filter((l: any) => l.status === 'ready')),
  });

  const mutation = useMutation({
    mutationFn: () => flashcardsApi.generate({ sourceType, sourceId, count, ...(title.trim() ? { title: title.trim() } : {}) }),
    onSuccess: () => { toast.success('Flashcard generation started'); qc.invalidateQueries({ queryKey: ['flashcards'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const panelRef = useModalA11y(onClose);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <ErrorBoundary compact>
      <div ref={panelRef} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Generate Flashcards</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Create cards from a document or lesson</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-2">
          {(['document', 'lesson'] as const).map((t) => (
            <button key={t} onClick={() => { setSourceType(t); setSourceId(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize"
              style={sourceType === t
                ? { background: 'var(--brand-light)', color: 'var(--brand)', borderColor: 'var(--brand)' }
                : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
              }>{t}</button>
          ))}
        </div>

        {sourceType === 'document' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select document</label>
            <select
              className="w-full rounded-xl px-3 py-2.5 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              value={sourceId} onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">Select a ready document…</option>
              {docs.map((d: any) => <option key={d.documentId} value={d.documentId}>{d.originalFilename}</option>)}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Select lesson</label>
            {lessons.length > 0 ? (
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                value={sourceId} onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">Select a ready lesson…</option>
                {lessons.map((l: any) => (
                  <option key={l.lessonId} value={l.lessonId}>{l.title || l.topic}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No ready lessons yet. Generate a lesson first.</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Set title <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
          <input
            className="w-full rounded-xl px-3 py-2.5 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            placeholder="e.g. DSA Interview Prep"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Card count</label>
          <div className="flex gap-2">
            {[10, 15, 20, 25].map((n) => (
              <button key={n} onClick={() => setCount(n)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                style={count === n
                  ? { background: 'var(--brand-light)', color: 'var(--brand)', borderColor: 'var(--brand)' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }>{n}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!sourceId} className="flex-1">Generate</Button>
        </div>
      </div>
      </ErrorBoundary>
    </div>
  );
}

const SRS_RATINGS = [
  { label: 'Again', value: 0, style: { background: 'var(--danger-light)', color: 'var(--danger)' } },
  { label: 'Hard', value: 1, style: { background: 'var(--warning-light)', color: 'var(--warning)' } },
  { label: 'Good', value: 3, style: { background: 'var(--brand-light)', color: 'var(--brand)' } },
  { label: 'Easy', value: 5, style: { background: 'var(--success-light)', color: 'var(--success)' } },
];

function FlashcardReview({ setId, onClose }: { setId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['flashcard-set', setId],
    queryFn: () => flashcardsApi.getById(setId).then((r) => r.data.data),
  });

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  const cards = data?.cards ?? [];
  const card = cards[index];
  const progress = Math.round((reviewed.size / cards.length) * 100);

  const handleRate = useCallback(async (r: number) => {
    if (!card) return;
    setReviewed((s) => new Set([...s, index]));
    try {
      await flashcardsApi.reviewCard(setId, card.cardId, r);
      qc.invalidateQueries({ queryKey: ['progress'] });
    } catch {
      // fail silently — SRS update is best-effort
    }
    setIndex((i) => (i < cards.length - 1 ? i + 1 : i));
    setFlipped(false);
  }, [card, index, setId, cards.length, qc]);

  // Keyboard shortcuts: Space to flip, 1-4 to rate (when flipped), arrows to navigate
  useEffect(() => {
    if (isLoading) return;
    const ratingMap: Record<string, number> = { '1': 0, '2': 1, '3': 3, '4': 5 };
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); return; }
      if (flipped && e.key in ratingMap) { handleRate(ratingMap[e.key]); return; }
      if (!flipped) {
        if (e.key === 'ArrowRight') { setIndex((i) => Math.min(i + 1, cards.length - 1)); setFlipped(false); }
        if (e.key === 'ArrowLeft') { setIndex((i) => Math.max(i - 1, 0)); setFlipped(false); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLoading, flipped, cards.length, handleRate]);

  const panelRef = useModalA11y(onClose);

  if (isLoading) return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <ErrorBoundary compact>
      <div ref={panelRef} className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm">{index + 1} / {cards.length}</span>
            <div className="w-32 h-1.5 rounded-full bg-white/20">
              <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-white/70 text-sm">{reviewed.size} done</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card */}
        <FlipCard
          flipped={flipped}
          onFlip={() => setFlipped(!flipped)}
          front={card?.front}
          back={card?.back}
          hint={card?.hint}
        />

        {/* SRS rating buttons (shown after flip) */}
        {flipped ? (
          <div className="grid grid-cols-4 gap-2">
            {SRS_RATINGS.map(({ label, value, style }) => (
              <button
                key={label}
                onClick={() => handleRate(value)}
                className="py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={style}
              >{label}</button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
              disabled={index === 0}
              className="p-3 rounded-xl border transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            ><ChevronLeft className="w-5 h-5" /></button>
            <button
              onClick={() => setFlipped(false)}
              className="p-3 rounded-xl border transition-all"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            ><RotateCcw className="w-4 h-4" /></button>
            <button
              onClick={() => { setIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
              disabled={index === cards.length - 1}
              className="p-3 rounded-xl border transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            ><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Rate how well you knew it — GenLearn schedules the next review automatically
        </p>
      </div>
      </ErrorBoundary>
    </div>
  );
}

function DueCardsReview({ cards, onClose, onDone }: { cards: any[]; onClose: () => void; onDone: () => void }) {
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  const card = cards[index];
  const progress = Math.round((reviewed.size / cards.length) * 100);
  const allDone = reviewed.size === cards.length;

  const handleRate = useCallback(async (r: number) => {
    if (!card) return;
    setReviewed((s) => new Set([...s, index]));
    try {
      await flashcardsApi.reviewCard(card.setId, card.cardId, r);
      qc.invalidateQueries({ queryKey: ['progress'] });
    } catch { /* best-effort */ }
    setIndex((i) => (i < cards.length - 1 ? i + 1 : i));
    setFlipped(false);
  }, [card, index, cards.length, qc]);

  useEffect(() => {
    if (allDone) return;
    const ratingMap: Record<string, number> = { '1': 0, '2': 1, '3': 3, '4': 5 };
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && e.key in ratingMap) handleRate(ratingMap[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allDone, flipped, handleRate]);

  const panelRef = useModalA11y(onClose);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <ErrorBoundary compact>
      <div ref={panelRef} className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm">{Math.min(index + 1, cards.length)} / {cards.length}</span>
            <div className="w-32 h-1.5 rounded-full bg-white/20">
              <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {allDone ? (
          <div className="rounded-2xl border p-10 flex flex-col items-center gap-4 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="text-4xl">🎉</div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>All done for today!</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You reviewed {cards.length} card{cards.length !== 1 ? 's' : ''}. See you next time.</p>
            <Button onClick={onDone} className="mt-2">Back to sets</Button>
          </div>
        ) : (
          <>
            <FlipCard
              flipped={flipped}
              onFlip={() => setFlipped(!flipped)}
              setLabel={card?.setTitle}
              front={card?.front}
              back={card?.back}
              hint={card?.hint}
            />

            {flipped ? (
              <div className="grid grid-cols-4 gap-2">
                {SRS_RATINGS.map(({ label, value, style }) => (
                  <button key={label} onClick={() => handleRate(value)} className="py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={style}>{label}</button>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Rate your recall after flipping</p>
            )}
          </>
        )}
      </div>
      </ErrorBoundary>
    </div>
  );
}

export function FlashcardsPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('docId') ?? '';
  const [showModal, setShowModal] = useState(!!initialDocId);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewingDue, setReviewingDue] = useState(false);

  const { data: dueCards = [] } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: () => flashcardsApi.getDue().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ['flashcards'],
    queryFn: () => flashcardsApi.list().then((r) => r.data.data),
    refetchInterval: (q) => q.state.data?.some((s: any) => s.status === 'generating' || s.status === 'pending') ? 3000 : false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => flashcardsApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['flashcards'] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Flashcards</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Active recall practice from your content</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Generate</Button>
      </div>

      {dueCards.length > 0 && (
        <div
          className="flex items-center justify-between rounded-2xl border px-4 py-3.5"
          style={{ background: 'var(--brand-light)', borderColor: 'var(--brand)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand)' }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
                {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your spaced-repetition queue for today</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setReviewingDue(true)}>
            Start review
          </Button>
        </div>
      )}

      {isLoading ? (
        <Spinner center />
      ) : sets.length === 0 ? (
        <EmptyState icon={Layers} title="No flashcard sets yet" description="Generate cards from a document or lesson" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sets.map((set: any) => (
            <Card key={set.setId} padding="md" className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
                  <Layers className="w-5 h-5" style={{ color: 'var(--brand)' }} />
                </div>
                <Badge label={set.status} color={statusColor[set.status]} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {set.title || `Flashcards from ${set.sourceType}`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {set.cardCount ?? '—'} cards · from {set.sourceType}
                </p>
              </div>
              <div className="flex gap-2">
                {set.status === 'ready' && (
                  <Button size="sm" onClick={() => setReviewId(set.setId)} className="flex-1">Review cards</Button>
                )}
                {set.status === 'generating' && (
                  <div className="flex items-center gap-1.5 text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…
                  </div>
                )}
                <button
                  onClick={() => { if (confirm('Delete this set?')) deleteMutation.mutate(set.setId); }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--danger-light)]"
                  style={{ color: 'var(--text-muted)' }}
                ><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && <GenerateModal onClose={() => setShowModal(false)} initialDocId={initialDocId} />}
      {reviewId && <FlashcardReview setId={reviewId} onClose={() => setReviewId(null)} />}
      {reviewingDue && dueCards.length > 0 && (
        <DueCardsReview
          cards={dueCards}
          onClose={() => setReviewingDue(false)}
          onDone={() => { setReviewingDue(false); qc.invalidateQueries({ queryKey: ['flashcards-due'] }); }}
        />
      )}
    </div>
  );
}
