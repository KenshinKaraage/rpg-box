'use client';
import { useCallback, useRef } from 'react';
import { useStore } from '@/stores';
import type { MapEditTool } from '@/stores/mapEditorSlice';
import { screenToTile } from '../utils/coordTransform';
import { floodFill } from '../utils/tileFill';
import { calcAutotileChanges } from '../utils/autotile';
import { TILE_SIZE } from '../utils/constants';

export interface TilePaintTarget {
  x: number;
  y: number;
  chipId: string;
}

export function getTilesToPaint(
  tool: MapEditTool,
  tilePos: { tx: number; ty: number },
  _rectStart: { tx: number; ty: number } | null,
  selectedChipId: string | null
): TilePaintTarget[] {
  if (tool === 'pen') {
    if (!selectedChipId) return [];
    return [{ x: tilePos.tx, y: tilePos.ty, chipId: selectedChipId }];
  }
  if (tool === 'eraser') {
    return [{ x: tilePos.tx, y: tilePos.ty, chipId: '' }];
  }
  return [];
}

export function useTilePainting(mapId: string, layerId: string) {
  const currentTool = useStore((s) => s.currentTool);
  const selectedChipId = useStore((s) => s.selectedChipId);
  const viewport = useStore((s) => s.viewport);
  const maps = useStore((s) => s.maps);
  const chipsets = useStore((s) => s.chipsets);
  const setTile = useStore((s) => s.setTile);
  const pushUndo = useStore((s) => s.pushUndo);

  // 矩形選択の開始タイル座標（mousedown 時に記録）
  const rectStartRef = useRef<{ tx: number; ty: number } | null>(null);

  const paint = useCallback(
    (screenX: number, screenY: number) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      console.log('[useTilePainting] paint called', {
        screenX,
        screenY,
        tx,
        ty,
        currentTool,
        selectedChipId,
        layerId,
      });
      const map = maps.find((m) => m.id === mapId);
      const layer = map?.layers.find((l) => l.id === layerId);
      if (!map || !layer) {
        console.warn('[useTilePainting] map or layer not found', { mapId, layerId });
        return;
      }
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      // このレイヤーで使用されているオートタイルチップセットのIDセット
      const autotileChipsetIds = new Set(
        layer.chipsetIds.filter((id) => chipsets.find((c) => c.id === id)?.autotile)
      );

      if (currentTool === 'fill') {
        if (!selectedChipId) return;
        // tiles が未初期化の場合は空グリッドとして扱う
        const tiles = layer.tiles ?? [];
        const changes = floodFill(tiles, tx, ty, selectedChipId, map.width, map.height);
        if (changes.length === 0) return;
        changes.forEach((c) => setTile(mapId, layerId, c.x, c.y, c.next));
        pushUndo({ type: 'setTileRange', mapId, layerId, tiles: changes });
        return;
      }

      // 矩形選択: mousedown で開始位置を記録するだけ（適用は commitRect で行う）
      if (currentTool === 'rect') {
        if (!rectStartRef.current) {
          rectStartRef.current = { tx, ty };
        }
        return;
      }

      // ペン・消しゴム: オートタイルチップセットがあれば自動バリアント計算を使う
      if (autotileChipsetIds.size > 0 && (currentTool === 'pen' || currentTool === 'eraser')) {
        const tiles = layer.tiles ?? [];
        const paintChipsetId =
          currentTool === 'pen' && selectedChipId ? (selectedChipId.split(':')[0] ?? null) : null;
        const changes = calcAutotileChanges(
          tiles,
          tx,
          ty,
          paintChipsetId,
          map.width,
          map.height,
          autotileChipsetIds
        );
        if (changes.length === 0) return;
        changes.forEach(({ x, y, chipId }) => setTile(mapId, layerId, x, y, chipId));
        pushUndo({
          type: 'setTileRange',
          mapId,
          layerId,
          tiles: changes.map(({ x, y, chipId }) => ({
            x,
            y,
            prev: layer.tiles?.[y]?.[x] ?? '',
            next: chipId,
          })),
        });
        return;
      }

      const targets = getTilesToPaint(currentTool, { tx, ty }, null, selectedChipId);
      targets.forEach(({ x, y, chipId }) => {
        const prev = layer.tiles?.[y]?.[x] ?? '';
        console.log('[useTilePainting] setTile', { x, y, chipId, prev });
        setTile(mapId, layerId, x, y, chipId);
        pushUndo({ type: 'setTile', mapId, layerId, x, y, prev, next: chipId });
      });
    },
    [currentTool, selectedChipId, viewport, maps, chipsets, mapId, layerId, setTile, pushUndo]
  );

  // 矩形選択: mouseup 時に矩形範囲の全タイルを一括適用
  const commitRect = useCallback(
    (screenX: number, screenY: number) => {
      const start = rectStartRef.current;
      rectStartRef.current = null;

      if (currentTool !== 'rect' || !start || !selectedChipId) return;

      const map = maps.find((m) => m.id === mapId);
      const layer = map?.layers.find((l) => l.id === layerId);
      if (!map || !layer) return;

      const { tx: endTx, ty: endTy } = screenToTile(screenX, screenY, viewport, TILE_SIZE);

      const minX = Math.max(0, Math.min(start.tx, endTx));
      const maxX = Math.min(map.width - 1, Math.max(start.tx, endTx));
      const minY = Math.max(0, Math.min(start.ty, endTy));
      const maxY = Math.min(map.height - 1, Math.max(start.ty, endTy));

      const changes: Array<{ x: number; y: number; prev: string; next: string }> = [];
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          changes.push({ x, y, prev: layer.tiles?.[y]?.[x] ?? '', next: selectedChipId });
        }
      }
      if (changes.length === 0) return;

      changes.forEach(({ x, y, next }) => setTile(mapId, layerId, x, y, next));
      pushUndo({ type: 'setTileRange', mapId, layerId, tiles: changes });
    },
    [currentTool, selectedChipId, viewport, maps, mapId, layerId, setTile, pushUndo]
  );

  return { paint, commitRect };
}
