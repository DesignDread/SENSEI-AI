'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { testsApi } from '@/lib/api';

export default function TestReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testsApi.getReport(params.id as string).then((res: any) => {
      setReport(res.data);
    }).catch(() => router.push('/tests')).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading report...</div>;
  if (!report) return null;

  const passed = report.totalScore >= 60;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Result banner */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem', background: passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{passed ? '🎉' : '📚'}</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: passed ? 'var(--accent-green)' : '#f87171' }}>{report.totalScore}%</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{passed ? 'Great job! You passed!' : 'Keep studying — you will get there!'}</p>
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {(report.testId as any)?.title} · {(report.testId as any)?.jlptLevel}
        </div>
      </div>

      {/* Section Scores */}
      {report.sectionScores && Object.keys(report.sectionScores).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>Section Breakdown</h2>
          {Object.entries(report.sectionScores).map(([section, score]: [string, any]) => (
            <div key={section} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{section}</span>
                <span style={{ fontWeight: 600, color: score >= 60 ? 'var(--accent-green)' : '#f87171' }}>{score}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div style={{ height: '100%', borderRadius: 999, width: `${score}%`, background: score >= 60 ? 'var(--accent-green)' : '#ef4444', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weaknesses */}
      {report.weaknessTags && report.weaknessTags.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>📌 Areas to Improve</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {report.weaknessTags.map((tag: string) => (
              <span key={tag} className="badge badge-gold" style={{ textTransform: 'capitalize' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => router.push('/tests')}>← More Tests</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => router.push('/srs')}>Review with SRS →</button>
      </div>
    </div>
  );
}
