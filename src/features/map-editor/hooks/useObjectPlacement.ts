'use client';

import { useCallback, useRef, useState } from 'react';
import { useStore } from '@/stores';
import { EMPTY_OBJECT_PREFAB_ID } from '@/stores/mapEditorSlice';
import type { TileCell } from '@/stores/mapEditorSlice';
import { screenToTile } from '../utils/coordTransform';
import { TILE_SIZE } from '../utils/constants';
import { generateId } from '@/lib/utils';
import { TransformComponent } from '@/types/components/TransformComponent';
import { cellsInRect, type DragRect } from './useMultiTileSelect';
import type { GameMap, MapObject } from '@/types/map';

/**
 * オブジェクト配置・選択・移動・削除を処理するフック。
 * useTilePainting と同じパターンでマウスイベントを受け取る。
 */
export function useObjectPlacement(mapId: string, layerId: string) {
  const currentTool = useStore((s) => s.currentTool);
  const viewport = useStore((s) => s.viewport);
  const maps = useStore((s) => s.maps);
  const prefabs = useStore((s) => s.prefabs);
  const placementPrefabId = useStore((s) => s.selectedPrefabId);
  const addObject = useStore((s) => s.addObject);
  const updateObject = useStore((s) => s.updateObject);
  const deleteObject = useStore((s) => s.deleteObject);
  const selectObject = useStore((s) => s.selectObject);
  const selectObjects = useStore((s) => s.selectObjects);
  const selectedObjectId = useStore((s) => s.selectedObjectId);
  const selectedObjectIds = useStore((s) => s.selectedObjectIds);
  const pushUndoState = useStore((s) => s.pushUndoState);

  // ドラッグ中の状態（Undo用にドラッグ開始時点の maps 参照を保持）
  const dragRef = useRef<{
    objectId: string;
    startGridX: number;
    startGridY: number;
    startMaps: GameMap[];
  } | null>(null);

  // 矩形選択ドラッグの状態（空マスから開始した場合のみ）
  const rectSelectRef = useRef<TileCell | null>(null);
  const rectShiftRef = useRef(false);
  // ドラッグ中のライブプレビュー（useMultiTileSelect の liveRect と同じ仕組み）
  const [liveRect, setLiveRect] = useState<DragRect | null>(null);

  const getLayer = useCallback(() => {
    const map = maps.find((m) => m.id === mapId);
    return map?.layers.find((l) => l.id === layerId) ?? null;
  }, [maps, mapId, layerId]);

  /** タイル座標にあるオブジェクトを検索 */
  const getObjectAtTile = useCallback(
    (tx: number, ty: number): MapObject | null => {
      const layer = getLayer();
      if (!layer?.objects) return null;
      return (
        layer.objects.find((obj) => {
          const transform = obj.components.find((c) => c.type === 'transform');
          if (!transform) return false;
          const t = transform as TransformComponent;
          return t.x === tx && t.y === ty;
        }) ?? null
      );
    },
    [getLayer]
  );

  /** mousedown: ツールに応じた操作
   * - 消しゴム: そのタイルのオブジェクトを削除
   * - ペン: 空なら配置、既存なら選択
   * - 選択: 選択 + ドラッグ開始
   */
  const handleMouseDown = useCallback(
    (screenX: number, screenY: number, shiftKey = false) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      switch (currentTool) {
        case 'select': {
          const obj = getObjectAtTile(tx, ty);
          if (obj) {
            if (shiftKey) {
              // Shiftクリック: 選択への追加/除外をトグル
              const already = selectedObjectIds.includes(obj.id);
              selectObjects(
                already
                  ? selectedObjectIds.filter((id) => id !== obj.id)
                  : [...selectedObjectIds, obj.id]
              );
            } else {
              // 通常クリック: 複数選択中でも単独選択に切り替える
              // （複数選択をまとめて移動する機能は未実装のため、ドラッグ移動は常に単独選択で行う）
              selectObject(obj.id);
            }
            dragRef.current = { objectId: obj.id, startGridX: tx, startGridY: ty, startMaps: maps };
          } else {
            // 空マス: 矩形選択ドラッグを開始（mouseup で範囲内のオブジェクトをまとめて選択）
            rectSelectRef.current = { x: tx, y: ty };
            rectShiftRef.current = shiftKey;
            setLiveRect({ start: { x: tx, y: ty }, end: { x: tx, y: ty } });
            dragRef.current = null;
          }
          break;
        }
        case 'eraser': {
          const obj = getObjectAtTile(tx, ty);
          if (obj) {
            pushUndoState('map', { maps });
            deleteObject(mapId, layerId, obj.id);
            if (selectedObjectId === obj.id) selectObject(null);
          }
          break;
        }
        case 'pen': {
          const existingObj = getObjectAtTile(tx, ty);
          if (existingObj) {
            selectObject(existingObj.id);
            break;
          }
          const prefabId = placementPrefabId || EMPTY_OBJECT_PREFAB_ID;
          const isEmpty = prefabId === EMPTY_OBJECT_PREFAB_ID;
          const layer = getLayer();
          const existingIds = layer?.objects?.map((o) => o.id) ?? [];
          const transform = new TransformComponent();
          transform.x = tx;
          transform.y = ty;
          const newObj: MapObject = {
            id: generateId('obj', existingIds),
            name: 'オブジェクト',
            prefabId: isEmpty ? undefined : prefabId,
            components: [transform],
          };
          pushUndoState('map', { maps });
          addObject(mapId, layerId, newObj);
          selectObject(newObj.id);
          break;
        }
      }
    },
    [
      viewport,
      maps,
      mapId,
      layerId,
      placementPrefabId,
      currentTool,
      getLayer,
      getObjectAtTile,
      addObject,
      deleteObject,
      pushUndoState,
      selectObject,
      selectObjects,
      selectedObjectId,
      selectedObjectIds,
    ]
  );

  /** mousemove: 矩形選択ドラッグ中はライブプレビューを更新、オブジェクトドラッグ中は移動 */
  const handleMouseMove = useCallback(
    (screenX: number, screenY: number) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;

      if (rectSelectRef.current) {
        const end: TileCell = {
          x: Math.min(Math.max(tx, 0), map.width - 1),
          y: Math.min(Math.max(ty, 0), map.height - 1),
        };
        setLiveRect({ start: rectSelectRef.current, end });
        return;
      }

      if (!dragRef.current) return;
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      const layer = getLayer();
      if (!layer?.objects) return;

      const obj = layer.objects.find((o) => o.id === dragRef.current!.objectId);
      if (!obj) return;

      // 移動先に別のオブジェクトがあればブロック
      const occupant = getObjectAtTile(tx, ty);
      if (occupant && occupant.id !== obj.id) return;

      // Transform の x, y を更新
      const newComponents = obj.components.map((c) => {
        if (c.type === 'transform') {
          const t = c.clone() as TransformComponent;
          t.x = tx;
          t.y = ty;
          return t;
        }
        return c;
      });

      updateObject(mapId, layerId, obj.id, { components: newComponents });
    },
    [viewport, maps, mapId, layerId, getLayer, getObjectAtTile, updateObject]
  );

  /** mouseup: 矩形選択ドラッグなら範囲内のオブジェクトを確定選択、オブジェクトドラッグなら位置が変わっていればUndoに記録 */
  const handleMouseUp = useCallback(() => {
    const rectStart = rectSelectRef.current;
    if (rectStart) {
      rectSelectRef.current = null;
      const rectEnd = liveRect?.end ?? rectStart;
      setLiveRect(null);

      const layer = getLayer();
      const cellSet = new Set(cellsInRect(rectStart, rectEnd).map((c) => `${c.x},${c.y}`));
      const hitIds = (layer?.objects ?? [])
        .filter((o) => {
          const t = o.components.find((c) => c.type === 'transform') as
            | TransformComponent
            | undefined;
          return t && cellSet.has(`${t.x},${t.y}`);
        })
        .map((o) => o.id);

      if (rectShiftRef.current) {
        selectObjects(Array.from(new Set([...selectedObjectIds, ...hitIds])));
      } else {
        selectObjects(hitIds);
      }
      return;
    }

    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    const layer = getLayer();
    const obj = layer?.objects?.find((o) => o.id === drag.objectId);
    if (!obj) return;
    const transform = obj.components.find((c) => c.type === 'transform') as
      | TransformComponent
      | undefined;
    if (!transform) return;
    if (transform.x === drag.startGridX && transform.y === drag.startGridY) return; // 移動していなければ記録しない

    pushUndoState('map', { maps: drag.startMaps });
  }, [getLayer, pushUndoState, liveRect, selectObjects, selectedObjectIds]);

  /** 選択中のオブジェクトを削除 */
  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const layer = getLayer();
    const obj = layer?.objects?.find((o) => o.id === selectedObjectId);
    if (!obj) return;

    pushUndoState('map', { maps });
    deleteObject(mapId, layerId, selectedObjectId);
    selectObject(null);
  }, [selectedObjectId, mapId, layerId, maps, getLayer, deleteObject, pushUndoState, selectObject]);

  /** D&D ドロップ: プレハブをタイルに配置 */
  const handleDropPrefab = useCallback(
    (screenX: number, screenY: number, prefabId: string) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      // 既にオブジェクトがある場合はブロック
      if (getObjectAtTile(tx, ty)) return;

      const prefab = prefabs.find((p) => p.id === prefabId);
      const layer = getLayer();
      const existingIds = layer?.objects?.map((o) => o.id) ?? [];
      const transform = new TransformComponent();
      transform.x = tx;
      transform.y = ty;
      // プレハブのコンポーネントをコピー + Transform を追加
      const prefabComponents = prefab?.prefab.components.map((c) => c.clone()) ?? [];
      const newObj: MapObject = {
        id: generateId('obj', existingIds),
        name: prefab?.name ?? 'オブジェクト',
        prefabId: prefabId,
        components: [transform, ...prefabComponents],
      };
      pushUndoState('map', { maps });
      addObject(mapId, layerId, newObj);
      selectObject(newObj.id);
    },
    [
      viewport,
      maps,
      mapId,
      layerId,
      prefabs,
      getLayer,
      getObjectAtTile,
      addObject,
      pushUndoState,
      selectObject,
    ]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDropPrefab,
    deleteSelectedObject,
    getObjectAtTile,
    /** 矩形選択ドラッグ中のライブプレビュー（useMultiTileSelect の liveRect と同じ形） */
    liveRect,
  };
}
