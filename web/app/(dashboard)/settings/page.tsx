'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
const KANA_LEVELS = ['hiragana', 'katakana', 'both_complete'];

export default function SettingsPage() {
  const { user, profile, setProfile } = useAuthStore();
  const [form, setForm] = useState({
    displayName: profile?.displayName ?? '',
    currentLevels: {
      kana: profile?.currentLevels?.kana ?? 'hiragana',
      kanji: profile?.currentLevels?.kanji ?? 'N5',
      vocabulary: profile?.currentLevels?.vocabulary ?? 'N5',
      grammar: profile?.currentLevels?.grammar ?? 'N5',
    },
    dailyGoalMinutes: profile?.dailyGoalMinutes ?? 15,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const updateLevel = (skill: keyof typeof form.currentLevels, val: string) => {
    setForm(f => ({ ...f, currentLevels: { ...f.currentLevels, [skill]: val } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setError('');
    try {
      const res = await authApi.updateProfile(form) as any;
      setProfile(res.data.profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your profile and learning preferences.</p>
      </div>

      <div className="card">
        <h2 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Profile</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Display Name</label>
            <input className="input" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kana Level</label>
              <select className="input" value={form.currentLevels.kana} onChange={e => updateLevel('kana', e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="hiragana">Learning Hiragana</option>
                <option value="katakana">Learning Katakana</option>
                <option value="both_complete">Mastered Both</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kanji Level</label>
              <select className="input" value={form.currentLevels.kanji} onChange={e => updateLevel('kanji', e.target.value)} style={{ cursor: 'pointer' }}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Vocabulary Level</label>
              <select className="input" value={form.currentLevels.vocabulary} onChange={e => updateLevel('vocabulary', e.target.value)} style={{ cursor: 'pointer' }}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Grammar Level</label>
              <select className="input" value={form.currentLevels.grammar} onChange={e => updateLevel('grammar', e.target.value)} style={{ cursor: 'pointer' }}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Daily Goal (Minutes)</label>
            <input className="input" type="number" min={5} max={120} value={form.dailyGoalMinutes} onChange={e => setForm(f => ({ ...f, dailyGoalMinutes: parseInt(e.target.value) || 15 }))} />
          </div>

          {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', color: '#6ee7b7', fontSize: '0.875rem' }}>✓ Settings saved successfully!</div>}
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem' }}>{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1.05rem' }}>Account Info</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</span>
            <span style={{ fontSize: '0.875rem' }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Status</span>
            <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>{user?.isVerified ? 'Verified' : 'Unverified'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
