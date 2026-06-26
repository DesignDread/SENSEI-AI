'use client';
import { useEffect, useState } from 'react';
import { vocabApi } from '@/lib/api';

interface Vocab { _id: string; word: string; reading: string; meanings: string[]; partOfSpeech: string; jlptLevel: string; category?: string; }

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

export default function VocabularyPage() {
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [level, setLevel] = useState('N5');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      vocabApi.list({ level, search: search || undefined, page }).then((res: any) => {
        setVocab(res.data);
        setTotalPages(res.totalPages);
      }).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [level, search, page]);

  const addToSRS = async (id: string) => {
    await vocabApi.addToSRS(id).catch(() => {});
    setAddedIds(s => new Set(s).add(id));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Vocabulary (語彙)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Build your word bank with readings, meanings, and example sentences.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {LEVELS.map(l => (
            <button key={l} onClick={() => { setLevel(l); setPage(1); }} id={`vocab-level-${l}`}
              className={`btn ${level === l ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: 48, padding: '0.5rem 0.75rem' }}>{l}</button>
          ))}
        </div>
        <input id="vocab-search" className="input" placeholder="Search words..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 240 }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 70 }} />)}
        </div>
      ) : vocab.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p>No vocabulary found. Try a different search or level.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {vocab.map(v => (
            <div key={v._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.25rem' }}>
              <div style={{ minWidth: 80, textAlign: 'center' }}>
                <div className="font-jp" style={{ fontSize: '1.75rem', lineHeight: 1 }}>{v.word}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{v.reading}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{v.meanings.join(', ')}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge level-${v.jlptLevel}`}>{v.jlptLevel}</span>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{v.partOfSpeech}</span>
                  {v.category && <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{v.category}</span>}
                </div>
              </div>
              <button id={`add-srs-${v._id}`} onClick={() => addToSRS(v._id)} disabled={addedIds.has(v._id)}
                className={`btn ${addedIds.has(v._id) ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', flexShrink: 0 }}>
                {addedIds.has(v._id) ? '✓ Added' : '+ SRS'}
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} id="vocab-prev">← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} id="vocab-next">Next →</button>
        </div>
      )}
    </div>
  );
}
