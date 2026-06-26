'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { aiApi } from '@/lib/api';
import html2canvas from 'html2canvas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const STORAGE_KEY = 'sensei-chat-messages';
const SESSION_KEY  = 'sensei-chat-sessionId';

type ChatMsg = { role: 'user' | 'agent'; text: string; image?: string };

const loadMessages = (): ChatMsg[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [{ role: 'agent', text: 'こんにちは！ I am Sensei. Ask me anything about Japanese!' }];
};

const saveMessages = (msgs: ChatMsg[]) => {
  try {
    // Keep last 100 messages only
    const trimmed = msgs.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
};

export function FloatingAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen]        = useState(false);
  const [activeTab, setActiveTab]  = useState<'chat' | 'screen'>('chat');
  const [input, setInput]          = useState('');
  const [messages, setMessages]    = useState<ChatMsg[]>([]);
  const [screenMessages, setScreenMessages] = useState<ChatMsg[]>([
    { role: 'agent', text: 'Have a question about what you see on the screen? Ask me and I will analyse it!' },
  ]);
  const [loading, setLoading]      = useState(false);
  const [sessionId, setSessionId]  = useState<string | null>(null);
  const [hydrated, setHydrated]    = useState(false);

  const messagesEndRef       = useRef<HTMLDivElement>(null);
  const screenMessagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef             = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    setMessages(loadMessages());
    try {
      const sid = localStorage.getItem(SESSION_KEY);
      if (sid) setSessionId(sid);
    } catch {}
    setHydrated(true);
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    if (hydrated) saveMessages(messages);
  }, [messages, hydrated]);

  // Persist sessionId
  useEffect(() => {
    try {
      if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    screenMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [screenMessages]);

  // ── Chat submit ──────────────────────────────────────────────────────────
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    // Optimistic empty agent message to stream into
    setMessages(prev => [...prev, { role: 'agent', text: '' }]);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || 'Chat failed');
      }

      const reader  = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'session' && data.sessionId) {
                setSessionId(data.sessionId);
              }
              if (data.type === 'chunk' && data.content) {
                setMessages(prev => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    text: next[next.length - 1].text + data.content,
                  };
                  return next;
                });
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'agent', text: `Sorry, something went wrong: ${err.message}` };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Screen submit ────────────────────────────────────────────────────────
  const handleScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setLoading(true);

    try {
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        scale: 0.8,
        ignoreElements: (el) => el.id === 'floating-assistant',
      });
      const base64 = canvas.toDataURL('image/jpeg', 0.6);
      setScreenMessages(prev => [...prev, { role: 'user', text: userText, image: base64 }]);

      const res = await aiApi.screenHelp(base64, userText, pathname) as any;
      setScreenMessages(prev => [...prev, { role: 'agent', text: res.data.answer }]);
    } catch (err: any) {
      setScreenMessages(prev => [
        ...prev,
        { role: 'agent', text: `Sorry, I could not analyse the screen: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Clear chat ───────────────────────────────────────────────────────────
  const handleClearChat = () => {
    const fresh: ChatMsg[] = [{ role: 'agent', text: 'こんにちは！ I am Sensei. Ask me anything about Japanese!' }];
    setMessages(fresh);
    setSessionId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  const currentMessages = activeTab === 'chat' ? messages : screenMessages;
  const currentEndRef   = activeTab === 'chat' ? messagesEndRef : screenMessagesEndRef;

  // ── FAB ──────────────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        id="floating-assistant-fab"
        onClick={() => setIsOpen(true)}
        title="Open AI Sensei"
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--gradient-primary)', color: 'white',
          border: 'none', boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.5rem', zIndex: 9999,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.5)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.4)'; }}
      >
        先生
      </button>
    );
  }

  // ── Panel ────────────────────────────────────────────────────────────────
  return (
    <div
      id="floating-assistant"
      style={{
        position: 'fixed', bottom: '2rem', right: '2rem',
        width: '390px', height: '580px',
        maxHeight: 'calc(100vh - 4rem)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        zIndex: 9999, overflow: 'hidden',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(124,58,237,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>
            先
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sensei AI</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)' }}>● Online · remembers your chats</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {/* Clear button */}
          {activeTab === 'chat' && (
            <button
              title="Clear chat history"
              onClick={handleClearChat}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.3rem 0.5rem', borderRadius: '0.4rem' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              🗑️
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.4rem', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >×</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
        {(['chat', 'screen'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '0.65rem', border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: activeTab === tab ? (tab === 'chat' ? 'var(--accent-purple-light)' : 'var(--accent-gold)') : 'var(--text-muted)',
            borderBottom: activeTab === tab ? `2px solid ${tab === 'chat' ? 'var(--accent-purple-light)' : 'var(--accent-gold)'}` : '2px solid transparent',
            fontWeight: 500, fontSize: '0.85rem',
          }}>
            {tab === 'chat' ? '💬 Chat' : '🖥️ Ask Screen'}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {currentMessages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: msg.role === 'user' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.06)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              padding: '0.65rem 0.9rem',
              borderRadius: '1rem',
              borderBottomRightRadius: msg.role === 'user' ? '0.2rem' : '1rem',
              borderBottomLeftRadius: msg.role === 'agent' ? '0.2rem' : '1rem',
              maxWidth: '88%', fontSize: '0.875rem', lineHeight: 1.55,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {(msg as any).image && (
                <img src={(msg as any).image} alt="Screenshot" style={{ width: '100%', borderRadius: '0.5rem', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }} />
              )}
              {msg.text || (msg.role === 'agent' && loading && i === currentMessages.length - 1 ? (
                <span style={{ opacity: 0.5 }}>Thinking…</span>
              ) : null)}
            </div>
          </div>
        ))}
        <div ref={currentEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={activeTab === 'chat' ? handleChatSubmit : handleScreenSubmit}
        style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.1)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={activeTab === 'chat' ? 'Ask Sensei anything…' : 'Ask about this screen…'}
          style={{
            flex: 1, padding: '0.65rem 1rem', borderRadius: '2rem',
            border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem',
          }}
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading} style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: input.trim() && !loading ? (activeTab === 'chat' ? 'var(--accent-purple)' : 'var(--accent-gold)') : 'rgba(255,255,255,0.1)',
          color: 'white', border: 'none',
          cursor: input.trim() && !loading ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', transition: 'background 0.2s, transform 0.1s',
          flexShrink: 0,
        }}>↑</button>
      </form>
    </div>
  );
}
