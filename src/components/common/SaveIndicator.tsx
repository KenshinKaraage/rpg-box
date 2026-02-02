'use client';

import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useStore } from '@/stores';

interface SaveIndicatorProps {
  className?: string;
}

export function SaveIndicator({ className }: SaveIndicatorProps) {
  const saveStatus = useStore((state) => state.saveStatus);

  return (
    <div
      className={cn('flex items-center gap-1.5 text-sm', className)}
      data-testid="save-indicator"
      aria-live="polite"
    >
      {saveStatus === 'unsaved' && (
        <>
          <span
            className="h-2 w-2 rounded-full bg-yellow-500"
            aria-hidden="true"
            data-testid="unsaved-dot"
          />
          <span className="text-muted-foreground">未保存</span>
        </>
      )}
      {saveStatus === 'saving' && (
        <>
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-muted-foreground"
            aria-hidden="true"
            data-testid="saving-spinner"
          />
          <span className="text-muted-foreground">保存中...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <span className="text-muted-foreground" data-testid="saved-text">
          保存済み
        </span>
      )}
    </div>
  );
}
