/**
 * Line renderer — 開いたポリラインの描画
 */
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { parseColor } from './renderUtils';
import { verticesToWorld, renderPolylineStroke } from './shapeRenderer';

export interface LineData {
  strokeColor?: string;
  strokeWidth?: number;
  vertices?: { x: number; y: number }[];
}

export function renderLine(
  ctx: UIRendererContext,
  data: LineData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const verts = data.vertices ?? [{ x: 0, y: 0 }, { x: 1, y: 1 }];
  if (verts.length < 2) return;
  if (!data.strokeColor) return;

  const worldVerts = verticesToWorld(verts, rect);
  const strokeColor = parseColor(data.strokeColor);
  const sw = data.strokeWidth ?? 2;
  renderPolylineStroke(ctx, worldVerts, sw, strokeColor, gl, false);
}
