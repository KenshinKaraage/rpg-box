'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
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
 * 簡易 AABB ヒットテスト
 * オブジェクトの transform.x/y/width/height で矩形判定する。
 * 子オブジェクトは親の位置を累積する必要があるため、
 * フラットリストから累積位置を計算する。
 */
export function hitTest(
  objects: EditorUIObject[],
  worldX: number,
  worldY: number
): string | null {
  // 前面（配列の後ろ）から判定する（描画順: 後ろが前面）
  // まず各オブジェクトの累積位置を計算
  const positions = computeAbsolutePositions(objects);

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]!;
    const pos = positions.get(obj.id);
    if (!pos) continue;

    const { absX, absY } = pos;
    const w = obj.transform.width * obj.transform.scaleX;
    const h = obj.transform.height * obj.transform.scaleY;
    const rotation = obj.transform.rotation;

    // クリック座標をオブジェクトのローカル座標系に逆回転して AABB 判定
    let localX = worldX - absX;
    let localY = worldY - absY;
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
      localX >= -w / 2 &&
      localX <= w / 2 &&
      localY >= -h / 2 &&
      localY <= h / 2
    ) {
      return obj.id;
    }
  }

  return null;
}

/**
 * 各オブジェクトの絶対位置（親の位置を累積）を計算
 */
export function computeAbsolutePositions(
  objects: EditorUIObject[]
): Map<string, { absX: number; absY: number }> {
  const result = new Map<string, { absX: number; absY: number }>();
  const objMap = new Map(objects.map((o) => [o.id, o]));

  function resolve(id: string): { absX: number; absY: number } {
    const cached = result.get(id);
    if (cached) return cached;

    const obj = objMap.get(id);
    if (!obj) return { absX: 0, absY: 0 };

    let absX = obj.transform.x;
    let absY = obj.transform.y;

    if (obj.parentId) {
      const parent = resolve(obj.parentId);
      absX += parent.absX;
      absY += parent.absY;
    }

    const pos = { absX, absY };
    result.set(id, pos);
    return pos;
  }

  for (const obj of objects) {
    resolve(obj.id);
  }

  return result;
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

  const selectedCanvas = uiCanvases.find((c) => c.id === selectedCanvasId) ?? null;

  const handleCanvasClick = useCallback(
    (e: MouseEvent, canvasRect: DOMRect) => {
      if (!selectedCanvas) return;

      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;
      const { x: worldX, y: worldY } = screenToWorld(screenX, screenY, viewport);

      const hitId = hitTest(selectedCanvas.objects, worldX, worldY);

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
    [selectedCanvas, viewport, selectedObjectIds, selectUIObjects]
  );

  return {
    handleCanvasClick,
    viewport,
    selectedObjectIds,
    objects: selectedCanvas?.objects ?? [],
  };
}
