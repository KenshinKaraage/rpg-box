/**
 * Text renderer — Canvas2D → WebGL テクスチャ描画
 */
import * as twgl from 'twgl.js';
import { getWorldCorners } from './transformResolver';
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { cornersToTriangles } from './renderUtils';

export interface TextData {
  content?: string;
  fontSize?: number;
  fontId?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
}

function textCacheKey(data: TextData, rect: WorldRect): string {
  return `text:${data.content}:${data.fontSize}:${data.color}:${data.align}:${data.verticalAlign}:${data.lineHeight}:${rect.w}:${rect.h}:${rect.scaleX}:${rect.scaleY}`;
}

export function renderText(
  ctx: UIRendererContext,
  data: TextData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const content = data.content ?? '';
  if (!content) return;

  const cacheKey = textCacheKey(data, rect);
  let texture = ctx.textureCache.get(cacheKey);

  if (!texture) {
    const newTex = createTextTexture(gl, data, rect);
    if (!newTex) return;
    texture = newTex;
    ctx.textureCache.set(cacheKey, texture);
  }

  const corners = getWorldCorners(rect);
  const positions = cornersToTriangles(corners);
  const texcoords = new Float32Array([
    0, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 1,
  ]);

  // Text textures use premultiplied alpha — switch blend mode
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  gl.useProgram(ctx.texturedProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: positions },
    a_texcoord: { numComponents: 2, data: texcoords },
  });
  twgl.setBuffersAndAttributes(gl, ctx.texturedProgram, bufferInfo);
  twgl.setUniforms(ctx.texturedProgram, {
    u_matrix: ctx.matrix,
    u_texture: texture,
    u_tint: [1, 1, 1, 1],
  });
  twgl.drawBufferInfo(gl, bufferInfo);

  // Restore default blend mode
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function createTextTexture(
  gl: WebGLRenderingContext,
  data: TextData,
  rect: WorldRect
): WebGLTexture | null {
  const w = Math.max(1, Math.round(rect.w * rect.scaleX));
  const h = Math.max(1, Math.round(rect.h * rect.scaleY));
  const fontSize = data.fontSize ?? 16;
  const color = data.color ?? '#000000';
  const align = data.align ?? 'left';
  const lineHeight = data.lineHeight ?? 1.2;

  const canvas2d = document.createElement('canvas');
  canvas2d.width = w;
  canvas2d.height = h;
  const c2d = canvas2d.getContext('2d');
  if (!c2d) return null;

  c2d.clearRect(0, 0, w, h);
  c2d.fillStyle = color;
  c2d.font = `${fontSize}px sans-serif`;
  c2d.textAlign = align;
  c2d.textBaseline = 'top';

  const x = align === 'center' ? w / 2 : align === 'right' ? w : 0;
  const lines = (data.content ?? '').split('\n');
  const lineHeightPx = fontSize * lineHeight;

  // Total text block height: (N-1) gaps + 1 line of fontSize
  const totalHeight = lines.length > 1
    ? (lines.length - 1) * lineHeightPx + fontSize
    : fontSize;
  const verticalAlign = data.verticalAlign ?? 'top';
  let startY = 0;
  if (verticalAlign === 'middle') {
    startY = (h - totalHeight) / 2;
  } else if (verticalAlign === 'bottom') {
    startY = h - totalHeight;
  }

  for (let i = 0; i < lines.length; i++) {
    c2d.fillText(lines[i]!, x, startY + i * lineHeightPx);
  }

  // Canvas2D outputs premultiplied alpha — tell WebGL to match
  return twgl.createTexture(gl, {
    src: canvas2d,
    minMag: gl.LINEAR,
    premultiplyAlpha: 1,
  });
}
