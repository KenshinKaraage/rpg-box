'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { useMapCanvas } from '../hooks/useMapCanvas';
import { useMapViewport } from '../hooks/useMapViewport';
import { useTilePainting } from '../hooks/useTilePainting';
import { TILE_SIZE } from '../utils/constants';

interface MapCanvasProps {
  mapId: string;
}

export function MapCanvas({ mapId }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maps = useStore((s) => s.maps);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const map = maps.find((m) => m.id === mapId);

  useMapCanvas(canvasRef, mapId);

  const { handleWheel, handleMouseDown, handleMouseMove, handleMouseUp } = useMapViewport(
    canvasRef,
    map?.width ?? 20,
    map?.height ?? 15,
    TILE_SIZE
  );

  const { paint, commitRect } = useTilePainting(mapId, selectedLayerId ?? '');

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
      paint(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseMove(e.nativeEvent);
    if (e.buttons & 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      paint(e.clientX - rect.left, e.clientY - rect.top);
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
        handleMouseUp();
        const domRect = e.currentTarget.getBoundingClientRect();
        commitRect(e.clientX - domRect.left, e.clientY - domRect.top);
      }}
    />
  );
}
