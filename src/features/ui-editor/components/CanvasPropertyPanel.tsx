'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/stores';
import type { EditorUICanvas } from '@/stores/uiEditorSlice';

interface CanvasPropertyPanelProps {
  canvas: EditorUICanvas;
}

export function CanvasPropertyPanel({ canvas }: CanvasPropertyPanelProps) {
  const updateUICanvas = useStore((s) => s.updateUICanvas);

  return (
    <div className="space-y-4 p-3" data-testid="canvas-property-panel">
      <h3 className="text-xs font-semibold text-muted-foreground">画面プロパティ</h3>
      <div>
        <Label className="text-xs font-medium">画面名</Label>
        <Input
          className="mt-1 h-7 text-xs"
          value={canvas.name}
          onChange={(e) => updateUICanvas(canvas.id, { name: e.target.value })}
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          スクリプトから UI[&quot;{canvas.name}&quot;] でアクセスします
        </p>
      </div>
      <div>
        <Label className="text-xs font-medium">ID</Label>
        <Input
          className="mt-1 h-7 text-xs text-muted-foreground"
          value={canvas.id}
          readOnly
        />
      </div>
    </div>
  );
}
