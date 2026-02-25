'use client';
import { useRef } from 'react';
import { useMapCanvas } from '../hooks/useMapCanvas';
import { useMapViewport } from '../hooks/useMapViewport';
import { useStore } from '@/stores';

interface MapCanvasProps {
  mapId: string;
}

export function MapCanvas({ mapId }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maps = useStore((s) => s.maps);
  const map = maps.find((m) => m.id === mapId);

  useMapCanvas(canvasRef, mapId);
  useMapViewport(canvasRef, map?.width ?? 20, map?.height ?? 15, 32);

  return <canvas ref={canvasRef} data-testid="map-canvas" className="block h-full w-full" />;
}
