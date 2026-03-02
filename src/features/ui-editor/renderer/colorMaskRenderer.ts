/**
 * ColorMask renderer — ブレンドモード付き色マスク
 */
import * as twgl from 'twgl.js';
import { getWorldCorners } from './transformResolver';
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { parseColor, cornersToTriangles } from './renderUtils';

export interface ColorMaskData {
  color?: string;
  blendMode?: 'multiply' | 'add' | 'overlay';
  opacity?: number;
}

export function renderColorMask(
  ctx: UIRendererContext,
  data: ColorMaskData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const color = parseColor(data.color ?? '#ffffff');
  const opacity = data.opacity ?? 1;
  const blendMode = data.blendMode ?? 'multiply';

  switch (blendMode) {
    case 'multiply':
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
      break;
    case 'add':
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      break;
    case 'overlay':
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      break;
  }

  color[3] = opacity;

  const corners = getWorldCorners(rect);
  const positions = cornersToTriangles(corners);

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: positions },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: color });
  twgl.drawBufferInfo(gl, bufferInfo);

  // ブレンドモードを元に戻す
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}
