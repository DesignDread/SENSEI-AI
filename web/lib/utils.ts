export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getLevelBadgeClass(level: string): string {
  const map: Record<string, string> = {
    N5: 'level-N5', N4: 'level-N4', N3: 'level-N3', N2: 'level-N2', N1: 'level-N1',
  };
  return map[level] || 'badge-blue';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function scoreToColor(score: number): string {
  if (score >= 80) return 'var(--accent-green)';
  if (score >= 60) return 'var(--accent-gold)';
  return 'var(--accent-red)';
}

export function gradeToLabel(grade: number): { label: string; color: string } {
  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Blackout', color: 'var(--accent-red)' },
    1: { label: 'Wrong', color: 'var(--accent-red)' },
    2: { label: 'Hard', color: 'var(--accent-gold)' },
    3: { label: 'Good', color: 'var(--accent-blue)' },
    4: { label: 'Easy', color: 'var(--accent-green)' },
    5: { label: 'Perfect', color: '#a78bfa' },
  };
  return map[grade] || { label: 'Unknown', color: 'var(--text-secondary)' };
}
