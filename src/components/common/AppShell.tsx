'use client';

import { useStore } from '@/stores';
import { AutoSaveProvider } from './AutoSaveProvider';
import { UndoHistoryProvider } from './UndoHistoryProvider';
import { Header } from './Header';
import { ToastProvider } from './Toast';

export function AppShell({ children }: { children: React.ReactNode }) {
  const isRestoring = useStore((s) => s.isRestoring);
  const isImportingAssets = useStore((s) => s.isImportingAssets);

  return (
    <ToastProvider>
      <AutoSaveProvider />
      <UndoHistoryProvider />
      {isRestoring ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <img src="/favicon.png" alt="RPG Box" className="mx-auto h-16 w-16 animate-pulse" />
            <p className="mt-4 text-sm text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      ) : (
        <>
          <Header />
          <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
          {isImportingAssets && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
              <div className="text-center">
                <img src="/favicon.png" alt="RPG Box" className="mx-auto h-16 w-16 animate-pulse" />
                <p className="mt-4 text-sm text-muted-foreground">サンプルデータを読み込み中...</p>
              </div>
            </div>
          )}
        </>
      )}
    </ToastProvider>
  );
}
