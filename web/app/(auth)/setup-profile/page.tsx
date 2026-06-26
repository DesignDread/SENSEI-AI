'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const KANA_LEVELS = ['hiragana', 'katakana', 'both_complete'] as const;

export default function SetupProfilePage() {
  const router = useRouter();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [form, setForm] = useState({
    displayName: '',
    currentLevels: {
      kana: 'hiragana' as typeof KANA_LEVELS[number],
      kanji: 'N5' as typeof LEVELS[number],
      vocabulary: 'N5' as typeof LEVELS[number],
      grammar: 'N5' as typeof LEVELS[number],
    },
    dailyGoalMinutes: 15,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      const res = await authApi.setupProfile(payload) as any;
      setProfile(res.data.profile);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Profile setup failed');
    } finally {
      setLoading(false);
    }
  };

  const updateLevel = (skill: keyof typeof form.currentLevels, val: string) => {
    setForm(f => ({ ...f, currentLevels: { ...f.currentLevels, [skill]: val } }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '500px' }} className="animate-fade-in glass">
        <div style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>Setup your Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Tell us about your current Japanese level.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Display Name</label>
              <input className="input" type="text" placeholder="Your name or nickname" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kana Level</label>
                <select className="input" value={form.currentLevels.kana} onChange={e => updateLevel('kana', e.target.value)}>
                  <option value="hiragana">Learning Hiragana</option>
                  <option value="katakana">Learning Katakana</option>
                  <option value="both_complete">Mastered Both</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kanji Level</label>
                <select className="input" value={form.currentLevels.kanji} onChange={e => updateLevel('kanji', e.target.value)}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Vocab Level</label>
                <select className="input" value={form.currentLevels.vocabulary} onChange={e => updateLevel('vocabulary', e.target.value)}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Grammar Level</label>
                <select className="input" value={form.currentLevels.grammar} onChange={e => updateLevel('grammar', e.target.value)}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Daily Goal (Minutes)</label>
              <input className="input" type="number" min={5} max={120} value={form.dailyGoalMinutes} onChange={e => setForm(f => ({ ...f, dailyGoalMinutes: parseInt(e.target.value) || 15 }))} required />
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem' }}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
