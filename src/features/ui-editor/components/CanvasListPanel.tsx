'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { EditorUICanvas } from '@/stores/uiEditorSlice';

interface CanvasListPanelProps {
  canvases: EditorUICanvas[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function CanvasListPanel({ canvases, selectedId, onSelect, onAdd, onDelete }: CanvasListPanelProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <span className="text-xs font-semibold text-muted-foreground">画面一覧</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAdd} aria-label="画面を追加">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {canvases.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">
          画面がありません
        </div>
      ) : (
        <ul role="listbox" aria-label="画面一覧">
          {canvases.map((canvas) => (
            <li
              key={canvas.id}
              role="option"
              aria-selected={canvas.id === selectedId}
              className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm hover:bg-accent ${
                canvas.id === selectedId ? 'bg-accent font-medium' : ''
              }`}
              onClick={() => onSelect(canvas.id)}
            >
              <span className="truncate">{canvas.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 opacity-0 hover:opacity-100 group-hover:opacity-100 [li:hover_&]:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(canvas.id);
                }}
                aria-label={`${canvas.name} を削除`}
              >
                <span className="text-xs text-destructive">×</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
