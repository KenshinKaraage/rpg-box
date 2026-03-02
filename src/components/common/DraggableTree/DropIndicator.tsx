'use client';

import type { DropPosition } from './types';

interface DropIndicatorProps {
  position: DropPosition;
  depth: number;
  indentPx: number;
}

export function DropIndicator({ position, depth, indentPx }: DropIndicatorProps) {
  if (position === 'inside') return null;

  const left = depth * indentPx + 8;

  return (
    <div
      className="pointer-events-none absolute right-0 z-10"
      style={{
        left: `${left}px`,
        ...(position === 'before' ? { top: 0 } : { bottom: 0 }),
        height: '2px',
        backgroundColor: '#3b82f6',
      }}
    />
  );
}
