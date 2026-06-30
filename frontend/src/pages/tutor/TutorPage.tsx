import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BotMessageSquare, Send, Loader2, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { tutorApi, type ConversationMessage } from '../../api/tutor.api';
import { documentsApi } from '../../api/documents.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

export function TutorPage() {
  const [topic, setTopic] = useState('');
  const [topicConfirmed, setTopicConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list().then((r) => r.data.data.filter((d: any) => d.status === 'ready')),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = () => {
    if (!topic.trim()) return;
    setTopicConfirmed(true);
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm your AI tutor for **${topic}**. What would you like to learn? I'll ask you questions along the way to make sure the concepts really stick.`,
      suggestions: [
        `Explain ${topic} from scratch`,
        `What are the most important concepts in ${topic}?`,
        `Give me a practice problem on ${topic}`,
      ],
    }]);
  };

  const send = async (text?: string) => {
    const msg = (text ?? message).trim();
    if (!msg || loading) return;
    setMessage('');

    const userMsg: Message = { role: 'user', content: msg };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    const history: ConversationMessage[] = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    try {
      const res = await tutorApi.chat({
        topic,
        message: msg,
        conversationHistory: history,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      });
      const { reply, followUpSuggestions } = res.data.data;
      setMessages((m) => [...m, { role: 'assistant', content: reply, suggestions: followUpSuggestions }]);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Tutor is unavailable');
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  if (!topicConfirmed) {
    return (
      <div className="max-w-lg mx-auto mt-16 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'var(--brand-light)' }}>
            <BotMessageSquare className="w-7 h-7" style={{ color: 'var(--brand)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Tutor</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Learns with you using the Socratic method — asks YOU questions to make concepts stick.
          </p>
        </div>

        <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <Input
            label="What do you want to learn?"
            placeholder="e.g. Dynamic Programming, Photosynthesis, React Hooks…"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startSession()}
          />

          {docs.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setDocPanelOpen(!docPanelOpen)}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--brand)' }}
              >
                <FileText className="w-3.5 h-3.5" />
                Ground on my documents ({selectedDocIds.length} selected)
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${docPanelOpen ? 'rotate-180' : ''}`} />
              </button>
              {docPanelOpen && (
                <div className="rounded-xl border p-3 space-y-1.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
                  {docs.map((doc: any) => (
                    <label key={doc.documentId} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.documentId)}
                        onChange={(e) => setSelectedDocIds(e.target.checked
                          ? [...selectedDocIds, doc.documentId]
                          : selectedDocIds.filter((id) => id !== doc.documentId)
                        )}
                        className="rounded"
                      />
                      <span className="truncate">{doc.originalFilename}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={startSession} disabled={!topic.trim()} className="w-full">
            Start learning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      {/* Topic bar */}
      <div className="flex items-center justify-between pb-4 border-b mb-1 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
            <BotMessageSquare className="w-4 h-4" style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{topic}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {messages.length - 1} exchanges · {selectedDocIds.length} doc{selectedDocIds.length !== 1 ? 's' : ''} grounded
            </p>
          </div>
        </div>
        <button
          onClick={() => { setTopicConfirmed(false); setMessages([]); setTopic(''); }}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
        >
          New topic
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--brand-light)' }}>
                <BotMessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
              </div>
            )}
            <div className="max-w-[78%] space-y-2">
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={msg.role === 'user'
                  ? { background: 'var(--brand)', color: '#fff', borderBottomRightRadius: '4px' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: '4px' }
                }
              >
                {msg.content}
              </div>
              {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestions.map((s, j) => (
                    <button
                      key={j}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all hover:bg-[var(--brand-light)] hover:border-[var(--brand)]"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-light)' }}>
              <BotMessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
            </div>
            <div className="rounded-2xl px-4 py-3 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask your tutor anything…"
            className="flex-1 rounded-xl px-4 py-3 text-sm ring-1 focus:ring-2 focus:ring-[var(--brand)] focus:outline-none"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', ringColor: 'var(--border)' }}
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={!message.trim() || loading} loading={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
