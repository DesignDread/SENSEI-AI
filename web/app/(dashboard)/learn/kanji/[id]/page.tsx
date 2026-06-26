'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { kanjiApi } from '@/lib/api';

interface KanjiDetail {
  _id: string;
  character: string;
  jlptLevel: string;
  strokeCount: number;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  radicals: { character: string; meaning: string }[];
  exampleWords: { word: string; reading: string; meaning: string }[];
  mnemonicText?: string;
}

export default function KanjiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [kanji, setKanji] = useState<KanjiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedSRS, setAddedSRS] = useState(false);

  useEffect(() => {
    if (id) {
      kanjiApi.get(id).then((res: any) => setKanji(res.data)).finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddSRS = async () => {
    if (!id) return;
    await kanjiApi.addToSRS(id).catch(() => {});
    setAddedSRS(true);
  };

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 300, borderRadius: 16, marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
    </div>
  );
  if (!kanji) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Kanji not found.</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/learn/kanji" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Kanji List</Link>
      </div>

      {/* Main card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1rem', padding: '2.5rem' }}>
        <div className="font-jp" style={{ fontSize: '6rem', lineHeight: 1, marginBottom: '1rem' }}>{kanji.character}</div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span className={`badge level-${kanji.jlptLevel}`}>{kanji.jlptLevel}</span>
          <span className="badge badge-blue">{kanji.strokeCount} strokes</span>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>{kanji.meanings.join(' • ')}</div>
        <button id={`kanji-add-srs-${kanji._id}`} className={`btn ${addedSRS ? 'btn-secondary' : 'btn-primary'}`} onClick={handleAddSRS} disabled={addedSRS}>
          {addedSRS ? '✓ Added to Flashcards' : '+ Add to Flashcards'}
        </button>
      </div>

      {/* Readings */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Readings (読み方)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>On\'yomi (音読み)</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {kanji.onyomi.map(r => <span key={r} className="badge badge-blue">{r}</span>)}
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kun\'yomi (訓読み)</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {kanji.kunyomi.map(r => <span key={r} className="badge badge-purple">{r}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Radicals */}
      {kanji.radicals?.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Radicals (部首)</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {kanji.radicals.map(r => (
              <div key={r.character} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '0.75rem', textAlign: 'center', minWidth: 60 }}>
                <div className="font-jp" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{r.character}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{r.meaning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mnemonic */}
      {kanji.mnemonicText && (
        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>💡 Mnemonic</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{kanji.mnemonicText}</p>
        </div>
      )}

      {/* Example words */}
      {kanji.exampleWords?.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Example Words (例語)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {kanji.exampleWords.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <div className="font-jp" style={{ fontSize: '1.5rem', minWidth: 60, textAlign: 'center' }}>{w.word}</div>
                <div>
                  <div className="font-jp" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.reading}</div>
                  <div style={{ fontSize: '0.875rem' }}>{w.meaning}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
