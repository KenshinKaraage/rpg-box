'use client';
import { useCallback, useRef, useState } from 'react';
import { useStore } from '@/stores';
import type { TileCell } from '@/stores/mapEditorSlice';
import { screenToTile } from '../utils/coordTransform';
import { TILE_SIZE } from '../utils/constants';

export interface DragRect {
  start: TileCell;
  end: TileCell;
}

export function cellsInRect(start: TileCell, end: TileCell): TileCell[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const cells: TileCell[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      cells.push({ x, y });
    }
  }
  return cells;
}

export function mergeCells(base: TileCell[], added: TileCell[]): TileCell[] {
  const merged = new Map<string, TileCell>();
  for (const c of base) merged.set(`${c.x},${c.y}`, c);
  for (const c of added) merged.set(`${c.x},${c.y}`, c);
  return Array.from(merged.values());
}

export function useMultiTileSelect(mapId: string, layerId: string) {
  const viewport = useStore((s) => s.viewport);
  const maps = useStore((s) => s.maps);
  const tileSelection = useStore((s) => s.tileSelection);
  const setTileSelection = useStore((s) => s.setTileSelection);

  // 矩形選択の開始タイル座標（mousedown 時に記録）
  const startRef = useRef<TileCell | null>(null);
  const shiftRef = useRef(false);
  // ドラッグ中のライブプレビュー（ChipPalette の liveDrag と同じ仕組み）
  const [liveRect, setLiveRect] = useState<DragRect | null>(null);

  const clampToMap = useCallback(
    (tx: number, ty: number): TileCell | null => {
      const map = maps.find((m) => m.id === mapId);
      if (!map) return null;
      return {
        x: Math.min(Math.max(tx, 0), map.width - 1),
        y: Math.min(Math.max(ty, 0), map.height - 1),
      };
    },
    [maps, mapId]
  );

  const handleMouseDown = useCallback(
    (screenX: number, screenY: number, shiftKey: boolean) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;
      if (!startRef.current) {
        startRef.current = { x: tx, y: ty };
        shiftRef.current = shiftKey;
        setLiveRect({ start: { x: tx, y: ty }, end: { x: tx, y: ty } });
      }
    },
    [viewport, maps, mapId]
  );

  // ドラッグ中: ライブプレビューの終点を更新する
  const handleMouseMove = useCallback(
    (screenX: number, screenY: number) => {
      const start = startRef.current;
      if (!start) return;
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const end = clampToMap(tx, ty);
      if (!end) return;
      setLiveRect({ start, end });
    },
    [viewport, clampToMap]
  );

  // mouseup 時に矩形範囲を確定する（Shift 押下時は既存選択に追加）
  const commitSelection = useCallback(
    (screenX: number, screenY: number) => {
      const start = startRef.current;
      startRef.current = null;
      setLiveRect(null);
      if (!start) return;

      const map = maps.find((m) => m.id === mapId);
      if (!map) return;

      const { tx: endTx, ty: endTy } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const end: TileCell = {
        x: Math.min(Math.max(endTx, 0), map.width - 1),
        y: Math.min(Math.max(endTy, 0), map.height - 1),
      };

      const cells = cellsInRect(start, end);
      const base =
        shiftRef.current && tileSelection?.layerId === layerId ? tileSelection.cells : [];
      setTileSelection({ layerId, cells: mergeCells(base, cells) });
    },
    [viewport, maps, mapId, layerId, tileSelection, setTileSelection]
  );

  const clearSelection = useCallback(() => setTileSelection(null), [setTileSelection]);

  return { handleMouseDown, handleMouseMove, commitSelection, clearSelection, liveRect };
}
