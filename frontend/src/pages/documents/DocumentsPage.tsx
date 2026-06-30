import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, MessageSquare, Loader2, CloudUpload, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '../../api/documents.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const statusColor: Record<string, any> = {
  uploaded: 'blue', processing: 'yellow', embedding: 'yellow', ready: 'green', failed: 'red',
};

function AskModal({ docId, docName, onClose }: { docId: string; docName: string; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await documentsApi.ask(docId, q);
      setMessages((m) => [...m, { role: 'ai', text: res.data.data.answer }]);
    } catch {
      toast.error('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl border flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', maxHeight: '80vh' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Ask about this document</h3>
            <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{docName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-32">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ask anything about this document</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="rounded-xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed"
                style={m.role === 'user'
                  ? { background: 'var(--brand)', color: '#fff' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-primary)' }
                }
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && ask()}
            placeholder="Ask a question…"
            className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] ring-1"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', ringColor: 'var(--border)' }}
          />
          <Button onClick={ask} loading={loading} disabled={!question.trim()} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DocumentsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [askDoc, setAskDoc] = useState<{ id: string; name: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list().then((r) => r.data.data),
    refetchInterval: (q) => q.state.data?.some((d: any) => d.status === 'processing' || d.status === 'embedding') ? 3000 : false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: () => { toast.success('Uploaded — processing started'); qc.invalidateQueries({ queryKey: ['documents'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => { toast.success('Document deleted'); qc.invalidateQueries({ queryKey: ['documents'] }); },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((f) => uploadMutation.mutate(f));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Documents</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Upload study material to power AI features</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} loading={uploadMutation.isPending}>
          <Upload className="w-4 h-4" /> Upload
        </Button>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-150"
        style={{
          borderColor: dragging ? 'var(--brand)' : 'var(--border-strong)',
          background: dragging ? 'var(--brand-light)' : 'var(--bg-surface)',
        }}
      >
        <CloudUpload className="w-10 h-10 mx-auto mb-3" style={{ color: dragging ? 'var(--brand)' : 'var(--text-muted)' }} />
        <p className="text-sm font-medium mb-1" style={{ color: dragging ? 'var(--brand)' : 'var(--text-primary)' }}>
          Drop files here or <span style={{ color: 'var(--brand)' }}>browse</span>
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF · DOCX · TXT · MD · max 20 MB</p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No documents yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Upload your first document to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc: any) => (
            <Card key={doc.documentId} padding="md" className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-subtle)' }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.originalFilename}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {doc.fileType?.toUpperCase()} · {(doc.fileSize / 1024).toFixed(0)} KB
                </p>
              </div>
              <Badge label={doc.status} color={statusColor[doc.status] ?? 'gray'} />
              {(doc.status === 'processing' || doc.status === 'embedding') && (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--brand)' }} />
              )}
              <div className="flex gap-1 shrink-0">
                {doc.status === 'ready' && (
                  <button
                    onClick={() => setAskDoc({ id: doc.documentId, name: doc.originalFilename })}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--brand-light)]"
                    style={{ color: 'var(--text-muted)' }}
                    title="Ask a question"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc.documentId); }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--danger-light)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {askDoc && <AskModal docId={askDoc.id} docName={askDoc.name} onClose={() => setAskDoc(null)} />}
    </div>
  );
}
