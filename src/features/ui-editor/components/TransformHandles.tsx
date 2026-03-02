'use client';

import { useRef } from 'react';
import {
  worldToScreen,
  screenToWorld,
} from '../hooks/useUISelection';
import { resolveAllTransforms } from '../renderer/transformResolver';
import { useStore } from '@/stores';
import type { UIEditorViewport, EditorUIObject } from '@/stores/uiEditorSlice';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type HandleDirection =
  | 'nw' | 'n' | 'ne'
  | 'w'        | 'e'
  | 'sw' | 's' | 'se';

interface TransformHandlesProps {
  objects: EditorUIObject[];
  selectedObjectIds: string[];
  viewport: UIEditorViewport;
  canvasId: string | null;
  canvasWidth: number;
  canvasHeight: number;
}

const HANDLE_SIZE = 8;
const ROTATE_OFFSET = 24;

const CURSOR_MAP: Record<HandleDirection, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
  w: 'ew-resize',                      e: 'ew-resize',
  sw: 'nesw-resize', s: 'ns-resize', se: 'nwse-resize',
};

// ──────────────────────────────────────────────
// Snap helper
// ──────────────────────────────────────────────

export function snapValue(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

// ──────────────────────────────────────────────
// TransformHandles
// ──────────────────────────────────────────────

export function TransformHandles({
  objects,
  selectedObjectIds,
  viewport,
  canvasId,
  canvasWidth,
  canvasHeight,
}: TransformHandlesProps) {
  const updateUIObject = useStore((s) => s.updateUIObject);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const gridSize = useStore((s) => s.uiGridSize);

  const dragRef = useRef<{
    type: 'move' | 'resize' | 'rotate';
    objectId: string;
    startWorldX: number;
    startWorldY: number;
    startObjX: number;
    startObjY: number;
    startObjW: number;
    startObjH: number;
    startObjRotation: number;
    handle?: HandleDirection;
    centerX: number;
    centerY: number;
  } | null>(null);

  // Use resolveAllTransforms for correct anchor/rotation/scale handling
  const worldRects = resolveAllTransforms(objects, canvasWidth, canvasHeight);

  const selectedObject = selectedObjectIds.length === 1
    ? objects.find((o) => o.id === selectedObjectIds[0])
    : null;
  if (!selectedObject || !canvasId) return null;

  const worldRect = worldRects.get(selectedObject.id);
  if (!worldRect) return null;

  const { x: absX, y: absY } = worldRect;
  const w = selectedObject.transform.width;
  const h = selectedObject.transform.height;
  const rotation = worldRect.rotation;
  const scaledW = worldRect.w * worldRect.scaleX;
  const scaledH = worldRect.h * worldRect.scaleY;

  const pivotX = worldRect.pivotX;
  const pivotY = worldRect.pivotY;
  const topLeft = worldToScreen(absX - scaledW * pivotX, absY - scaledH * pivotY, viewport);
  const screenW = scaledW * viewport.zoom;
  const screenH = scaledH * viewport.zoom;

  // ── Move: drag the body ──
  const startMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const world = screenToWorld(
      e.clientX - (e.currentTarget as HTMLElement).closest('[data-testid="ui-canvas-container"]')!.getBoundingClientRect().left,
      e.clientY - (e.currentTarget as HTMLElement).closest('[data-testid="ui-canvas-container"]')!.getBoundingClientRect().top,
      viewport
    );
    dragRef.current = {
      type: 'move',
      objectId: selectedObject.id,
      startWorldX: world.x,
      startWorldY: world.y,
      startObjX: selectedObject.transform.x,
      startObjY: selectedObject.transform.y,
      startObjW: w,
      startObjH: h,
      startObjRotation: selectedObject.transform.rotation,
      centerX: absX,
      centerY: absY,
    };

    const onMouseMove = (ev: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.type !== 'move') return;
      const container = document.querySelector('[data-testid="ui-canvas-container"]');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const curWorld = screenToWorld(ev.clientX - rect.left, ev.clientY - rect.top, viewport);
      const dx = curWorld.x - drag.startWorldX;
      const dy = curWorld.y - drag.startWorldY;
      const newX = snapValue(drag.startObjX + dx, gridSize, snapToGrid);
      const newY = snapValue(drag.startObjY + dy, gridSize, snapToGrid);
      updateUIObject(canvasId, drag.objectId, {
        transform: { ...selectedObject.transform, x: newX, y: newY },
      });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ── Resize handle ──
  const startResize = (handle: HandleDirection, e: React.MouseEvent) => {
    e.stopPropagation();
    const container = (e.currentTarget as HTMLElement).closest('[data-testid="ui-canvas-container"]');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport);

    dragRef.current = {
      type: 'resize',
      objectId: selectedObject.id,
      startWorldX: world.x,
      startWorldY: world.y,
      startObjX: selectedObject.transform.x,
      startObjY: selectedObject.transform.y,
      startObjW: w,
      startObjH: h,
      startObjRotation: selectedObject.transform.rotation,
      handle,
      centerX: absX,
      centerY: absY,
    };

    const onMouseMove = (ev: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.type !== 'resize' || !drag.handle) return;
      const containerEl = document.querySelector('[data-testid="ui-canvas-container"]');
      if (!containerEl) return;
      const r = containerEl.getBoundingClientRect();
      const curWorld = screenToWorld(ev.clientX - r.left, ev.clientY - r.top, viewport);
      const dx = curWorld.x - drag.startWorldX;
      const dy = curWorld.y - drag.startWorldY;

      let newX = drag.startObjX;
      let newY = drag.startObjY;
      let newW = drag.startObjW;
      let newH = drag.startObjH;

      const h = drag.handle;
      if (h.includes('e')) newW = Math.max(1, drag.startObjW + dx);
      if (h.includes('w')) { newW = Math.max(1, drag.startObjW - dx); newX = drag.startObjX + dx; }
      if (h.includes('s')) newH = Math.max(1, drag.startObjH + dy);
      if (h.includes('n')) { newH = Math.max(1, drag.startObjH - dy); newY = drag.startObjY + dy; }

      newX = snapValue(newX, gridSize, snapToGrid);
      newY = snapValue(newY, gridSize, snapToGrid);
      newW = snapValue(newW, gridSize, snapToGrid) || 1;
      newH = snapValue(newH, gridSize, snapToGrid) || 1;

      updateUIObject(canvasId, drag.objectId, {
        transform: { ...selectedObject.transform, x: newX, y: newY, width: newW, height: newH },
      });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ── Rotate handle ──
  const startRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = (e.currentTarget as HTMLElement).closest('[data-testid="ui-canvas-container"]');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = absX;
    const cy = absY;

    dragRef.current = {
      type: 'rotate',
      objectId: selectedObject.id,
      startWorldX: 0,
      startWorldY: 0,
      startObjX: selectedObject.transform.x,
      startObjY: selectedObject.transform.y,
      startObjW: w,
      startObjH: h,
      startObjRotation: selectedObject.transform.rotation,
      centerX: cx,
      centerY: cy,
    };

    const startWorld = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport);
    const startAngle = Math.atan2(startWorld.y - cy, startWorld.x - cx);

    const onMouseMove = (ev: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.type !== 'rotate') return;
      const containerEl = document.querySelector('[data-testid="ui-canvas-container"]');
      if (!containerEl) return;
      const r = containerEl.getBoundingClientRect();
      const curWorld = screenToWorld(ev.clientX - r.left, ev.clientY - r.top, viewport);
      const curAngle = Math.atan2(curWorld.y - drag.centerY, curWorld.x - drag.centerX);
      const deltaDeg = ((curAngle - startAngle) * 180) / Math.PI;
      let newRot = drag.startObjRotation + deltaDeg;
      if (snapToGrid) {
        newRot = Math.round(newRot / 15) * 15;
      }
      updateUIObject(canvasId, drag.objectId, {
        transform: { ...selectedObject.transform, rotation: newRot },
      });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ── Render ──
  const hs = HANDLE_SIZE;
  const handles: { dir: HandleDirection; x: number; y: number }[] = [
    { dir: 'nw', x: -hs / 2, y: -hs / 2 },
    { dir: 'n', x: screenW / 2 - hs / 2, y: -hs / 2 },
    { dir: 'ne', x: screenW - hs / 2, y: -hs / 2 },
    { dir: 'w', x: -hs / 2, y: screenH / 2 - hs / 2 },
    { dir: 'e', x: screenW - hs / 2, y: screenH / 2 - hs / 2 },
    { dir: 'sw', x: -hs / 2, y: screenH - hs / 2 },
    { dir: 's', x: screenW / 2 - hs / 2, y: screenH - hs / 2 },
    { dir: 'se', x: screenW - hs / 2, y: screenH - hs / 2 },
  ];

  return (
    <div
      data-testid="transform-handles"
      style={{
        position: 'absolute',
        pointerEvents: 'auto',
        left: `${topLeft.x}px`,
        top: `${topLeft.y}px`,
        width: `${screenW}px`,
        height: `${screenH}px`,
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: `${pivotX * 100}% ${pivotY * 100}%`,
      }}
    >
      {/* Move area */}
      <div
        data-testid="move-handle"
        style={{ position: 'absolute', inset: 0, cursor: 'move' }}
        onMouseDown={startMove}
      />

      {/* Resize handles */}
      {handles.map(({ dir, x, y }) => (
        <div
          key={dir}
          data-testid={`resize-handle-${dir}`}
          className="absolute bg-white border border-blue-500"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${hs}px`,
            height: `${hs}px`,
            cursor: CURSOR_MAP[dir],
          }}
          onMouseDown={(e) => startResize(dir, e)}
        />
      ))}

      {/* Rotate handle */}
      <div
        data-testid="rotate-handle"
        className="absolute flex items-center justify-center rounded-full border border-blue-500 bg-white"
        style={{
          left: `${screenW / 2 - hs / 2}px`,
          top: `${-ROTATE_OFFSET}px`,
          width: `${hs}px`,
          height: `${hs}px`,
          cursor: 'grab',
        }}
        onMouseDown={startRotate}
      />

      {/* Line from top-center to rotate handle */}
      <div
        className="absolute border-l border-blue-500"
        style={{
          left: `${screenW / 2}px`,
          top: `${-ROTATE_OFFSET + hs}px`,
          height: `${ROTATE_OFFSET - hs}px`,
        }}
      />

      {/* Pivot crosshair */}
      <div
        data-testid="pivot-crosshair"
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          left: `${screenW * pivotX}px`,
          top: `${screenH * pivotY}px`,
        }}
      >
        {/* Horizontal line */}
        <div
          style={{
            position: 'absolute',
            left: -6,
            top: -1,
            width: 12,
            height: 2,
            backgroundColor: '#3b82f6',
          }}
        />
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: -1,
            top: -6,
            width: 2,
            height: 12,
            backgroundColor: '#3b82f6',
          }}
        />
      </div>
    </div>
  );
}
