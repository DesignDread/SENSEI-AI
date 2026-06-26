import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      {/* Hero */}
      <div style={{ marginBottom: '1rem' }} className="animate-fade-in">
        <span className="badge badge-purple" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>✨ Beta — Now Available</span>
      </div>

      <h1 className="gradient-text animate-fade-in" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
        Master Japanese<br />with Your AI Sensei
      </h1>

      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '580px', marginBottom: '2.5rem', lineHeight: 1.7 }} className="animate-fade-in">
        JLPT N5–N1 preparation powered by spaced repetition, real-time AI explanations,
        and adaptive mock tests. Your personal sensei, always available.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }} className="animate-fade-in">
        <Link href="/login" className="btn btn-secondary" id="hero-login-btn">Sign In</Link>
        <Link href="/register" className="btn btn-primary" id="hero-register-btn">Start Learning Free →</Link>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '5rem', maxWidth: '900px', width: '100%' }}>
        {[
          { icon: '🃏', title: 'Spaced Repetition', desc: 'SM-2 algorithm for maximum retention' },
          { icon: '🤖', title: 'AI Tutor', desc: 'Ask anything, get instant explanations' },
          { icon: '📝', title: 'Mock Tests', desc: 'Timed JLPT-style practice exams' },
          { icon: '漢', title: 'Kanji Mastery', desc: 'N5–N1 kanji with mnemonics & stroke order' },
        ].map((f) => (
          <div key={f.title} className="card" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Japanese level row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['N5', 'N4', 'N3', 'N2', 'N1'].map(l => (
          <span key={l} className={`badge level-${l}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>{l}</span>
        ))}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>All JLPT levels covered</p>
    </main>
  );
}
