'use client';
import { useCallback, useRef, useState } from 'react';
import { useStore } from '@/stores';
import type { MapEditTool } from '@/stores/mapEditorSlice';
import type { ChipRangeSelection } from '@/types/map';
import { screenToTile } from '../utils/coordTransform';
import { floodFill } from '../utils/tileFill';
import { TILE_SIZE } from '../utils/constants';
import type { DragRect } from './useMultiTileSelect';

export interface TilePaintTarget {
  x: number;
  y: number;
  chipId: string;
}

export function getTilesToPaint(
  tool: MapEditTool,
  tilePos: { tx: number; ty: number },
  _rectStart: { tx: number; ty: number } | null,
  selectedChipId: string | null,
  selectedChipRange?: ChipRangeSelection | null
): TilePaintTarget[] {
  if (tool === 'pen') {
    if (selectedChipRange) {
      const targets: TilePaintTarget[] = [];
      for (let row = 0; row < selectedChipRange.height; row++) {
        for (let col = 0; col < selectedChipRange.width; col++) {
          const chipId = selectedChipRange.cells[row * selectedChipRange.width + col];
          if (!chipId) continue;
          targets.push({ x: tilePos.tx + col, y: tilePos.ty + row, chipId });
        }
      }
      return targets;
    }
    if (!selectedChipId) return [];
    return [{ x: tilePos.tx, y: tilePos.ty, chipId: selectedChipId }];
  }
  if (tool === 'eraser') {
    return [{ x: tilePos.tx, y: tilePos.ty, chipId: '' }];
  }
  return [];
}

/** 既存タイルと比べて実際にチップが変わるものだけに絞る（同じタイルを再度なぞっても何もしない） */
export function filterChangedTargets(
  tiles: string[][] | undefined,
  targets: TilePaintTarget[]
): TilePaintTarget[] {
  return targets.filter((t) => (tiles?.[t.y]?.[t.x] ?? '') !== t.chipId);
}

export function useTilePainting(mapId: string, layerId: string) {
  const currentTool = useStore((s) => s.currentTool);
  const selectedChipId = useStore((s) => s.selectedChipId);
  const selectedChipRange = useStore((s) => s.selectedChipRange);
  const viewport = useStore((s) => s.viewport);
  const maps = useStore((s) => s.maps);
  const setTile = useStore((s) => s.setTile);
  const pushUndoState = useStore((s) => s.pushUndoState);

  // 矩形選択の開始タイル座標（mousedown 時に記録）
  const rectStartRef = useRef<{ tx: number; ty: number } | null>(null);
  // 矩形塗りつぶしのライブプレビュー（useMultiTileSelect の liveRect と同じ仕組み）
  const [liveRect, setLiveRect] = useState<DragRect | null>(null);
  // ペン/消しゴムの一筆（mousedown〜mouseup）で Undo をすでに1回積んだか
  const strokeActiveRef = useRef(false);

  const paint = useCallback(
    (screenX: number, screenY: number) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      const layer = map?.layers.find((l) => l.id === layerId);
      if (!map || !layer) {
        return;
      }
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      if (currentTool === 'fill') {
        if (!selectedChipId) return;
        // tiles が未初期化の場合は空グリッドとして扱う
        const tiles = layer.tiles ?? [];
        const changes = floodFill(tiles, tx, ty, selectedChipId, map.width, map.height);
        if (changes.length === 0) return;
        pushUndoState('map', { maps });
        changes.forEach((c) => setTile(mapId, layerId, c.x, c.y, c.next));
        return;
      }

      // 矩形選択: mousedown で開始位置を記録し、ドラッグ中はライブプレビューの終点を更新（適用は commitRect で行う）
      if (currentTool === 'rect') {
        if (!rectStartRef.current) {
          rectStartRef.current = { tx, ty };
        }
        setLiveRect({
          start: { x: rectStartRef.current.tx, y: rectStartRef.current.ty },
          end: { x: tx, y: ty },
        });
        return;
      }

      const targets = getTilesToPaint(
        currentTool,
        { tx, ty },
        null,
        selectedChipId,
        selectedChipRange
      ).filter((t) => t.x >= 0 && t.x < map.width && t.y >= 0 && t.y < map.height);
      if (targets.length === 0) return;

      // 実際にチップが変わるセルだけに絞る（同じタイルを再度なぞっても変化なしなら何もしない）
      const changedTargets = filterChangedTargets(layer.tiles, targets);
      if (changedTargets.length === 0) return;

      // ドラッグ中の一筆で Undo が積まれるのは最初の変化があった時の1回だけ
      // （毎 mousemove ごとに積むと1ストロークが100件のUndo上限を食い潰し、Undoが効かないように見える不具合があった）
      if (!strokeActiveRef.current) {
        pushUndoState('map', { maps });
        strokeActiveRef.current = true;
      }
      changedTargets.forEach(({ x, y, chipId }) => {
        setTile(mapId, layerId, x, y, chipId);
      });
    },
    [
      currentTool,
      selectedChipId,
      selectedChipRange,
      viewport,
      maps,
      mapId,
      layerId,
      setTile,
      pushUndoState,
    ]
  );

  // 矩形選択: mouseup 時に矩形範囲の全タイルを一括適用
  const commitRect = useCallback(
    (screenX: number, screenY: number) => {
      const start = rectStartRef.current;
      rectStartRef.current = null;
      setLiveRect(null);

      if (currentTool !== 'rect' || !start || !selectedChipId) return;

      const map = maps.find((m) => m.id === mapId);
      const layer = map?.layers.find((l) => l.id === layerId);
      if (!map || !layer) return;

      const { tx: endTx, ty: endTy } = screenToTile(screenX, screenY, viewport, TILE_SIZE);

      const minX = Math.max(0, Math.min(start.tx, endTx));
      const maxX = Math.min(map.width - 1, Math.max(start.tx, endTx));
      const minY = Math.max(0, Math.min(start.ty, endTy));
      const maxY = Math.min(map.height - 1, Math.max(start.ty, endTy));

      const changes: Array<{ x: number; y: number }> = [];
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          changes.push({ x, y });
        }
      }
      if (changes.length === 0) return;

      pushUndoState('map', { maps });
      changes.forEach(({ x, y }) => setTile(mapId, layerId, x, y, selectedChipId));
    },
    [currentTool, selectedChipId, viewport, maps, mapId, layerId, setTile, pushUndoState]
  );

  /** mouseup 時に呼ぶ: 次のペン/消しゴムの一筆で改めて Undo が1回積まれるようにリセット */
  const endStroke = useCallback(() => {
    strokeActiveRef.current = false;
  }, []);

  return { paint, commitRect, endStroke, liveRect };
}
