'use client';

import { useCallback, useRef } from 'react';
import { useStore } from '@/stores';
import { EMPTY_OBJECT_PREFAB_ID } from '@/stores/mapEditorSlice';
import { screenToTile } from '../utils/coordTransform';
import { TILE_SIZE } from '../utils/constants';
import { generateId } from '@/lib/utils';
import { TransformComponent } from '@/types/components/TransformComponent';
import type { MapObject } from '@/types/map';

/**
 * オブジェクト配置・選択・移動・削除を処理するフック。
 * useTilePainting と同じパターンでマウスイベントを受け取る。
 */
export function useObjectPlacement(mapId: string, layerId: string) {
  const currentTool = useStore((s) => s.currentTool);
  const viewport = useStore((s) => s.viewport);
  const maps = useStore((s) => s.maps);
  const placementPrefabId = useStore((s) => s.selectedPrefabId);
  const addObject = useStore((s) => s.addObject);
  const updateObject = useStore((s) => s.updateObject);
  const deleteObject = useStore((s) => s.deleteObject);
  const selectObject = useStore((s) => s.selectObject);
  const selectedObjectId = useStore((s) => s.selectedObjectId);
  const pushUndo = useStore((s) => s.pushUndo);

  // ドラッグ中の状態
  const dragRef = useRef<{
    objectId: string;
    startGridX: number;
    startGridY: number;
  } | null>(null);

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
    (screenX: number, screenY: number) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      switch (currentTool) {
        case 'select': {
          const obj = getObjectAtTile(tx, ty);
          if (obj) {
            selectObject(obj.id);
            dragRef.current = { objectId: obj.id, startGridX: tx, startGridY: ty };
          } else {
            selectObject(null);
            dragRef.current = null;
          }
          break;
        }
        case 'eraser': {
          const obj = getObjectAtTile(tx, ty);
          if (obj) {
            deleteObject(mapId, layerId, obj.id);
            pushUndo({ type: 'deleteObject', mapId, layerId, object: obj });
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
          addObject(mapId, layerId, newObj);
          pushUndo({ type: 'addObject', mapId, layerId, object: newObj });
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
      pushUndo,
      selectObject,
    ]
  );

  /** mousemove: ドラッグ中のオブジェクト移動 */
  const handleMouseMove = useCallback(
    (screenX: number, screenY: number) => {
      if (!dragRef.current) return;

      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
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
    [viewport, maps, mapId, layerId, getLayer, updateObject]
  );

  /** mouseup: ドラッグ終了 */
  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  /** 選択中のオブジェクトを削除 */
  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const layer = getLayer();
    const obj = layer?.objects?.find((o) => o.id === selectedObjectId);
    if (!obj) return;

    deleteObject(mapId, layerId, selectedObjectId);
    pushUndo({ type: 'deleteObject', mapId, layerId, object: obj });
    selectObject(null);
  }, [selectedObjectId, mapId, layerId, getLayer, deleteObject, pushUndo, selectObject]);

  /** D&D ドロップ: プレハブをタイルに配置 */
  const handleDropPrefab = useCallback(
    (screenX: number, screenY: number, prefabId: string) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      // 既にオブジェクトがある場合はブロック
      if (getObjectAtTile(tx, ty)) return;

      const layer = getLayer();
      const existingIds = layer?.objects?.map((o) => o.id) ?? [];
      const transform = new TransformComponent();
      transform.x = tx;
      transform.y = ty;
      const newObj: MapObject = {
        id: generateId('obj', existingIds),
        name: 'オブジェクト',
        prefabId: prefabId,
        components: [transform],
      };
      addObject(mapId, layerId, newObj);
      pushUndo({ type: 'addObject', mapId, layerId, object: newObj });
      selectObject(newObj.id);
    },
    [viewport, maps, mapId, layerId, getLayer, getObjectAtTile, addObject, pushUndo, selectObject]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDropPrefab,
    deleteSelectedObject,
    getObjectAtTile,
  };
}
