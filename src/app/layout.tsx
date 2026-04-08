import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AppShell } from '@/components/common/AppShell';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RPG Box',
  description: 'Browser-based RPG editor',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className={`${inter.className} flex min-h-screen flex-col bg-background antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
