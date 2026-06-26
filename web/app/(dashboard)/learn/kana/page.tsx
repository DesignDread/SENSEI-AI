'use client';
import { useEffect, useState, useRef } from 'react';
import { kanaApi } from '@/lib/api';

interface Kana { _id: string; character: string; script: string; romaji: string; mnemonicText?: string; }

const SCRIPTS = ['hiragana', 'katakana'];

// Map romaji to Unicode code point for KanjiVG SVG stroke order
const charToCodepoint = (char: string): string => {
  const cp = char.codePointAt(0);
  if (!cp) return '';
  return cp.toString(16).padStart(5, '0');
};

// Speak using Web Speech API
const speak = (text: string) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.8;
  // Try to find a Japanese voice
  const voices = window.speechSynthesis.getVoices();
  const jpVoice = voices.find(v => v.lang.startsWith('ja'));
  if (jpVoice) utterance.voice = jpVoice;
  window.speechSynthesis.speak(utterance);
};

// Animated stroke order SVG overlay
function StrokeOrderModal({ character, onClose }: { character: string; onClose: () => void }) {
  const cp = charToCodepoint(character);
  const svgUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${cp}.svg`;
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);

  useEffect(() => {
    fetch(svgUrl)
      .then(r => r.ok ? r.text() : Promise.reject('Not found'))
      .then(text => setSvgContent(text))
      .catch(() => setError(true));
  }, [svgUrl]);

  useEffect(() => {
    if (svgContent && containerRef.current) {
      containerRef.current.innerHTML = svgContent.replace('<svg', '<svg style="width:100%;height:100%"');
      const paths = Array.from(containerRef.current.querySelectorAll('path')) as SVGPathElement[];
      pathsRef.current = paths;
      paths.forEach((p, i) => {
        p.style.stroke = `hsl(${260 + i * 20},70%,65%)`;
        p.style.strokeWidth = '3';
        p.style.fill = 'none';
      });
    }
  }, [svgContent]);

  const animate = () => {
    if (!svgContent || animating) return;
    setAnimating(true);
    const paths = pathsRef.current;
    paths.forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      p.style.transition = 'none';
    });

    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      setTimeout(() => {
        p.style.transition = `stroke-dashoffset 0.6s ease`;
        p.style.strokeDashoffset = '0';
      }, i * 700);
    });

    setTimeout(() => setAnimating(false), paths.length * 700 + 600);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', padding: '2rem', maxWidth: 360, width: '90%', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>
            <span className="font-jp" style={{ fontSize: '2rem', marginRight: '0.75rem' }}>{character}</span>
            Stroke Order
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}>×</button>
        </div>

        {error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
            <p style={{ fontSize: '0.9rem' }}>Stroke order diagram not available for this character.</p>
            <div style={{ fontSize: '5rem', marginTop: '1rem' }} className="font-jp">{character}</div>
          </div>
        ) : !svgContent ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading strokes...</div>
        ) : (
          <div>
            <div
              ref={containerRef}
              style={{ width: '100%', aspectRatio: '1', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', position: 'relative' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={animate} disabled={animating}>
                {animating ? 'Animating...' : '▶ Animate Strokes'}
              </button>
              <button className="btn btn-secondary" onClick={() => speak(character)} style={{ padding: '0.65rem 1rem' }}>🔊</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanaPage() {
  const [kana, setKana] = useState<Record<string, Kana[]>>({ hiragana: [], katakana: [] });
  const [activeScript, setActiveScript] = useState('hiragana');
  const [selected, setSelected] = useState<Kana | null>(null);
  const [loading, setLoading] = useState(true);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    // Load voices (Chrome needs this trigger)
    if (typeof window !== 'undefined') {
      const load = () => setVoicesLoaded(true);
      window.speechSynthesis.onvoiceschanged = load;
      if (window.speechSynthesis.getVoices().length > 0) load();
    }

    Promise.all([
      kanaApi.list('hiragana'),
      kanaApi.list('katakana'),
    ]).then(([h, k]: any[]) => {
      setKana({ hiragana: h.data || [], katakana: k.data || [] });
    }).finally(() => setLoading(false));
  }, []);

  const currentKana = kana[activeScript] || [];

  return (
    <div className="animate-fade-in">
      {selected && <StrokeOrderModal character={selected.character} onClose={() => setSelected(null)} />}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Kana (かな)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Click a card to hear the sound. Click the <strong>strokes</strong> button to see how to write it.
        </p>
      </div>

      {/* Script Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {SCRIPTS.map(s => (
          <button key={s} id={`kana-tab-${s}`} onClick={() => setActiveScript(s)}
            className={`btn ${activeScript === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>
            {s === 'hiragana' ? 'ひらがな Hiragana' : 'カタカナ Katakana'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
          {[...Array(46)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : currentKana.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No kana data found. Run <code>npm run seed</code> in the backend.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
          {currentKana.map(k => (
            <div key={k._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {/* Main card — click to hear */}
              <button onClick={() => speak(k.character)} id={`kana-${k.romaji}`}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '1rem 0.5rem',
                  cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
              >
                <span className="font-jp" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{k.character}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{k.romaji}</span>
                {k.mnemonicText && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: '0.1rem' }}>
                    {k.mnemonicText.slice(0, 28)}{k.mnemonicText.length > 28 ? '...' : ''}
                  </span>
                )}
              </button>
              {/* Strokes button */}
              <button onClick={() => setSelected(k)}
                style={{ fontSize: '0.65rem', padding: '0.3rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--accent-purple-light)'; e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                ✏️ Strokes
              </button>
            </div>
          ))}
        </div>
      )}

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem', textAlign: 'center' }}>
        🔊 Click any card to hear pronunciation · ✏️ Click Strokes to see animated stroke order
      </p>
    </div>
  );
}
