import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Trash2, Loader2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { flashcardsApi } from '../../api/flashcards.api';
import { documentsApi } from '../../api/documents.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const statusColor: Record<string, any> = { pending: 'gray', generating: 'yellow', ready: 'green', failed: 'red' };

function GenerateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [sourceType, setSourceType] = useState<'document' | 'lesson'>('document');
  const [sourceId, setSourceId] = useState('');
  const [count, setCount] = useState(15);

  const { data: docs = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list().then((r) => r.data.data.filter((d: any) => d.status === 'ready')),
  });

  const mutation = useMutation({
    mutationFn: () => flashcardsApi.generate({ sourceType, sourceId, count }),
    onSuccess: () => { toast.success('Flashcard generation started'); qc.invalidateQueries({ queryKey: ['flashcards'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Generate Flashcards</h3>
        <div className="flex gap-2">
          {(['document', 'lesson'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setSourceType(t); setSourceId(''); }}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors capitalize ${sourceType === t ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
        {sourceType === 'document' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Document</label>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">Select a document...</option>
              {docs.map((d: any) => <option key={d.documentId} value={d.documentId}>{d.originalFilename}</option>)}
            </select>
          </div>
        )}
        {sourceType === 'lesson' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Lesson ID</label>
            <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Paste lesson ID" value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Card count</label>
          <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[10, 15, 20, 25].map((n) => <option key={n} value={n}>{n} cards</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!sourceId}>Generate</Button>
        </div>
      </div>
    </div>
  );
}

function FlashcardReview({ setId, onClose }: { setId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['flashcard-set', setId],
    queryFn: () => flashcardsApi.getById(setId).then((r) => r.data.data),
  });

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (isLoading) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;

  const cards = data?.cards ?? [];
  const card = cards[index];

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{index + 1} / {cards.length}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div
          className="min-h-48 border-2 border-gray-200 rounded-xl flex items-center justify-center p-6 cursor-pointer hover:border-violet-300 transition-colors text-center"
          onClick={() => setFlipped(!flipped)}
        >
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{flipped ? 'Answer' : 'Question'}</p>
            <p className="text-gray-900 font-medium">{flipped ? card?.back : card?.front}</p>
            {!flipped && card?.hint && <p className="text-xs text-violet-500 mt-2">Hint: {card.hint}</p>}
          </div>
        </div>
        <p className="text-xs text-center text-gray-400">Click card to flip</p>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }} disabled={index === 0} className="flex-1">Previous</Button>
          <button onClick={() => { setFlipped(false); setIndex(index); }} className="p-2 text-gray-400 hover:text-gray-600"><RotateCcw className="w-4 h-4" /></button>
          <Button onClick={() => { setIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={index === cards.length - 1} className="flex-1">Next</Button>
        </div>
      </div>
    </div>
  );
}

export function FlashcardsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Flashcards</h1>
          <p className="text-gray-500 mt-1">Active recall practice from your documents and lessons</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Generate</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : sets.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No flashcard sets yet. Generate your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sets.map((set: any) => (
            <Card key={set.setId} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{set.sourceType} cards</p>
                  <p className="text-xs text-gray-400 mt-0.5">{set.cardCount ?? '—'} cards</p>
                </div>
                <div className="flex gap-1">
                  <Badge label={set.status} color={statusColor[set.status]} />
                </div>
              </div>
              <div className="flex gap-2">
                {set.status === 'ready' && (
                  <Button size="sm" variant="secondary" onClick={() => setReviewId(set.setId)} className="flex-1">Review</Button>
                )}
                {set.status === 'generating' && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-1">
                    <Loader2 className="w-3 h-3 animate-spin" />Generating...
                  </div>
                )}
                <button
                  onClick={() => { if (confirm('Delete set?')) deleteMutation.mutate(set.setId); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && <GenerateModal onClose={() => setShowModal(false)} />}
      {reviewId && <FlashcardReview setId={reviewId} onClose={() => setReviewId(null)} />}
    </div>
  );
}
