'use client';
import { useEffect, useState, useCallback } from 'react';
import { srsApi, kanjiApi, vocabApi, grammarApi } from '@/lib/api';

interface SrsCard {
  _id: string;
  itemType: string;
  itemId: any;
  intervalDays: number;
  repetitions: number;
}

const GRADE_BUTTONS = [
  { grade: 1, label: 'Wrong',  sublabel: '< 1 day',    color: 'rgba(239,68,68,0.2)',   border: 'rgba(239,68,68,0.4)',   text: '#fca5a5' },
  { grade: 2, label: 'Hard',   sublabel: '~1 day',     color: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d' },
  { grade: 3, label: 'Good',   sublabel: 'a few days', color: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' },
  { grade: 4, label: 'Easy',   sublabel: 'a week+',    color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)', text: '#6ee7b7' },
];

// States for the page lifecycle
type PageState = 'loading' | 'seeding' | 'reviewing' | 'done' | 'error';

export default function SrsPage() {
  const [pageState, setPageState]     = useState<PageState>('loading');
  const [cards, setCards]             = useState<SrsCard[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [revealed, setRevealed]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [seedInfo, setSeedInfo]       = useState<{ added: number; level: string } | null>(null);
  const [errorMsg, setErrorMsg]       = useState('');

  // Helper to fetch item details via API
  const populateCardsViaApi = async (unpopulatedCards: SrsCard[]) => {
    return Promise.all(unpopulatedCards.map(async (card) => {
      try {
        let res: any;
        if (card.itemType === 'vocab') res = await vocabApi.get(card.itemId);
        else if (card.itemType === 'kanji') res = await kanjiApi.get(card.itemId);
        else if (card.itemType === 'grammar') res = await grammarApi.get(card.itemId);
        return { ...card, itemId: res?.data ?? card.itemId };
      } catch {
        return card;
      }
    }));
  };

  // ── Core flow ────────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setPageState('loading');
    setErrorMsg('');
    setSessionStats({ reviewed: 0, correct: 0 });
    setCurrentIdx(0);
    setRevealed(false);

    try {
      // 1. How many cards due right now?
      const dueRes = await srsApi.getDue(20) as any;
      const due: SrsCard[] = dueRes.data.cards ?? [];

      if (due.length > 0) {
        // Great — start reviewing immediately
        const populated = await populateCardsViaApi(due);
        setCards(populated);
        setPageState('reviewing');
        return;
      }

      // 2. No cards due → check if the user has ANY cards at all
      const statsRes = await srsApi.getStats() as any;
      const totalCards: number = statsRes.data.total ?? 0;

      if (totalCards === 0) {
        // First time user — auto-seed from content DB
        setPageState('seeding');
        const seedRes = await srsApi.seed(30) as any;
        const info = { added: seedRes.data.added ?? 0, level: seedRes.data.level ?? 'N5' };
        setSeedInfo(info);

        // Then pull the newly seeded cards
        const freshRes = await srsApi.getDue(20) as any;
        const freshCards: SrsCard[] = freshRes.data.cards ?? [];
        const populatedFresh = await populateCardsViaApi(freshCards);
        setCards(populatedFresh);
        setPageState(populatedFresh.length > 0 ? 'reviewing' : 'done');
      } else {
        // User has cards but none are due today
        setCards([]);
        setPageState('done');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
      setPageState('error');
    }
  }, []);

  useEffect(() => { startSession(); }, [startSession]);

  // ── Grading ──────────────────────────────────────────────────────────────
  const currentCard = cards[currentIdx];
  const item        = currentCard?.itemId;
  const isLast      = currentIdx >= cards.length - 1;
  const progressPct = cards.length > 0 ? (sessionStats.reviewed / cards.length) * 100 : 0;

  const handleGrade = async (grade: number) => {
    if (!currentCard || submitting) return;
    setSubmitting(true);

    // Fire-and-forget — don't block the UI
    srsApi.review(currentCard._id, grade).catch(() => {});

    setSessionStats(s => ({
      reviewed: s.reviewed + 1,
      correct:  s.correct + (grade >= 3 ? 1 : 0),
    }));
    setSubmitting(false);

    if (isLast) {
      setPageState('done');
    } else {
      setCurrentIdx(i => i + 1);
      setRevealed(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: '1.5rem' }}>
        <div style={{ fontSize: '3rem' }}>🃏</div>
        <div className="skeleton" style={{ width: 420, height: 260, borderRadius: 16 }} />
        <div className="skeleton" style={{ width: 420, height: 56,  borderRadius: 12 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading your flashcards…</p>
      </div>
    );
  }

  // ── Auto-seeding ─────────────────────────────────────────────────────────
  if (pageState === 'seeding') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>✨</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Building your deck…</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          We&apos;re automatically loading vocabulary, kanji, and grammar cards for your level from the database. Just a moment!
        </p>
        <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--accent-purple)',
              animation: `pulse-glow 1s ease-in-out ${i * 0.3}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--accent-red)' }}>
          Could not load flashcards
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
          {errorMsg}
        </p>
        <button className="btn btn-primary" onClick={startSession} id="srs-retry">Try Again</button>
      </div>
    );
  }

  // ── Session Complete / No cards due ──────────────────────────────────────
  if (pageState === 'done') {
    const accuracy = sessionStats.reviewed > 0
      ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
      : -1;

    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: 540, margin: '0 auto' }}>
        {sessionStats.reviewed > 0 ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Session Complete!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              You reviewed {sessionStats.reviewed} card{sessionStats.reviewed !== 1 ? 's' : ''}
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div className="card" style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>{sessionStats.correct}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Correct</div>
              </div>
              <div className="card" style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-red)' }}>
                  {sessionStats.reviewed - sessionStats.correct}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Wrong</div>
              </div>
              <div className="card" style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }} className="gradient-text">{accuracy}%</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Accuracy</div>
              </div>
            </div>

            {/* Accuracy bar */}
            <div style={{ marginBottom: '2rem' }}>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-fill" style={{
                  width: `${accuracy}%`,
                  background: accuracy >= 70 ? 'var(--accent-green)' : accuracy >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)',
                }} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={startSession} id="srs-restart">Review More Cards</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>☀️</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>All caught up!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
              No cards are due for review right now. Come back later or add more content to expand your deck.
            </p>
            <button className="btn btn-primary" onClick={startSession} id="srs-check-again">Check Again</button>
          </>
        )}

        {/* Seed info toast */}
        {seedInfo && seedInfo.added > 0 && (
          <div style={{
            marginTop: '2rem', padding: '0.75rem 1.25rem',
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 'var(--radius)', fontSize: '0.85rem', color: 'var(--accent-purple-light)',
          }}>
            ✨ Auto-added <strong>{seedInfo.added}</strong> {seedInfo.level} cards to your deck from the database!
          </div>
        )}
      </div>
    );
  }

  // ── Main Review UI ────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Flashcard Review</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Card <strong style={{ color: 'var(--text-primary)' }}>{currentIdx + 1}</strong> of {cards.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-green">✓ {sessionStats.correct}</span>
          <span className="badge badge-red">✗ {sessionStats.reviewed - sessionStats.correct}</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
        <span>{sessionStats.reviewed} reviewed</span>
        <span>{cards.length - sessionStats.reviewed} remaining</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: '1.25rem', height: 8 }}>
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Dot track */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {cards.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < sessionStats.reviewed
              ? 'var(--accent-green)'
              : i === currentIdx
                ? 'var(--accent-purple)'
                : 'var(--border)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Seed banner (first session) */}
      {seedInfo && seedInfo.added > 0 && (
        <div style={{
          padding: '0.6rem 1rem', marginBottom: '1.25rem',
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--accent-purple-light)',
          textAlign: 'center',
        }}>
          ✨ Auto-loaded <strong>{seedInfo.added}</strong> {seedInfo.level} cards from database for your first session!
        </div>
      )}

      {/* Card */}
      {currentCard && (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div
            className="glass"
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              minHeight: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <span className="badge badge-purple" style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
              {currentCard.itemType}
            </span>

            {/* Front */}
            <div className="font-jp" style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              {currentCard.itemType === 'vocab'
                ? (item?.word ?? item?.kanji ?? '?')
                : currentCard.itemType === 'kanji'
                  ? (item?.character ?? '?')
                  : (item?.pattern ?? item?.title ?? '?')}
            </div>

            {/* Revealed answer */}
            {revealed && item && (
              <div className="animate-fade-in" style={{
                marginTop: '1.25rem', paddingTop: '1.25rem',
                borderTop: '1px solid var(--border)',
                width: '100%', textAlign: 'center',
              }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-purple-light)' }}>
                  {Array.isArray(item.meanings)
                    ? item.meanings.join(', ')
                    : (item.meaning ?? item.explanation ?? '')}
                </div>

                {(item.reading || item.onyomi?.[0] || item.kunyomi?.[0]) && (
                  <div className="font-jp" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {item.reading || item.onyomi?.[0] || item.kunyomi?.[0]}
                  </div>
                )}

                {item.example && (
                  <div className="font-jp" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {item.example}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          {!revealed ? (
            <button
              id="srs-reveal"
              className="btn btn-primary"
              onClick={() => setRevealed(true)}
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            >
              Reveal Answer
            </button>
          ) : (
            <div>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                How well did you remember?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {GRADE_BUTTONS.map(btn => (
                  <button
                    key={btn.grade}
                    id={`srs-grade-${btn.grade}`}
                    onClick={() => handleGrade(btn.grade)}
                    disabled={submitting}
                    style={{
                      background: btn.color,
                      border: `1px solid ${btn.border}`,
                      borderRadius: 'var(--radius)',
                      padding: '0.85rem 0.5rem',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                      transition: 'all 0.2s ease',
                      opacity: submitting ? 0.5 : 1,
                    }}
                    onMouseOver={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; }}
                  >
                    <span style={{ fontWeight: 600, color: btn.text, fontSize: '0.875rem' }}>{btn.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{btn.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
