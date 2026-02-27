import type { Viewport } from '@/stores/mapEditorSlice';

export function screenToTile(
  sx: number,
  sy: number,
  viewport: Viewport,
  tileSize: number
): { tx: number; ty: number } {
  return {
    tx: Math.floor((sx + viewport.x) / (tileSize * viewport.zoom)),
    ty: Math.floor((sy + viewport.y) / (tileSize * viewport.zoom)),
  };
}

export function tileToScreen(
  tx: number,
  ty: number,
  viewport: Viewport,
  tileSize: number
): { sx: number; sy: number } {
  return {
    sx: tx * tileSize * viewport.zoom - viewport.x,
    sy: ty * tileSize * viewport.zoom - viewport.y,
  };
}
