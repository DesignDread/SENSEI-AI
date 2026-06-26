import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SenseiAI — Master Japanese with AI',
  description: 'The most intelligent JLPT preparation platform. Learn kanji, grammar, and vocabulary with spaced repetition, mock tests, and your personal AI tutor.',
  keywords: 'JLPT, Japanese learning, kanji, grammar, vocabulary, spaced repetition, AI tutor',
  openGraph: {
    title: 'SenseiAI — Master Japanese with AI',
    description: 'AI-powered JLPT preparation platform',
    type: 'website',
  },
};

import { GoogleProvider } from './components/GoogleProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GoogleProvider>
          {children}
        </GoogleProvider>
      </body>
    </html>
  );
}
