'use client';

import { useStore } from '@/stores';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const isRestoring = useStore((s) => s.isRestoring);

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <img src="/favicon.png" alt="RPG Box" className="mx-auto h-16 w-16 animate-pulse" />
          <p className="mt-4 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
    </>
  );
}
