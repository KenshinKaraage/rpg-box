'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DropIndicator } from './DropIndicator';
import { END_DROP_ZONE_ID } from './fieldDragTypes';

interface EndDropZoneProps {
  isEmpty: boolean;
  showInsertLine: boolean;
}

export function EndDropZone({ isEmpty, showInsertLine }: EndDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: END_DROP_ZONE_ID });

  if (isEmpty) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground',
          isOver && 'border-primary bg-accent/50'
        )}
      >
        パレットからドラッグしてフィールドを追加
      </div>
    );
  }

  return (
    <div ref={setNodeRef} className="relative h-8">
      {showInsertLine && <DropIndicator position="before" />}
    </div>
  );
}
