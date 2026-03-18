'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { useMapCanvas } from '../hooks/useMapCanvas';
import { useMapViewport } from '../hooks/useMapViewport';
import { useTilePainting } from '../hooks/useTilePainting';
import { useObjectPlacement } from '../hooks/useObjectPlacement';
import { TILE_SIZE } from '../utils/constants';

interface MapCanvasProps {
  mapId: string;
}

export function MapCanvas({ mapId }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maps = useStore((s) => s.maps);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const map = maps.find((m) => m.id === mapId);
  const selectedLayer = map?.layers.find((l) => l.id === selectedLayerId) ?? null;
  const isObjectLayer = selectedLayer?.type === 'object';

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
    <canvas
      ref={canvasRef}
      data-testid="map-canvas"
      className="block h-full w-full"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={(e) => {
        if (isObjectLayer) {
          objPlacement.handleMouseUp();
        } else {
          handleMouseUp();
          const domRect = e.currentTarget.getBoundingClientRect();
          commitRect(e.clientX - domRect.left, e.clientY - domRect.top);
        }
      }}
    />
  );
}
