'use client';
import { useEffect } from 'react';
import type { MapEditTool } from '@/stores/mapEditorSlice';

interface Handlers {
  onSetTool: (tool: MapEditTool) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function useMapShortcuts({ onSetTool, onUndo, onRedo }: Handlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'b') {
        onSetTool('pen');
        return;
      }
      if (key === 'e') {
        onSetTool('eraser');
        return;
      }
      if (key === 'g') {
        onSetTool('fill');
        return;
      }
      if (key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }
      if (
        (key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        (key === 'y' && (e.ctrlKey || e.metaKey))
      ) {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSetTool, onUndo, onRedo]);
}
