'use client';
import { useCallback } from 'react';
import { useStore } from '@/stores';
import type { MapEditTool } from '@/stores/mapEditorSlice';
import { screenToTile } from '../utils/coordTransform';
import { floodFill } from '../utils/tileFill';
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
  const setTile = useStore((s) => s.setTile);
  const pushUndo = useStore((s) => s.pushUndo);

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

      const targets = getTilesToPaint(currentTool, { tx, ty }, null, selectedChipId);
      targets.forEach(({ x, y, chipId }) => {
        const prev = layer.tiles?.[y]?.[x] ?? '';
        console.log('[useTilePainting] setTile', { x, y, chipId, prev });
        setTile(mapId, layerId, x, y, chipId);
        pushUndo({ type: 'setTile', mapId, layerId, x, y, prev, next: chipId });
      });
    },
    [currentTool, selectedChipId, viewport, maps, mapId, layerId, setTile, pushUndo]
  );

  return { paint };
}
