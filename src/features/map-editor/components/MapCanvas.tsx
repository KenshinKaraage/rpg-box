'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/stores';
import { useMapCanvas } from '../hooks/useMapCanvas';
import { useMapViewport } from '../hooks/useMapViewport';
import { useTilePainting } from '../hooks/useTilePainting';
import { useObjectPlacement } from '../hooks/useObjectPlacement';
import { screenToTile } from '../utils/coordTransform';
import { TILE_SIZE } from '../utils/constants';
import { EventEditorModal } from '@/features/event-editor/components/EventEditorModal';
import { generateId } from '@/lib/utils';
import type { EditableAction } from '@/types/ui/actions/UIAction';
import type { MapObject, Prefab } from '@/types/map';
import { TransformComponent } from '@/types/components/TransformComponent';

interface MapCanvasProps {
  mapId: string;
}

export function MapCanvas({ mapId }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maps = useStore((s) => s.maps);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const updateObject = useStore((s) => s.updateObject);
  const deleteObject = useStore((s) => s.deleteObject);
  const addPrefab = useStore((s) => s.addPrefab);
  const prefabs = useStore((s) => s.prefabs);
  const viewport = useStore((s) => s.viewport);
  const map = maps.find((m) => m.id === mapId);
  const selectedLayer = map?.layers.find((l) => l.id === selectedLayerId) ?? null;
  const isObjectLayer = selectedLayer?.type === 'object';

  // イベントモーダル state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalObject, setEventModalObject] = useState<MapObject | null>(null);

  // コンテキストメニュー state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; object: MapObject } | null>(null);

  useMapCanvas(canvasRef, mapId);

  const { handleWheel, handleMouseDown, handleMouseMove, handleMouseUp } = useMapViewport(
    canvasRef,
    map?.width ?? 20,
    map?.height ?? 15,
    TILE_SIZE
  );

  const { paint, commitRect } = useTilePainting(mapId, selectedLayerId ?? '');
  const objPlacement = useObjectPlacement(mapId, selectedLayerId ?? '');

  // ホイールイベントは passive:false で登録する必要があるため useEffect で直接アタッチ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);


  // ダブルクリック: オブジェクトのイベントモーダルを開く
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isObjectLayer || !selectedLayerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { tx, ty } = screenToTile(sx, sy, viewport, TILE_SIZE);
    const obj = objPlacement.getObjectAtTile(tx, ty);
    if (!obj) return;
    // ドラッグをキャンセル
    objPlacement.handleMouseUp();
    setEventModalObject(obj);
    setEventModalOpen(true);
  }, [isObjectLayer, selectedLayerId, viewport, objPlacement]);

  // イベントモーダル保存
  const handleEventSave = useCallback((triggerIndex: number, actions: EditableAction[]) => {
    if (!eventModalObject || !selectedLayerId) return;
    const newComponents = [...eventModalObject.components];
    const comp = newComponents[triggerIndex];
    if (!comp) return;
    const cloned = comp.clone();
    (cloned as unknown as { actions: EditableAction[] }).actions = actions;
    newComponents[triggerIndex] = cloned;
    updateObject(mapId, selectedLayerId, eventModalObject.id, { components: newComponents });
  }, [eventModalObject, selectedLayerId, mapId, updateObject]);

  // 右クリック → コンテキストメニュー
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isObjectLayer || !selectedLayerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { tx, ty } = screenToTile(sx, sy, viewport, TILE_SIZE);
    const objects = selectedLayer?.objects ?? [];
    const obj = objects.find((o) => {
      const t = o.components.find((c) => c.type === 'transform');
      return t && (t as TransformComponent).x === tx && (t as TransformComponent).y === ty;
    });
    if (obj) {
      setContextMenu({ x: e.clientX, y: e.clientY, object: obj });
    } else {
      setContextMenu(null);
    }
  };

  const handleRegisterAsPrefab = () => {
    if (!contextMenu) return;
    const obj = contextMenu.object;
    // Transform 以外のコンポーネントをコピー
    const components = obj.components
      .filter((c) => c.type !== 'transform')
      .map((c) => c.clone());
    const id = generateId('prefab', prefabs.map((p) => p.id));
    const newPrefab: Prefab = {
      id,
      name: obj.name,
      prefab: { components },
    };
    addPrefab(newPrefab);
    setContextMenu(null);
  };

  const handleDeleteFromContext = () => {
    if (!contextMenu || !selectedLayerId) return;
    deleteObject(mapId, selectedLayerId, contextMenu.object.id);
    setContextMenu(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseDown(e.nativeEvent);
    if (e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (isObjectLayer) {
        objPlacement.handleMouseDown(sx, sy);
      } else {
        paint(sx, sy);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseMove(e.nativeEvent);
    if (e.buttons & 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (isObjectLayer) {
        objPlacement.handleMouseMove(sx, sy);
      } else {
        paint(sx, sy);
      }
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        data-testid="map-canvas"
        className="block h-full w-full"
        onMouseDown={(e) => {
          setContextMenu(null);
          handleCanvasMouseDown(e);
        }}
        onMouseMove={handleCanvasMouseMove}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseUp={(e) => {
          handleMouseUp();
          if (isObjectLayer) {
            objPlacement.handleMouseUp();
          } else {
            const domRect = e.currentTarget.getBoundingClientRect();
            commitRect(e.clientX - domRect.left, e.clientY - domRect.top);
          }
        }}
      />
      {/* コンテキストメニュー */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-40 rounded-md border bg-popover p-1 shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={handleRegisterAsPrefab}
          >
            プレハブとして登録
          </button>
          <button
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            onClick={handleDeleteFromContext}
          >
            削除
          </button>
        </div>
      )}
      {eventModalObject && (
        <EventEditorModal
          key={eventModalObject.id}
          open={eventModalOpen}
          onOpenChange={(open) => {
            setEventModalOpen(open);
            if (!open) setEventModalObject(null);
          }}
          object={eventModalObject}
          onSave={handleEventSave}
        />
      )}
    </>
  );
}
