'use client';
import {
  Pencil,
  Eraser,
  PaintBucket,
  Square,
  MousePointer,
  Grid3X3,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapEditTool } from '@/stores/mapEditorSlice';

interface MapToolbarProps {
  currentTool: MapEditTool;
  onSetTool: (tool: MapEditTool) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const TOOLS: Array<{ tool: MapEditTool; label: string; icon: React.ReactNode; shortcut: string }> =
  [
    { tool: 'select', label: '選択', icon: <MousePointer className="h-4 w-4" />, shortcut: '' },
    { tool: 'pen', label: 'ペン', icon: <Pencil className="h-4 w-4" />, shortcut: 'B' },
    { tool: 'eraser', label: '消しゴム', icon: <Eraser className="h-4 w-4" />, shortcut: 'E' },
    {
      tool: 'fill',
      label: '塗りつぶし',
      icon: <PaintBucket className="h-4 w-4" />,
      shortcut: 'G',
    },
    { tool: 'rect', label: '矩形', icon: <Square className="h-4 w-4" />, shortcut: '' },
  ];

export function MapToolbar({
  currentTool,
  onSetTool,
  showGrid,
  onToggleGrid,
  zoom,
  onZoomIn,
  onZoomOut,
}: MapToolbarProps) {
  return (
    <div className="flex h-header items-center gap-1 border-b bg-background px-2">
      {TOOLS.map(({ tool, label, icon, shortcut }) => (
        <Button
          key={tool}
          variant={currentTool === tool ? 'default' : 'ghost'}
          size="icon"
          aria-label={shortcut ? `${label} (${shortcut})` : label}
          onClick={() => onSetTool(tool)}
        >
          {icon}
        </Button>
      ))}
      <div className="mx-2 h-5 w-px bg-border" />
      <Button variant="ghost" size="icon" aria-label="グリッド表示切替" onClick={onToggleGrid}>
        <Grid3X3 className={`h-4 w-4 ${showGrid ? 'text-primary' : 'text-muted-foreground'}`} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="ズームイン" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon" aria-label="ズームアウト" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
