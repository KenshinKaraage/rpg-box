'use client';
import { useCallback, useRef } from 'react';
import { useStore } from '@/stores';
import type { Viewport } from '@/stores/mapEditorSlice';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

export function clampViewport(
  v: Viewport,
  canvas: { w: number; h: number },
  map: { w: number; h: number },
  tileSize: number
): Viewport {
  const maxX = Math.max(0, map.w * tileSize * v.zoom - canvas.w);
  const maxY = Math.max(0, map.h * tileSize * v.zoom - canvas.h);
  return {
    x: Math.max(0, Math.min(v.x, maxX)),
    y: Math.max(0, Math.min(v.y, maxY)),
    zoom: v.zoom,
  };
}

export function applyZoom(v: Viewport, delta: number, pivotX: number, pivotY: number): Viewport {
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom + delta * ZOOM_STEP));
  // ズームの中心点をピボットに保つ
  const scale = newZoom / v.zoom;
  return {
    x: pivotX - (pivotX - v.x) * scale,
    y: pivotY - (pivotY - v.y) * scale,
    zoom: newZoom,
  };
}

export function useMapViewport(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mapW: number,
  mapH: number,
  tileSize: number
) {
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);
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
      const newVp = applyZoom(viewport, delta, pivotX, pivotY);
      const clamped = clampViewport(
        newVp,
        { w: canvas.width, h: canvas.height },
        { w: mapW, h: mapH },
        tileSize
      );
      setViewport(clamped);
    },
    [viewport, setViewport, canvasRef, mapW, mapH, tileSize]
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
      const canvas = canvasRef.current;
      if (!canvas) return;
      const newVp = {
        ...viewport,
        x: panStart.current.x - e.clientX,
        y: panStart.current.y - e.clientY,
      };
      const clamped = clampViewport(
        newVp,
        { w: canvas.width, h: canvas.height },
        { w: mapW, h: mapH },
        tileSize
      );
      setViewport(clamped);
    },
    [viewport, setViewport, canvasRef, mapW, mapH, tileSize]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  return { viewport, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp };
}
