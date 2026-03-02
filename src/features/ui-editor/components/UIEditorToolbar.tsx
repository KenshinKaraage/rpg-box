'use client';

import { Grid3X3, Magnet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/stores';

export function UIEditorToolbar() {
  const showGrid = useStore((s) => s.showUIGrid);
  const toggleGrid = useStore((s) => s.toggleUIGrid);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const toggleSnap = useStore((s) => s.toggleSnapToGrid);
  const gridSize = useStore((s) => s.uiGridSize);
  const setGridSize = useStore((s) => s.setUIGridSize);

  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'rgba(var(--background), 0.9)',
        padding: '2px 4px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="グリッド表示切替"
        onClick={toggleGrid}
      >
        <Grid3X3
          className={`h-4 w-4 ${showGrid ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="スナップ切替"
        onClick={toggleSnap}
      >
        <Magnet
          className={`h-4 w-4 ${snapToGrid ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </Button>
      <Input
        type="number"
        min={1}
        max={256}
        value={gridSize}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= 1) setGridSize(v);
        }}
        className="h-7 w-14 px-1 text-center text-xs"
        aria-label="グリッドサイズ"
      />
    </div>
  );
}
