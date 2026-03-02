'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
import { resolveAllTransforms } from '../renderer/transformResolver';
import type { UIEditorViewport, EditorUIObject } from '@/stores/uiEditorSlice';

/**
 * スクリーン座標をワールド座標に変換
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: UIEditorViewport
): { x: number; y: number } {
  return {
    x: (screenX + viewport.x) / viewport.zoom,
    y: (screenY + viewport.y) / viewport.zoom,
  };
}

/**
 * ワールド座標をスクリーン座標（Canvas DOM上の位置）に変換
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: UIEditorViewport
): { x: number; y: number } {
  return {
    x: worldX * viewport.zoom - viewport.x,
    y: worldY * viewport.zoom - viewport.y,
  };
}

/**
 * AABB ヒットテスト（resolveAllTransforms でアンカー・回転・スケールを正しく考慮）
 */
export function hitTest(
  objects: EditorUIObject[],
  worldX: number,
  worldY: number,
  canvasWidth: number,
  canvasHeight: number
): string | null {
  const worldRects = resolveAllTransforms(objects, canvasWidth, canvasHeight);

  // 前面（配列の後ろ）から判定する（描画順: 後ろが前面）
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]!;
    const rect = worldRects.get(obj.id);
    if (!rect) continue;

    const w = rect.w * rect.scaleX;
    const h = rect.h * rect.scaleY;
    const rotation = rect.rotation;

    // クリック座標をオブジェクトのローカル座標系に逆回転して AABB 判定
    let localX = worldX - rect.x;
    let localY = worldY - rect.y;
    if (rotation !== 0) {
      const rad = (-rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = localX * cos - localY * sin;
      const ry = localX * sin + localY * cos;
      localX = rx;
      localY = ry;
    }

    if (
      localX >= -w * rect.pivotX &&
      localX <= w * (1 - rect.pivotX) &&
      localY >= -h * rect.pivotY &&
      localY <= h * (1 - rect.pivotY)
    ) {
      return obj.id;
    }
  }

  return null;
}

/**
 * UIエディタの選択操作フック
 *
 * Canvas 上のクリックでオブジェクトを選択する。
 * Shift+クリックで複数選択をトグルする。
 */
export function useUISelection() {
  const viewport = useStore((s) => s.uiEditorViewport);
  const selectedCanvasId = useStore((s) => s.selectedCanvasId);
  const uiCanvases = useStore((s) => s.uiCanvases);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const selectUIObjects = useStore((s) => s.selectUIObjects);
  const resolution = useStore((s) => s.gameSettings.resolution);

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  const handleCanvasClick = useCallback(
    (e: MouseEvent, canvasRect: DOMRect) => {
      if (!selectedCanvas) return;

      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;
      const { x: worldX, y: worldY } = screenToWorld(screenX, screenY, viewport);

      const hitId = hitTest(
        selectedCanvas.objects,
        worldX,
        worldY,
        resolution.width,
        resolution.height
      );

      if (e.shiftKey) {
        // Multi-select toggle
        if (hitId) {
          const newIds = selectedObjectIds.includes(hitId)
            ? selectedObjectIds.filter((id) => id !== hitId)
            : [...selectedObjectIds, hitId];
          selectUIObjects(newIds);
        }
      } else {
        // Single select (or deselect)
        selectUIObjects(hitId ? [hitId] : []);
      }
    },
    [selectedCanvas, viewport, selectedObjectIds, selectUIObjects, resolution]
  );

  return {
    handleCanvasClick,
    viewport,
    selectedObjectIds,
    objects: selectedCanvas?.objects ?? [],
  };
}
