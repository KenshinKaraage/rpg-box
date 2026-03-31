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
import type { EditableAction } from '@/types/ui/actions/UIAction';
import type { MapObject } from '@/types/map';

interface MapCanvasProps {
  mapId: string;
}

export function MapCanvas({ mapId }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maps = useStore((s) => s.maps);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const updateObject = useStore((s) => s.updateObject);
  const viewport = useStore((s) => s.viewport);
  const map = maps.find((m) => m.id === mapId);
  const selectedLayer = map?.layers.find((l) => l.id === selectedLayerId) ?? null;
  const isObjectLayer = selectedLayer?.type === 'object';

  // イベントモーダル state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalObject, setEventModalObject] = useState<MapObject | null>(null);

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
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onDoubleClick={handleDoubleClick}
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
