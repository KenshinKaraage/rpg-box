'use client';

import { useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface ThreeColumnLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  leftDefaultWidth?: number;
  rightDefaultWidth?: number;
  leftMinWidth?: number;
  leftMaxWidth?: number;
  rightMinWidth?: number;
  rightMaxWidth?: number;
  className?: string;
}

export function ThreeColumnLayout({
  left,
  center,
  right,
  leftDefaultWidth = 240,
  rightDefaultWidth = 280,
  leftMinWidth = 180,
  leftMaxWidth = 400,
  rightMinWidth = 200,
  rightMaxWidth = 450,
  className,
}: ThreeColumnLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(leftDefaultWidth);
  const [rightWidth, setRightWidth] = useState(rightDefaultWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (isDraggingLeft.current) {
        const newWidth = e.clientX - containerRect.left;
        setLeftWidth(Math.max(leftMinWidth, Math.min(leftMaxWidth, newWidth)));
      }

      if (isDraggingRight.current) {
        const newWidth = containerRect.right - e.clientX;
        setRightWidth(Math.max(rightMinWidth, Math.min(rightMaxWidth, newWidth)));
      }
    },
    [leftMinWidth, leftMaxWidth, rightMinWidth, rightMaxWidth]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingLeft.current = false;
    isDraggingRight.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const startDraggingLeft = useCallback(() => {
    isDraggingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const startDraggingRight = useCallback(() => {
    isDraggingRight.current = true;
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

      {/* Left resize handle */}
      <div
        className="w-1 flex-shrink-0 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary"
        onMouseDown={startDraggingLeft}
        data-testid="left-resize-handle"
      />

      {/* Center column */}
      <div className="flex-1 overflow-auto bg-background" data-testid="center-column">
        {center}
      </div>

      {/* Right resize handle */}
      <div
        className="w-1 flex-shrink-0 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary"
        onMouseDown={startDraggingRight}
        data-testid="right-resize-handle"
      />

      {/* Right column */}
      <div
        className="flex-shrink-0 overflow-auto border-l bg-background"
        style={{ width: rightWidth }}
        data-testid="right-column"
      >
        {right}
      </div>
    </div>
  );
}
