'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  type?: 'text' | 'quiz';
  questions?: any[];
}

export default function TutorPage() {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'agent', content: `こんにちは! I'm Sensei, your AI Japanese tutor. Ask me anything about Japanese — grammar, kanji, vocabulary, pronunciation, or anything else. I'll explain it clearly at your ${profile?.currentLevels?.kanji ?? 'N5'} level!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
    setMessages(prev => [...prev, userMessage]);

    const agentMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: agentMsgId, role: 'agent', content: '' }]);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let quizData: any[] | null = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'session') setSessionId(parsed.sessionId);
            if (parsed.type === 'chunk') {
              fullContent += parsed.content;
              setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, content: fullContent } : m));
            }
            if (parsed.type === 'quiz') {
              quizData = parsed.questions;
              setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, content: 'Here are your practice questions:', type: 'quiz', questions: parsed.questions } : m));
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, content: 'Sorry, something went wrong. Please try again.' } : m));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const SUGGESTIONS = ['Explain the particle は vs が', 'How do I use て-form?', 'What does お疳れ様でした mean?', 'Quiz me on N5 vocab'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>AI Tutor 🤖</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Powered by Gemini AI • Teaching at {profile?.currentLevels?.kanji ?? 'N5'} level</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.75rem', alignItems: 'flex-start' }}>
            {msg.role === 'agent' && (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
            )}
            <div style={{ maxWidth: '75%', background: msg.role === 'user' ? 'var(--gradient-primary)' : 'var(--bg-card)', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '0.875rem 1.125rem', border: msg.role === 'agent' ? '1px solid var(--border)' : 'none' }}>
              {msg.content === '' && msg.role === 'agent' ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: 20 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `pulse-glow 1.2s ease ${i * 0.2}s infinite` }} />)}
                </div>
              ) : (
                <p style={{ fontSize: '0.925rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
              )}
              {msg.type === 'quiz' && msg.questions && (
                <div style={{ marginTop: '1rem' }}>
                  {msg.questions.map((q: any, i: number) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem' }}>{i + 1}. {q.prompt}</p>
                      {q.options?.map((opt: string) => (
                        <div key={opt} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: 6, marginBottom: '0.25rem', background: opt === q.correctAnswer ? 'rgba(16,185,129,0.1)' : 'transparent', border: opt === q.correctAnswer ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent', color: opt === q.correctAnswer ? '#6ee7b7' : 'var(--text-secondary)' }}>{opt}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setInput(s)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <textarea id="tutor-input" className="input" rows={2} placeholder="Ask Sensei anything about Japanese..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          style={{ resize: 'none', flex: 1, fontFamily: 'inherit' }} />
        <button id="tutor-send" className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: '0.75rem 1.25rem', alignSelf: 'flex-end', flexShrink: 0 }}>
          {loading ? '...' : 'Send ➤'}
        </button>
      </div>
    </div>
  );
}
