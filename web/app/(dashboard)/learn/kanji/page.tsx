'use client';
import { useEffect, useState, useRef } from 'react';
import { kanjiApi } from '@/lib/api';

interface Kanji { _id: string; character: string; jlptLevel: string; meanings: string[]; onyomi: string[]; kunyomi: string[]; strokeCount: number; }

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const charToCodepoint = (char: string) => (char.codePointAt(0) || 0).toString(16).padStart(5, '0');

const speak = (text: string) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP'; utt.rate = 0.8;
  const voices = window.speechSynthesis.getVoices();
  const jpVoice = voices.find(v => v.lang.startsWith('ja'));
  if (jpVoice) utt.voice = jpVoice;
  window.speechSynthesis.speak(utt);
};

function StrokeModal({ kanji, onClose }: { kanji: Kanji; onClose: () => void }) {
  const cp = charToCodepoint(kanji.character);
  const svgUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${cp}.svg`;
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(svgUrl)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(text => setSvgContent(text))
      .catch(() => setError(true));
  }, [svgUrl]);

  useEffect(() => {
    if (svgContent && containerRef.current) {
      containerRef.current.innerHTML = svgContent
        .replace('<svg', '<svg style="width:100%;height:100%"')
        .replace(/stroke="[^"]*"/g, '')
        .replace(/fill="[^"]*"/g, '');
      
      const paths = Array.from(containerRef.current.querySelectorAll('path')) as SVGPathElement[];
      paths.forEach((p, i) => {
        p.style.stroke = `hsl(${250 + i * 15},70%,65%)`;
        p.style.strokeWidth = '3';
        p.style.fill = 'none';
      });
    }
  }, [svgContent]);

  const animate = () => {
    if (!containerRef.current || animating) return;
    setAnimating(true);
    const paths = Array.from(containerRef.current.querySelectorAll('path')) as SVGPathElement[];
    paths.forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      p.style.transition = 'none';
    });
    paths.forEach((p, i) => {
      setTimeout(() => {
        p.style.transition = 'stroke-dashoffset 0.7s ease';
        p.style.strokeDashoffset = '0';
      }, i * 800);
    });
    setTimeout(() => setAnimating(false), paths.length * 800 + 700);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', padding: '2rem', maxWidth: 400, width: '90%', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="font-jp" style={{ fontSize: '2.5rem' }}>{kanji.character}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{kanji.meanings.slice(0, 3).join(', ')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kanji.strokeCount} strokes · {kanji.jlptLevel}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {kanji.onyomi.slice(0, 3).map(r => <span key={r} className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{r}</span>)}
              {kanji.kunyomi.slice(0, 3).map(r => <span key={r} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{r}</span>)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', padding: '0 0.25rem' }}>×</button>
        </div>

        {error ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.85rem' }}>Stroke order diagram not available.</p>
          </div>
        ) : !svgContent ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading strokes...</div>
        ) : (
          <div
            ref={containerRef}
            style={{ width: '100%', aspectRatio: '1', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}
          />
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={animate} disabled={animating || !svgContent || error}>
            {animating ? 'Animating...' : '▶ Animate'}
          </button>
          <button className="btn btn-secondary" onClick={() => speak(kanji.character)} title="Hear pronunciation">🔊</button>
          <button className="btn btn-secondary" onClick={() => speak(kanji.onyomi[0] || kanji.character)} title="Hear On-yomi">音</button>
        </div>
      </div>
    </div>
  );
}

export default function KanjiPage() {
  const [kanji, setKanji] = useState<Kanji[]>([]);
  const [level, setLevel] = useState('N5');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Kanji | null>(null);

  useEffect(() => {
    // Preload voices
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {};
      window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    kanjiApi.list({ level, page }).then((res: any) => {
      setKanji(res.data);
      setTotalPages(res.totalPages);
    }).finally(() => setLoading(false));
  }, [level, page]);

  return (
    <div className="animate-fade-in">
      {selected && <StrokeModal kanji={selected} onClose={() => setSelected(null)} />}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Kanji (漢字)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click a card to see stroke order animation and hear pronunciation.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {LEVELS.map(l => (
          <button key={l} id={`kanji-level-${l}`} onClick={() => { setLevel(l); setPage(1); }}
            className={`btn ${level === l ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: 54 }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : kanji.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No kanji loaded yet. Sync is running in background...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {kanji.map(k => (
            <button key={k._id} id={`kanji-card-${k.character}`} onClick={() => setSelected(k)}
              style={{ textDecoration: 'none', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
              <div className="card" style={{ textAlign: 'center', transition: 'transform 0.15s, border-color 0.15s' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-purple)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = ''; }}
              >
                <div className="font-jp" style={{ fontSize: '3rem', lineHeight: 1.2, marginBottom: '0.5rem' }}>{k.character}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{k.meanings.slice(0, 2).join(', ')}</div>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {k.onyomi.slice(0, 2).map(r => <span key={r} className="badge badge-blue" style={{ fontSize: '0.6rem' }}>{r}</span>)}
                  {k.kunyomi.slice(0, 2).map(r => <span key={r} className="badge badge-purple" style={{ fontSize: '0.6rem' }}>{r}</span>)}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.4rem' }}>{k.strokeCount} strokes · ✏️</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} id="kanji-prev">← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} id="kanji-next">Next →</button>
        </div>
      )}
    </div>
  );
}
