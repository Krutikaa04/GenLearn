import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '../../api/documents.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const statusColor: Record<string, any> = {
  uploaded: 'blue', processing: 'yellow', embedding: 'yellow', ready: 'green', failed: 'red',
};

function AskModal({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await documentsApi.ask(docId, question);
      setAnswer(res.data.data.answer);
    } catch {
      toast.error('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Ask about this document</h3>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Ask a question..."
        />
        {answer && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{answer}</div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={ask} loading={loading}>Ask</Button>
        </div>
      </div>
    </div>
  );
}

export function DocumentsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [askDocId, setAskDocId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list().then((r) => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: () => { toast.success('Uploaded — processing started'); qc.invalidateQueries({ queryKey: ['documents'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['documents'] }); },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Upload PDFs, Word docs, or text files to start learning</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} loading={uploadMutation.isPending}>
          <Upload className="w-4 h-4" />
          Upload
        </Button>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
        }`}
      >
        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Drop files here or <span className="text-violet-600 font-medium">browse</span></p>
        <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, MD · max 20 MB</p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : docs.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No documents yet</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc: any) => (
            <Card key={doc.documentId} className="p-4 flex items-center gap-4">
              <FileText className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.originalFilename}</p>
                <p className="text-xs text-gray-400">{doc.fileType?.toUpperCase()} · {(doc.fileSize / 1024).toFixed(0)} KB</p>
              </div>
              <Badge label={doc.status} color={statusColor[doc.status] ?? 'gray'} />
              <div className="flex gap-1">
                {doc.status === 'ready' && (
                  <button
                    onClick={() => setAskDocId(doc.documentId)}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="Ask question"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { if (confirm('Delete document?')) deleteMutation.mutate(doc.documentId); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {askDocId && <AskModal docId={askDocId} onClose={() => setAskDocId(null)} />}
    </div>
  );
}
