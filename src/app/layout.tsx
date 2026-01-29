import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RPG Box',
  description: 'Browser-based RPG editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
