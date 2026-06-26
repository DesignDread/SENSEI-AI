'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { FloatingAssistant } from '../components/FloatingAssistant';

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/learn/kana', icon: 'あ', label: 'Kana' },
  { href: '/learn/kanji', icon: '漢', label: 'Kanji' },
  { href: '/learn/grammar', icon: '文', label: 'Grammar' },
  { href: '/learn/vocabulary', icon: '📖', label: 'Vocabulary' },
  { href: '/resources', icon: '📚', label: 'Resources' },
  { href: '/srs', icon: '🃏', label: 'Flashcards' },
  { href: '/tests', icon: '📝', label: 'Mock Tests' },
  { href: '/tutor', icon: '🤖', label: 'AI Tutor' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, setUser, setProfile, logout } = useAuthStore();

  useEffect(() => {
    // If both user and profile are already in persisted store, no need to re-fetch
    if (user && profile) return;

    // No user in store → verify with backend
    authApi.getMe().then((res: any) => {
      setUser(res.data.user);
      if (res.data.hasProfile) {
        setProfile(res.data.profile);
      } else {
        router.push('/setup-profile');
      }
    }).catch(() => {
      // Token expired / invalid → clear store and redirect
      logout();
      router.push('/login');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    logout();
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem' }}>先生</span>
            <span className="gradient-text" style={{ fontWeight: 700, fontSize: '1.1rem' }}>SenseiAI</span>
          </Link>
          {profile && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.displayName}</div>
                <span className={`badge level-${profile.currentLevels.kanji}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{profile.currentLevels.kanji}</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <button id="sidebar-logout" onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem' }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ flex: 1, padding: '2rem', maxWidth: '100%', overflow: 'hidden' }}>
        {children}
      </main>

      {/* AI Assistant */}
      <FloatingAssistant />
    </div>
  );
}
