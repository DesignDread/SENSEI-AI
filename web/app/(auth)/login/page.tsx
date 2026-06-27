'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleAuthEnabled = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password) as any;
      setUser(res.data.user);
      if (res.data.hasProfile) {
        setProfile(res.data.profile);
        router.push('/dashboard');
      } else {
        router.push('/setup-profile');
      }
    } catch (err: any) {
      if (err.status === 403 && err.message.includes('verify')) {
        // Needs OTP
        router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      } else {
        setError(err.message || 'Login failed');
      }
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
        setProfile(res.data.profile);
        router.push('/dashboard');
      } else {
        router.push('/setup-profile');
      }
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login popup failed or was closed.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>先生</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }} className="gradient-text">SenseiAI</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Welcome back, student</p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
              <input
                id="login-password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <button id="login-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '0.25rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
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
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent-purple-light)', textDecoration: 'none', fontWeight: 500 }}>Create one →</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
