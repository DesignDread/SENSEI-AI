'use client';
import React from 'react';

export default function ResourcesPage() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Resources (資料)</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Curated learning materials, e-books, and YouTube channels to boost your Japanese.</p>
      </div>

      {/* E-Books Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>📚</span> Recommended Textbooks & E-books
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <a href="https://jlpt.jp/e/samples/sampleindex.html" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = '')}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>JLPT Official Sample Workbooks</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Free official sample PDFs and audio files from the creators of the JLPT (N5 to N1).</p>
              <span className="badge level-N5">All Levels</span>
            </div>
          </a>

          <div className="card">
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Minna no Nihongo (みんなの日本語)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>One of the most popular textbook series for beginners (N5-N4). Highly recommended for building a strong foundation.</p>
            <span className="badge badge-purple" style={{ marginRight: '0.5rem' }}>N5 - N4</span>
            <span className="badge badge-blue">Grammar Focus</span>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Genki I & II (元気)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>The standard university textbook. Excellent explanations in English and comprehensive exercises.</p>
            <span className="badge badge-purple" style={{ marginRight: '0.5rem' }}>N5 - N4</span>
            <span className="badge badge-blue">All Rounder</span>
          </div>
          
          <div className="card">
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Shin Kanzen Master (新完全マスター)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>The gold standard for N3, N2, and N1 prep. Separate books for Grammar, Reading, Listening, etc.</p>
            <span className="badge badge-purple" style={{ marginRight: '0.5rem' }}>N3 - N1</span>
            <span className="badge badge-blue">Test Prep</span>
          </div>
        </div>
      </section>

      {/* YouTube Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>📺</span> Recommended YouTube Channels
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <a href="https://www.youtube.com/c/ComprehensibleJapanese" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ transition: 'transform 0.2s' }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = '')}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#ff0000' }}>▶</span> Comprehensible Japanese
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Learn Japanese naturally through listening and drawing. Amazing for total beginners.</p>
              <span className="badge badge-blue">Listening</span>
            </div>
          </a>

          <a href="https://www.youtube.com/@nihongonomori2013" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ transition: 'transform 0.2s' }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = '')}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#ff0000' }}>▶</span> Nihongo no Mori
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Taught entirely in Japanese by native speakers. Incredible for N3, N2, and N1 test prep.</p>
              <span className="badge level-N3" style={{ marginRight: '0.5rem' }}>N3-N1</span>
              <span className="badge badge-blue">Grammar & Test Prep</span>
            </div>
          </a>

          <a href="https://www.youtube.com/@GameGengo" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ transition: 'transform 0.2s' }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = '')}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#ff0000' }}>▶</span> Game Gengo
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Learn Japanese grammar and vocabulary through context found in video games.</p>
              <span className="badge badge-purple" style={{ marginRight: '0.5rem' }}>Immersion</span>
            </div>
          </a>

          <a href="https://www.youtube.com/c/JapaneseAmoWithMisa" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ transition: 'transform 0.2s' }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = '')}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#ff0000' }}>▶</span> Japanese Ammo with Misa
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Extremely detailed grammar explanations in English. Great for building strong sentence patterns.</p>
              <span className="badge level-N5" style={{ marginRight: '0.5rem' }}>Beginner-Intermediate</span>
            </div>
          </a>
        </div>
      </section>

      {/* Free Tooling */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>🛠️</span> Free Dictionaries & Tools
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <a href="https://jisho.org" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', transition: 'transform 0.2s' }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = '')}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>辞書</div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>Jisho.org</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>The best online EN-JP dictionary</p>
            </div>
          </a>
          <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', transition: 'transform 0.2s' }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform = '')}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✍️</div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>KanjiVG</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Open source kanji stroke animations</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
