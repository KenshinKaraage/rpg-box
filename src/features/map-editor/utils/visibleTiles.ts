import type { Viewport } from '@/stores/mapEditorSlice';

export interface TileRange {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function getVisibleTileRange(
  viewport: Viewport,
  canvas: { w: number; h: number },
  map: { w: number; h: number },
  tileSize: number
): TileRange {
  const scaledTile = tileSize * viewport.zoom;
  return {
    minX: Math.max(0, Math.floor(viewport.x / scaledTile)),
    minY: Math.max(0, Math.floor(viewport.y / scaledTile)),
    maxX: Math.min(map.w, Math.ceil((viewport.x + canvas.w) / scaledTile)),
    maxY: Math.min(map.h, Math.ceil((viewport.y + canvas.h) / scaledTile)),
  };
}
