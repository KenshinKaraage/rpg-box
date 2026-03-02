'use client';

import { useMemo } from 'react';
import {
  computeAbsolutePositions,
  worldToScreen,
} from '../hooks/useUISelection';
import type { UIEditorViewport, EditorUIObject } from '@/stores/uiEditorSlice';

interface SelectionOverlayProps {
  objects: EditorUIObject[];
  selectedObjectIds: string[];
  viewport: UIEditorViewport;
}

/**
 * 選択オブジェクトのハイライト矩形をDOMオーバーレイで描画
 */
export function SelectionOverlay({
  objects,
  selectedObjectIds,
  viewport,
}: SelectionOverlayProps) {
  const rects = useMemo(() => {
    if (selectedObjectIds.length === 0 || objects.length === 0) return [];

    const positions = computeAbsolutePositions(objects);
    const objMap = new Map(objects.map((o) => [o.id, o]));

    return selectedObjectIds
      .map((id) => {
        const obj = objMap.get(id);
        const pos = positions.get(id);
        if (!obj || !pos) return null;

        // absX/absY はピボット（中心）座標なので左上に変換
        const w = obj.transform.width * obj.transform.scaleX;
        const h = obj.transform.height * obj.transform.scaleY;
        const topLeft = worldToScreen(pos.absX - w / 2, pos.absY - h / 2, viewport);
        const screenW = w * viewport.zoom;
        const screenH = h * viewport.zoom;

        return { id, x: topLeft.x, y: topLeft.y, w: screenW, h: screenH };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [objects, selectedObjectIds, viewport]);

  if (rects.length === 0) return null;

  return (
    <>
      {rects.map((rect) => (
        <div
          key={rect.id}
          data-testid={`selection-rect-${rect.id}`}
          className="pointer-events-none absolute border-2 border-blue-500"
          style={{
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.w}px`,
            height: `${rect.h}px`,
          }}
        />
      ))}
    </>
  );
}
