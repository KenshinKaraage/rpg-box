'use client';

import { useCallback, useRef } from 'react';
import { useStore } from '@/stores';
import { EMPTY_OBJECT_PREFAB_ID } from '@/stores/mapEditorSlice';
import { screenToTile } from '../utils/coordTransform';
import { TILE_SIZE } from '../utils/constants';
import { generateId } from '@/lib/utils';
import { TransformComponent } from '@/types/components/TransformComponent';
import type { MapObject } from '@/types/map';
import type { Component } from '@/types/components/Component';

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

  /** mousedown: 配置 or 選択+ドラッグ開始 */
  const handleMouseDown = useCallback(
    (screenX: number, screenY: number) => {
      const { tx, ty } = screenToTile(screenX, screenY, viewport, TILE_SIZE);
      const map = maps.find((m) => m.id === mapId);
      if (!map) return;
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) return;

      // 配置モード: プレハブが選択されている場合
      if (placementPrefabId) {
        // 同じ位置にオブジェクトが既にある場合は選択のみ
        const existingObj = getObjectAtTile(tx, ty);
        if (existingObj) {
          selectObject(existingObj.id);
          return;
        }

        const isEmpty = placementPrefabId === EMPTY_OBJECT_PREFAB_ID;
        const layer = getLayer();
        const existingIds = layer?.objects?.map((o) => o.id) ?? [];

        const transform = new TransformComponent();
        transform.x = tx;
        transform.y = ty;

        const components: Component[] = [transform];

        const newObj: MapObject = {
          id: generateId('obj', existingIds),
          name: isEmpty ? 'オブジェクト' : 'オブジェクト',
          prefabId: isEmpty ? undefined : placementPrefabId,
          components,
        };

        console.log('[ObjectPlacement] placing object:', { newObj, mapId, layerId });
        addObject(mapId, layerId, newObj);
        pushUndo({ type: 'addObject', mapId, layerId, object: newObj });
        selectObject(newObj.id);
        console.log('[ObjectPlacement] object placed and selected:', newObj.id);
        return;
      }

      // selectツール: オブジェクト選択 + ドラッグ開始
      if (currentTool === 'select') {
        const obj = getObjectAtTile(tx, ty);
        if (obj) {
          selectObject(obj.id);
          dragRef.current = {
            objectId: obj.id,
            startGridX: tx,
            startGridY: ty,
          };
        } else {
          selectObject(null);
          dragRef.current = null;
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

  /** keydown: Delete で選択中オブジェクト削除 */
  const handleKeyDown = useCallback(
    (key: string) => {
      if (key === 'Delete' || key === 'Backspace') {
        if (!selectedObjectId) return;
        const layer = getLayer();
        const obj = layer?.objects?.find((o) => o.id === selectedObjectId);
        if (!obj) return;

        deleteObject(mapId, layerId, selectedObjectId);
        pushUndo({ type: 'deleteObject', mapId, layerId, object: obj });
        selectObject(null);
      }
    },
    [selectedObjectId, mapId, layerId, getLayer, deleteObject, pushUndo, selectObject]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    getObjectAtTile,
  };
}
