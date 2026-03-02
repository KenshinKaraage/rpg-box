'use client';

import { useMemo } from 'react';
import { worldToScreen } from '../hooks/useUISelection';
import { resolveAllTransforms } from '../renderer/transformResolver';
import type { UIEditorViewport, EditorUIObject } from '@/stores/uiEditorSlice';

interface SelectionOverlayProps {
  objects: EditorUIObject[];
  selectedObjectIds: string[];
  viewport: UIEditorViewport;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * 選択オブジェクトのハイライト矩形をDOMオーバーレイで描画
 */
export function SelectionOverlay({
  objects,
  selectedObjectIds,
  viewport,
  canvasWidth,
  canvasHeight,
}: SelectionOverlayProps) {
  const rects = useMemo(() => {
    if (selectedObjectIds.length === 0 || objects.length === 0) return [];

    const worldRects = resolveAllTransforms(objects, canvasWidth, canvasHeight);

    return selectedObjectIds
      .map((id) => {
        const rect = worldRects.get(id);
        if (!rect) return null;

        const w = rect.w * rect.scaleX;
        const h = rect.h * rect.scaleY;
        const topLeft = worldToScreen(rect.x - w * rect.pivotX, rect.y - h * rect.pivotY, viewport);
        const screenW = w * viewport.zoom;
        const screenH = h * viewport.zoom;

        return { id, x: topLeft.x, y: topLeft.y, w: screenW, h: screenH, rotation: rect.rotation };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [objects, selectedObjectIds, viewport, canvasWidth, canvasHeight]);

  if (rects.length === 0) return null;

  return (
    <>
      {rects.map((rect) => (
        <div
          key={rect.id}
          data-testid={`selection-rect-${rect.id}`}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            border: '2px solid #3b82f6',
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.w}px`,
            height: `${rect.h}px`,
            transform: rect.rotation !== 0 ? `rotate(${rect.rotation}deg)` : undefined,
            transformOrigin: 'center center',
          }}
        />
      ))}
    </>
  );
}
