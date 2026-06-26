'use client';
import { useEffect, useState } from 'react';
import { grammarApi } from '@/lib/api';

interface Grammar { _id: string; title: string; jlptLevel: string; explanation?: string; structurePattern: string; category: string; examples?: { jp: string; reading: string; en: string }[]; usageNotes?: string; }

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
const CATEGORIES = ['All', 'particle', 'verb_form', 'adjective_form', 'sentence_pattern'];

export default function GrammarPage() {
  const [grammar, setGrammar] = useState<Grammar[]>([]);
  const [level, setLevel] = useState('N5');
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    grammarApi.list({ level, category: category === 'All' ? undefined : category }).then((res: any) => {
      setGrammar(res.data);
    }).finally(() => setLoading(false));
  }, [level, category]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Grammar (文法)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Master grammar patterns with examples and usage notes.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)} id={`grammar-level-${l}`}
            className={`btn ${level === l ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: 48, padding: '0.5rem 0.75rem' }}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} id={`grammar-cat-${c}`}
            className={`btn ${category === c ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>{c.replace('_', ' ')}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : grammar.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💭</div>
          <p>No grammar points found for this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {grammar.map(g => (
            <div key={g._id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === g._id ? null : g._id)} id={`grammar-item-${g._id}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="font-jp" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-purple-light)' }}>{g.title}</span>
                    <span className={`badge level-${g.jlptLevel}`}>{g.jlptLevel}</span>
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{g.category.replace('_', ' ')}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>{g.structurePattern}</p>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{expanded === g._id ? '▲' : '▼'}</span>
              </div>

              {expanded === g._id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  {g.explanation && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.6 }}>{g.explanation}</p>
                  )}
                  {g.usageNotes && (
                    <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      💡 {g.usageNotes}
                    </div>
                  )}
                  {g.examples && g.examples.length > 0 && (
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Examples</p>
                      {g.examples.map((ex, i) => (
                        <div key={i} style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--accent-purple)' }}>
                          <div className="font-jp" style={{ fontSize: '1rem', marginBottom: '0.1rem' }}>{ex.jp}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{ex.reading}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{ex.en}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!g.explanation && (!g.examples || g.examples.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Detailed explanation will be generated by Sensei AI when you open this grammar point directly. 🤖
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
