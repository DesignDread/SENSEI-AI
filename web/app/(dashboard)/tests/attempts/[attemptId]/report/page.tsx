'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { testsApi } from '@/lib/api';
import { scoreToColor } from '@/lib/utils';

interface Report {
  _id: string;
  testId: { title: string; jlptLevel: string };
  totalScore: number;
  sectionScores: Record<string, number>;
  weaknessTags: string[];
  submittedAt: string;
  answers: { questionId: string; selected: string; correct: boolean; timeSpentSec: number }[];
}

export default function TestReportPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      testsApi.getReport(attemptId).then((res: any) => setReport(res.data)).finally(() => setLoading(false));
    }
  }, [attemptId]);

  if (loading) return <div style={{ maxWidth: 640, margin: '0 auto' }}><div className="skeleton" style={{ height: 300, borderRadius: 16 }} /></div>;
  if (!report) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Report not found.</div>;

  const correctCount = report.answers.filter(a => a.correct).length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/tests" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Tests</Link>
      </div>

      {/* Score card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1rem', padding: '2.5rem' }}>
        <div style={{ fontSize: '5rem', fontWeight: 800, color: scoreToColor(report.totalScore), lineHeight: 1, marginBottom: '0.5rem' }}>{report.totalScore}%</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{(report.testId as any)?.title ?? 'Test Report'}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{correctCount} / {report.answers.length} correct</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span className={`badge level-${(report.testId as any)?.jlptLevel}`}>{(report.testId as any)?.jlptLevel}</span>
          {report.totalScore >= 60 ? <span className="badge badge-green">✓ Passed</span> : <span className="badge badge-red">✗ Keep Practicing</span>}
        </div>
      </div>

      {/* Section scores */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>Section Scores</h2>
        {Object.entries(report.sectionScores).map(([section, score]) => (
          <div key={section} style={{ marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{section}</span>
              <span style={{ fontWeight: 600, color: scoreToColor(score) }}>{score}%</span>
            </div>
            <div className="progress-bar">
              <div style={{ height: '100%', borderRadius: 999, width: `${score}%`, background: scoreToColor(score), transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Weakness tags */}
      {report.weaknessTags.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>👍 Areas to Improve</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {report.weaknessTags.map(tag => <span key={tag} className="badge badge-red" style={{ textTransform: 'capitalize' }}>{tag}</span>)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/srs" className="btn btn-primary" id="report-review-flashcards">Review Flashcards</Link>
        <Link href="/tests" className="btn btn-secondary" id="report-back-tests">Take Another Test</Link>
        <Link href="/tutor" className="btn btn-secondary" id="report-ask-tutor">Ask AI Tutor</Link>
      </div>
    </div>
  );
}
