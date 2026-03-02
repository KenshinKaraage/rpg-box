'use client';
import { useCallback, useRef } from 'react';
import { useStore } from '@/stores';
import type { UIEditorViewport } from '@/stores/uiEditorSlice';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.1;

/**
 * ズーム適用（カーソル位置をピボットとして拡縮）
 */
export function applyZoom(
  v: UIEditorViewport,
  delta: number,
  pivotX: number,
  pivotY: number
): UIEditorViewport {
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom + delta * ZOOM_STEP));
  const scale = newZoom / v.zoom;
  return {
    x: (v.x + pivotX) * scale - pivotX,
    y: (v.y + pivotY) * scale - pivotY,
    zoom: newZoom,
  };
}

/**
 * UIエディタ用ビューポート操作フック
 *
 * - ホイール: ズーム（カーソル位置ピボット）
 * - ミドルクリック / Space+左クリック: パン
 */
export function useUIViewport(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const viewport = useStore((s) => s.uiEditorViewport);
  const setViewport = useStore((s) => s.setUIEditorViewport);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pivotX = e.clientX - rect.left;
      const pivotY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -1 : 1;
      setViewport(applyZoom(viewport, delta, pivotX, pivotY));
    },
    [viewport, setViewport, canvasRef]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.getModifierState('Space'))) {
        isPanning.current = true;
        panStart.current = { x: e.clientX + viewport.x, y: e.clientY + viewport.y };
      }
    },
    [viewport]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning.current) return;
      setViewport({
        x: panStart.current.x - e.clientX,
        y: panStart.current.y - e.clientY,
      });
    },
    [setViewport]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  return { viewport, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp };
}
