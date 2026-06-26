'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { testsApi } from '@/lib/api';

interface Test { _id: string; title: string; jlptLevel: string; totalDurationMinutes: number; description?: string; }

const LEVELS = ['', 'N5', 'N4', 'N3', 'N2', 'N1'];

function TestConfigModal({ test, onStart, onClose }: { test: Test; onStart: (topics: Record<string, boolean>) => void; onClose: () => void }) {
  const [topics, setTopics] = useState({ vocab: true, kanji: true, kana: true, grammar: true });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', maxWidth: 400, width: '90%', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Start Mock Test</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select which sections you want to practice in this test run.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {Object.entries({ vocab: 'Vocabulary', kanji: 'Kanji', kana: 'Kana', grammar: 'Grammar' }).map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '1.05rem' }}>
              <input type="checkbox" checked={(topics as any)[key]} onChange={e => setTopics(prev => ({ ...prev, [key]: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }} />
              {label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onStart(topics)} disabled={!Object.values(topics).some(Boolean)}>
            Begin Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [configTest, setConfigTest] = useState<Test | null>(null);

  useEffect(() => {
    setLoading(true);
    testsApi.list(level || undefined).then((res: any) => {
      setTests(res.data);
    }).finally(() => setLoading(false));
  }, [level]);

  const handleStart = async (id: string, topics: Record<string, boolean>) => {
    setConfigTest(null);
    setStarting(id);
    try {
      const res = await testsApi.start(id) as any;
      const attemptId = res.data.attempt._id;
      
      // Filter questions based on selected topics
      if (res.data.test && res.data.test.sections) {
        res.data.test.sections.forEach((section: any) => {
          if (section.questions) {
            section.questions = section.questions.filter((q: any) => {
              if (q.sectionType === 'grammar') return topics.grammar !== false;
              if (q.sectionType === 'vocab') {
                if (q.tags?.includes('kanji')) return topics.kanji !== false;
                if (q.tags?.includes('kana')) return topics.kana !== false;
                return topics.vocab !== false;
              }
              return true;
            });
          }
        });
      }

      sessionStorage.setItem(`test-${attemptId}`, JSON.stringify(res.data));
      localStorage.setItem(`test-${attemptId}`, JSON.stringify(res.data));
      router.push(`/tests/${attemptId}`);
    } catch {
      setStarting(null);
    }
  };

  return (
    <div className="animate-fade-in">
      {configTest && <TestConfigModal test={configTest} onStart={(topics) => handleStart(configTest._id, topics)} onClose={() => setConfigTest(null)} />}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Mock Tests (模擬試験)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Timed JLPT-style practice tests with detailed score reports.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)} id={`test-filter-${l || 'all'}`}
            className={`btn ${level === l ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 0.85rem' }}>
            {l || 'All Levels'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>No tests available for this level yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {tests.map(t => (
            <div key={t._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className={`badge level-${t.jlptLevel}`}>{t.jlptLevel}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🕓 {t.totalDurationMinutes} min</span>
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{t.title}</h3>
              {t.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>{t.description}</p>}
              <button id={`start-test-${t._id}`} className="btn btn-primary" style={{ width: '100%' }}
                onClick={() => setConfigTest(t)} disabled={starting === t._id}>
                {starting === t._id ? 'Starting...' : 'Start Test →'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
