'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/stores';
import { useUndoEditSession } from '@/hooks/useUndoEditSession';
import type { EditorUICanvas } from '@/stores/uiEditorSlice';

interface CanvasPropertyPanelProps {
  canvas: EditorUICanvas;
}

export function CanvasPropertyPanel({ canvas }: CanvasPropertyPanelProps) {
  const uiCanvases = useStore((s) => s.uiCanvases);
  const updateUICanvas = useStore((s) => s.updateUICanvas);
  // canvas.id をそのままリセットキーにすると、ID編集そのものでセッションが
  // 途切れてしまうため、ローカルIDでセッションを管理する（下記 handleIdBlur で確定）
  const { beginEditIfNeeded, endEditSession } = useUndoEditSession('ui-screens', canvas.id);

  // ID はライブバインドすると入力途中の値がそのまま canvasId として使われてしまうため、
  // ローカルstate + blur確定方式にする（FormBuilder のエントリID編集と同じパターン）
  const [localId, setLocalId] = useState(canvas.id);
  const [prevCanvasId, setPrevCanvasId] = useState(canvas.id);
  if (canvas.id !== prevCanvasId) {
    setPrevCanvasId(canvas.id);
    setLocalId(canvas.id);
  }

  const handleIdBlur = () => {
    endEditSession();
    if (!localId || localId === canvas.id) {
      setLocalId(canvas.id);
      return;
    }
    const duplicate = uiCanvases.some((c) => c.id !== canvas.id && c.id === localId);
    if (duplicate) {
      setLocalId(canvas.id);
      return;
    }
    beginEditIfNeeded({ uiCanvases });
    updateUICanvas(canvas.id, { id: localId });
    endEditSession();
  };

  return (
    <div className="space-y-4 p-3" data-testid="canvas-property-panel" onBlur={endEditSession}>
      <h3 className="text-xs font-semibold text-muted-foreground">画面プロパティ</h3>
      <div>
        <Label className="text-xs font-medium">画面名</Label>
        <Input
          className="mt-1 h-7 text-xs"
          value={canvas.name}
          onChange={(e) => {
            beginEditIfNeeded({ uiCanvases });
            updateUICanvas(canvas.id, { name: e.target.value });
          }}
        />
      </div>
      <div>
        <Label className="text-xs font-medium">ID</Label>
        <Input
          className="mt-1 h-7 text-xs"
          value={localId}
          onChange={(e) => setLocalId(e.target.value)}
          onBlur={handleIdBlur}
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          スクリプトから UI[&quot;{canvas.id}&quot;] でアクセスします
        </p>
      </div>
    </div>
  );
}
