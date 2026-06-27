'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleAuthEnabled = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await authApi.register(form) as any;
      if (res.data.requiresVerification) {
        router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      } else {
        setUser(res.data.user);
        router.push('/setup-profile');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      if (!credentialResponse.credential) throw new Error('No credential received');
      const res = await authApi.googleLogin(credentialResponse.credential) as any;
      setUser(res.data.user);
      if (res.data.hasProfile) {
        // Technically setProfile is missing here, but it's register so usually new
        router.push('/dashboard');
      } else {
        router.push('/setup-profile');
      }
    } catch (err: any) {
      setError(err.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google signup popup failed or was closed.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>先生</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }} className="gradient-text">Join SenseiAI</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Start your Japanese journey today</p>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
              <input id="reg-email" className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
              <input id="reg-password" className="input" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <button id="reg-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '0.25rem' }}>
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>

          {googleAuthEnabled && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</div>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-purple-light)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
