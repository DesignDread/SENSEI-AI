'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi, srsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { scoreToColor } from '@/lib/utils';

interface DashboardData {
  streak: { current: number; longest: number };
  dailyGoal: { type: string; target: number; progressToday: number };
  xp: number;
  totalStudyMinutes: number;
  srsStats: { total: number; due: number };
}

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [mastery, setMastery] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getMastery(),
    ]).then(([sum, mas]: any[]) => {
      setData(sum.data);
      setMastery(mas.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const goalPercent = data ? Math.min(100, Math.round((data.dailyGoal.progressToday / data.dailyGoal.target) * 100)) : 0;

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Welcome back, {profile?.displayName?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Your Japanese journey continues. Keep it up!</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Streak */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🔥</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }} className="gradient-text-gold">{data?.streak.current ?? 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Day Streak</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Best: {data?.streak.longest ?? 0}</div>
        </div>

        {/* XP */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>⚡</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }} className="gradient-text">{data?.xp ?? 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total XP</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{Math.round((data?.totalStudyMinutes ?? 0))} mins studied</div>
        </div>

        {/* SRS */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🃏</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: (data?.srsStats.due ?? 0) > 0 ? 'var(--accent-gold)' : 'var(--accent-green)' }}>{data?.srsStats.due ?? 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cards Due</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{data?.srsStats.total ?? 0} total cards</div>
        </div>

        {/* Daily Goal */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>Daily Goal</span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{goalPercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${goalPercent}%` }} />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {data?.dailyGoal.progressToday ?? 0} / {data?.dailyGoal.target ?? 20} {data?.dailyGoal.type}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { href: '/srs', icon: '🃏', label: 'Review Cards', color: 'var(--accent-purple)', count: data?.srsStats.due },
            { href: '/tests', icon: '📝', label: 'Take a Test', color: 'var(--accent-blue)' },
            { href: '/tutor', icon: '🤖', label: 'Ask Sensei', color: 'var(--accent-pink)' },
            { href: '/learn/kanji', icon: '漢', label: 'Study Kanji', color: 'var(--accent-gold)' },
          ].map(action => (
            <Link key={action.href} href={action.href} className="card" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{action.icon}</div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{action.label}</div>
              {action.count !== undefined && action.count > 0 && (
                <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: action.color, color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>{action.count}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Mastery by level */}
      {Object.keys(mastery).length > 0 && (
        <div>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.1rem' }}>Mastery Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {Object.entries(mastery).map(([level, scores]: [string, any]) => (
              <div key={level} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className={`badge level-${level}`}>{level}</span>
                </div>
                {['vocab', 'kanji', 'grammar'].map(cat => (
                  <div key={cat} style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                      <span style={{ color: scoreToColor(scores[cat]) }}>{scores[cat]}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${scores[cat]}%`, background: scoreToColor(scores[cat]), transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
