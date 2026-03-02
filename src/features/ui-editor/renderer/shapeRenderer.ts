/**
 * Shape renderer — 矩形、楕円、多角形の描画
 */
import * as twgl from 'twgl.js';
import { getWorldCorners } from './transformResolver';
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { parseColor, cornersToTriangles } from './renderUtils';

export interface ShapeData {
  shapeType?: 'rectangle' | 'ellipse' | 'polygon';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export function renderShape(
  ctx: UIRendererContext,
  data: ShapeData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const fillColor = parseColor(data.fillColor ?? '#ffffff');
  const shapeType = data.shapeType ?? 'rectangle';
  const cornerRadius = data.cornerRadius ?? 0;

  if (shapeType === 'rectangle' || shapeType === 'polygon') {
    const corners = getWorldCorners(rect);

    if (cornerRadius > 0) {
      const outline = buildRoundedRectOutline(rect, cornerRadius);
      renderPolygonFill(ctx, outline, fillColor, gl);
      if (data.strokeColor) {
        const strokeColor = parseColor(data.strokeColor);
        const sw = data.strokeWidth ?? 1;
        renderPolylineStroke(ctx, outline, sw, strokeColor, gl);
      }
    } else {
      const positions = cornersToTriangles(corners);
      gl.useProgram(ctx.solidProgram.program);
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        a_position: { numComponents: 2, data: positions },
      });
      twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
      twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: fillColor });
      twgl.drawBufferInfo(gl, bufferInfo);

      if (data.strokeColor) {
        const strokeColor = parseColor(data.strokeColor);
        const sw = data.strokeWidth ?? 1;
        renderStrokeQuads(ctx, corners, sw, strokeColor, gl);
      }
    }
  } else if (shapeType === 'ellipse') {
    renderEllipse(ctx, fillColor, rect, gl);

    if (data.strokeColor) {
      const strokeColor = parseColor(data.strokeColor);
      const sw = data.strokeWidth ?? 1;
      renderEllipseStroke(ctx, strokeColor, sw, rect, gl);
    }
  }
}

/**
 * 矩形の枠線をフレーム（外側矩形 - 内側矩形）で描画する。
 * 各角で miter join を使い、角の隙間をなくす。
 */
function renderStrokeQuads(
  ctx: UIRendererContext,
  corners: [number, number][],
  strokeWidth: number,
  strokeColor: number[],
  gl: WebGLRenderingContext
): void {
  const hw = strokeWidth / 2;
  const outer: [number, number][] = [];
  const inner: [number, number][] = [];

  for (let i = 0; i < 4; i++) {
    const prev = corners[(i + 3) % 4]!;
    const curr = corners[i]!;
    const next = corners[(i + 1) % 4]!;

    const d1x = curr[0] - prev[0], d1y = curr[1] - prev[1];
    const d2x = next[0] - curr[0], d2y = next[1] - curr[1];
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
    if (len1 === 0 || len2 === 0) {
      outer.push([curr[0], curr[1]]);
      inner.push([curr[0], curr[1]]);
      continue;
    }

    const n1x = d1y / len1, n1y = -d1x / len1;
    const n2x = d2y / len2, n2y = -d2x / len2;

    let mx = n1x + n2x, my = n1y + n2y;
    const mlen = Math.sqrt(mx * mx + my * my);
    if (mlen < 0.001) {
      mx = n1x; my = n1y;
    } else {
      mx /= mlen; my /= mlen;
    }

    const dot = mx * n1x + my * n1y;
    const miterLen = dot > 0.1 ? hw / dot : hw;

    outer.push([curr[0] + mx * miterLen, curr[1] + my * miterLen]);
    inner.push([curr[0] - mx * miterLen, curr[1] - my * miterLen]);
  }

  const positions: number[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const o0 = outer[i]!, o1 = outer[j]!;
    const i0 = inner[i]!, i1 = inner[j]!;
    positions.push(o0[0], o0[1], o1[0], o1[1], i0[0], i0[1]);
    positions.push(i0[0], i0[1], o1[0], o1[1], i1[0], i1[1]);
  }

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(positions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: strokeColor });
  twgl.drawBufferInfo(gl, bufferInfo);
}

// ── Rounded rectangle helpers ──

const CORNER_SEGMENTS = 8;

function buildRoundedRectOutline(rect: WorldRect, radius: number): [number, number][] {
  const hw = (rect.w * rect.scaleX) / 2;
  const hh = (rect.h * rect.scaleY) / 2;
  const r = Math.min(radius, hw, hh);

  const rad = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const transform = (lx: number, ly: number): [number, number] => [
    rect.x + lx * cos - ly * sin,
    rect.y + lx * sin + ly * cos,
  ];

  const points: [number, number][] = [];

  const cornerCenters: [number, number, number][] = [
    [-hw + r, -hh + r, Math.PI],
    [hw - r, -hh + r, -Math.PI / 2],
    [hw - r, hh - r, 0],
    [-hw + r, hh - r, Math.PI / 2],
  ];

  for (const [cx, cy, startAngle] of cornerCenters) {
    for (let i = 0; i <= CORNER_SEGMENTS; i++) {
      const a = startAngle + (i / CORNER_SEGMENTS) * (Math.PI / 2);
      const lx = cx + Math.cos(a) * r;
      const ly = cy + Math.sin(a) * r;
      points.push(transform(lx, ly));
    }
  }

  return points;
}

function renderPolygonFill(
  ctx: UIRendererContext,
  outline: [number, number][],
  color: number[],
  gl: WebGLRenderingContext
): void {
  if (outline.length < 3) return;

  let cx = 0, cy = 0;
  for (const [px, py] of outline) { cx += px; cy += py; }
  cx /= outline.length; cy /= outline.length;

  const positions: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const p0 = outline[i]!;
    const p1 = outline[(i + 1) % outline.length]!;
    positions.push(cx, cy, p0[0], p0[1], p1[0], p1[1]);
  }

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(positions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: color });
  twgl.drawBufferInfo(gl, bufferInfo);
}

function renderPolylineStroke(
  ctx: UIRendererContext,
  outline: [number, number][],
  strokeWidth: number,
  strokeColor: number[],
  gl: WebGLRenderingContext
): void {
  const n = outline.length;
  if (n < 3) return;
  const hw = strokeWidth / 2;

  const outer: [number, number][] = [];
  const inner: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const prev = outline[(i - 1 + n) % n]!;
    const curr = outline[i]!;
    const next = outline[(i + 1) % n]!;

    const d1x = curr[0] - prev[0], d1y = curr[1] - prev[1];
    const d2x = next[0] - curr[0], d2y = next[1] - curr[1];
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
    if (len1 === 0 || len2 === 0) {
      outer.push([curr[0], curr[1]]);
      inner.push([curr[0], curr[1]]);
      continue;
    }

    const n1x = d1y / len1, n1y = -d1x / len1;
    const n2x = d2y / len2, n2y = -d2x / len2;

    let mx = n1x + n2x, my = n1y + n2y;
    const mlen = Math.sqrt(mx * mx + my * my);
    if (mlen < 0.001) {
      mx = n1x; my = n1y;
    } else {
      mx /= mlen; my /= mlen;
    }

    const dot = mx * n1x + my * n1y;
    const miterLen = Math.min(dot > 0.1 ? hw / dot : hw, hw * 2);

    outer.push([curr[0] + mx * miterLen, curr[1] + my * miterLen]);
    inner.push([curr[0] - mx * miterLen, curr[1] - my * miterLen]);
  }

  const positions: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const o0 = outer[i]!, o1 = outer[j]!;
    const i0 = inner[i]!, i1 = inner[j]!;
    positions.push(o0[0], o0[1], o1[0], o1[1], i0[0], i0[1]);
    positions.push(i0[0], i0[1], o1[0], o1[1], i1[0], i1[1]);
  }

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(positions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: strokeColor });
  twgl.drawBufferInfo(gl, bufferInfo);
}

function renderEllipse(
  ctx: UIRendererContext,
  color: number[],
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const segments = 32;
  const positions: number[] = [];
  const hw = (rect.w * rect.scaleX) / 2;
  const hh = (rect.h * rect.scaleY) / 2;
  const rad = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;

    positions.push(rect.x, rect.y);

    const lx1 = Math.cos(a1) * hw;
    const ly1 = Math.sin(a1) * hh;
    positions.push(rect.x + lx1 * cos - ly1 * sin, rect.y + lx1 * sin + ly1 * cos);

    const lx2 = Math.cos(a2) * hw;
    const ly2 = Math.sin(a2) * hh;
    positions.push(rect.x + lx2 * cos - ly2 * sin, rect.y + lx2 * sin + ly2 * cos);
  }

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(positions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: color });
  twgl.drawBufferInfo(gl, bufferInfo);
}

function renderEllipseStroke(
  ctx: UIRendererContext,
  color: number[],
  strokeWidth: number,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const segments = 32;
  const positions: number[] = [];
  const hwOuter = (rect.w * rect.scaleX) / 2 + strokeWidth / 2;
  const hhOuter = (rect.h * rect.scaleY) / 2 + strokeWidth / 2;
  const hwInner = (rect.w * rect.scaleX) / 2 - strokeWidth / 2;
  const hhInner = (rect.h * rect.scaleY) / 2 - strokeWidth / 2;
  const rad = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;

    const ox1 = Math.cos(a1) * hwOuter;
    const oy1 = Math.sin(a1) * hhOuter;
    const ix1 = Math.cos(a1) * hwInner;
    const iy1 = Math.sin(a1) * hhInner;
    const ox2 = Math.cos(a2) * hwOuter;
    const oy2 = Math.sin(a2) * hhOuter;
    const ix2 = Math.cos(a2) * hwInner;
    const iy2 = Math.sin(a2) * hhInner;

    const rotX = (lx: number, ly: number) => rect.x + lx * cos - ly * sin;
    const rotY = (lx: number, ly: number) => rect.y + lx * sin + ly * cos;

    positions.push(rotX(ox1, oy1), rotY(ox1, oy1));
    positions.push(rotX(ox2, oy2), rotY(ox2, oy2));
    positions.push(rotX(ix1, iy1), rotY(ix1, iy1));

    positions.push(rotX(ix1, iy1), rotY(ix1, iy1));
    positions.push(rotX(ox2, oy2), rotY(ox2, oy2));
    positions.push(rotX(ix2, iy2), rotY(ix2, iy2));
  }

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(positions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: color });
  twgl.drawBufferInfo(gl, bufferInfo);
}
