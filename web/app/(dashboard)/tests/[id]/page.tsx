'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { testsApi } from '@/lib/api';

interface Question {
  _id: string;
  prompt: string;
  options: string[];
  sectionType: string;
  jlptLevel: string;
}
interface TestData {
  _id: string;
  title: string;
  jlptLevel: string;
  totalDurationMinutes: number;
  sections: { type: string; durationMinutes: number; questions: Question[] }[];
}

export default function TestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [test, setTest] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    // Try sessionStorage first, then localStorage as backup
    const stored =
      sessionStorage.getItem(`test-${attemptId}`) ||
      localStorage.getItem(`test-${attemptId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTest(parsed.test);
        const allQ: Question[] = [];
        parsed.test.sections?.forEach((s: any) => {
          s.questions?.forEach((q: any) => allQ.push(q));
        });
        setQuestions(allQ);
        setTimeLeft((parsed.test.totalDurationMinutes || 20) * 60);
        // Also write to localStorage as backup
        localStorage.setItem(`test-${attemptId}`, stored);
        setLoading(false);
        return;
      } catch {}
    }
    setLoading(false);
  }, [attemptId]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || submitting) return;
    const interval = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { handleSubmit(); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitting]);

  const handleAnswer = (qId: string, option: string) => {
    setAnswers(a => ({ ...a, [qId]: option }));
  };

  const handleNext = () => {
    setQuestionStartTime(Date.now());
    setCurrent(c => Math.min(c + 1, questions.length - 1));
  };

  const handlePrev = () => {
    setQuestionStartTime(Date.now());
    setCurrent(c => Math.max(c - 1, 0));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q._id,
        selected: answers[q._id] || '',
        timeSpentSec: Math.round((Date.now() - questionStartTime) / 1000),
      }));
      const res = await testsApi.submit(attemptId, formattedAnswers) as any;
      sessionStorage.removeItem(`test-${attemptId}`);
      localStorage.removeItem(`test-${attemptId}`);
      router.push(`/tests/report/${attemptId}`);
    } catch (err) {
      alert('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, questions, answers, attemptId, questionStartTime, router]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  // Progress: shows how far through questions the user has navigated
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>Loading test...</div>;

  if (questions.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <p>No questions found for this test. <br/><br/><button className="btn btn-primary" onClick={() => router.push('/tests')}>Back to Tests</button></p>
    </div>
  );

  const q = questions[current];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{test?.title || 'Mock Test'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Question {current + 1} of {questions.length}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: timeLeft < 60 ? '#ef4444' : 'var(--accent-gold)' }}>
            🕓 {formatTime(timeLeft)}
          </div>
          <button className="btn btn-secondary" onClick={handleSubmit} disabled={submitting} style={{ fontSize: '0.85rem' }}>
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>{answeredCount} answered</span>
        <span>{questions.length - answeredCount} remaining</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: '1.5rem', height: 8 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <span className={`badge level-${q.jlptLevel}`}>{q.jlptLevel}</span>
          <span className="badge badge-blue" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>{q.sectionType}</span>
        </div>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>{q.prompt}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {q.options.map((opt, i) => {
            const isSelected = answers[q._id] === opt;
            return (
              <button key={i} onClick={() => handleAnswer(q._id, opt)}
                style={{
                  padding: '0.85rem 1.25rem', textAlign: 'left', borderRadius: 'var(--radius)',
                  border: `2px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border)'}`,
                  background: isSelected ? 'rgba(124,58,237,0.12)' : 'var(--bg-secondary)',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.95rem',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}
              >
                <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, background: isSelected ? 'var(--accent-purple)' : 'transparent', color: isSelected ? 'white' : 'var(--text-muted)' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-jp">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={handlePrev} disabled={current === 0}>← Prev</button>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: 28, height: 28, borderRadius: '50%', border: '1px solid',
              borderColor: i === current ? 'var(--accent-purple)' : (answers[questions[i]._id] ? 'var(--accent-green)' : 'var(--border)'),
              background: i === current ? 'var(--accent-purple)' : (answers[questions[i]._id] ? 'rgba(16,185,129,0.15)' : 'transparent'),
              color: i === current ? 'white' : 'var(--text-secondary)',
              fontSize: '0.7rem', cursor: 'pointer',
            }}>{i + 1}</button>
          ))}
        </div>
        {current < questions.length - 1
          ? <button className="btn btn-primary" onClick={handleNext}>Next →</button>
          : <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Finish ✓'}</button>
        }
      </div>
    </div>
  );
}
