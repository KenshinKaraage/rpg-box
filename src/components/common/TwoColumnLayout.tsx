'use client';

import { useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftDefaultWidth?: number;
  leftMinWidth?: number;
  leftMaxWidth?: number;
  className?: string;
}

export function TwoColumnLayout({
  left,
  right,
  leftDefaultWidth = 280,
  leftMinWidth = 200,
  leftMaxWidth = 500,
  className,
}: TwoColumnLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(leftDefaultWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current || !isDragging.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      setLeftWidth(Math.max(leftMinWidth, Math.min(leftMaxWidth, newWidth)));
    },
    [leftMinWidth, leftMaxWidth]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const startDragging = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={cn('flex h-full w-full', className)}>
      {/* Left column */}
      <div
        className="flex-shrink-0 overflow-auto border-r bg-background"
        style={{ width: leftWidth }}
        data-testid="left-column"
      >
        {left}
      </div>

      {/* Resize handle */}
      <div
        className="w-1 flex-shrink-0 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary"
        onMouseDown={startDragging}
        data-testid="resize-handle"
      />

      {/* Right column */}
      <div className="flex-1 overflow-auto bg-background" data-testid="right-column">
        {right}
      </div>
    </div>
  );
}
