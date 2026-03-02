/**
 * FillMask renderer — ステンシル書き込み用（充填領域を描画）
 */
import * as twgl from 'twgl.js';
import { getWorldCorners } from './transformResolver';
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { cornersToTriangles, interpolateCorners } from './renderUtils';

export interface FillMaskData {
  direction?: 'horizontal' | 'vertical' | 'radial';
  fillAmount?: number;
  reverse?: boolean;
}

/**
 * FillMask の「充填済み」領域をステンシルバッファに書き込む。
 */
export function drawFillRegion(
  ctx: UIRendererContext,
  data: FillMaskData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const fillAmount = Math.max(0, Math.min(1, data.fillAmount ?? 1));
  const direction = data.direction ?? 'horizontal';
  const reverse = data.reverse ?? false;
  const corners = getWorldCorners(rect);

  if (direction === 'radial') {
    drawRadialFillRegion(ctx, fillAmount, reverse, rect, gl);
    return;
  }

  let filledCorners: [number, number][];
  if (reverse) {
    filledCorners = interpolateCorners(corners, direction, 1 - fillAmount, 1);
  } else {
    filledCorners = interpolateCorners(corners, direction, 0, fillAmount);
  }

  const positions = cornersToTriangles(filledCorners);

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: positions },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: [1, 1, 1, 1] });
  twgl.drawBufferInfo(gl, bufferInfo);
}

/**
 * ラジアルフィルマスク：中心から時計回りの扇形で充填。
 */
function drawRadialFillRegion(
  ctx: UIRendererContext,
  fillAmount: number,
  reverse: boolean,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  if (fillAmount <= 0) return;

  const hw = (rect.w * rect.scaleX) / 2;
  const hh = (rect.h * rect.scaleY) / 2;
  const radius = Math.sqrt(hw * hw + hh * hh);

  const rad = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const toWorld = (lx: number, ly: number): [number, number] => [
    rect.x + lx * cos - ly * sin,
    rect.y + lx * sin + ly * cos,
  ];

  const segments = 64;
  const totalAngle = fillAmount * Math.PI * 2;
  const startAngle = -Math.PI / 2;
  const dir = reverse ? -1 : 1;

  const positions: number[] = [];
  const cx = 0, cy = 0;

  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + dir * (i / segments) * totalAngle;
    const a2 = startAngle + dir * ((i + 1) / segments) * totalAngle;

    const c = toWorld(cx, cy);
    const p1 = toWorld(Math.cos(a1) * radius, Math.sin(a1) * radius);
    const p2 = toWorld(Math.cos(a2) * radius, Math.sin(a2) * radius);

    positions.push(c[0], c[1], p1[0], p1[1], p2[0], p2[1]);
  }

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(positions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: [1, 1, 1, 1] });
  twgl.drawBufferInfo(gl, bufferInfo);
}
