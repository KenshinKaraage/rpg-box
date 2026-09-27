'use client';

import type { DropPosition } from './fieldDragTypes';

interface DropIndicatorProps {
  position: DropPosition;
}

export function DropIndicator({ position }: DropIndicatorProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 h-1 rounded-full bg-primary"
      style={position === 'before' ? { top: '-8px' } : { bottom: '-8px' }}
    />
  );
}
