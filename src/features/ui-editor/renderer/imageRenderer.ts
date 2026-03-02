/**
 * Image renderer — 画像描画、9-slice、ガイドライン
 */
import * as twgl from 'twgl.js';
import type { EditorUIObject } from '@/stores/uiEditorSlice';
import { resolveAllTransforms, getWorldCorners } from './transformResolver';
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { parseColor, cornersToTriangles } from './renderUtils';

export interface ImageData {
  imageId?: string;
  tint?: string;
  opacity?: number;
  sliceMode?: 'none' | 'nine-slice';
  sliceBorder?: number;
  sliceFill?: 'stretch' | 'repeat';
}

const PLACEHOLDER_KEY = '__placeholder__';

/**
 * プレースホルダーテクスチャを生成（チェッカーボード + アイコン）
 */
function getOrCreatePlaceholder(
  ctx: UIRendererContext,
  gl: WebGLRenderingContext
): WebGLTexture {
  const cached = ctx.textureCache.get(PLACEHOLDER_KEY);
  if (cached) return cached;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c2d = canvas.getContext('2d')!;

  // Checkerboard
  const tileSize = 8;
  for (let y = 0; y < size; y += tileSize) {
    for (let x = 0; x < size; x += tileSize) {
      c2d.fillStyle = ((x + y) / tileSize) % 2 === 0 ? '#e0e0e0' : '#c0c0c0';
      c2d.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Mountain icon (simple)
  const cx = size / 2;
  const cy = size / 2;
  c2d.strokeStyle = '#888888';
  c2d.lineWidth = 2;
  c2d.beginPath();
  c2d.moveTo(cx - 16, cy + 10);
  c2d.lineTo(cx - 6, cy - 8);
  c2d.lineTo(cx, cy);
  c2d.lineTo(cx + 8, cy - 12);
  c2d.lineTo(cx + 16, cy + 10);
  c2d.closePath();
  c2d.stroke();

  // Sun circle
  c2d.beginPath();
  c2d.arc(cx + 10, cy - 10, 4, 0, Math.PI * 2);
  c2d.stroke();

  const tex = twgl.createTexture(gl, { src: canvas, minMag: gl.LINEAR });
  ctx.textureCache.set(PLACEHOLDER_KEY, tex);
  return tex;
}

export function renderImage(
  ctx: UIRendererContext,
  data: ImageData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  if (!data.imageId) {
    // Render placeholder
    const placeholderTex = getOrCreatePlaceholder(ctx, gl);
    const corners = getWorldCorners(rect);
    const positions = cornersToTriangles(corners);
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
    const tint = [1, 1, 1, 0.6];

    gl.useProgram(ctx.texturedProgram.program);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: positions },
      a_texcoord: { numComponents: 2, data: texCoords },
    });
    twgl.setBuffersAndAttributes(gl, ctx.texturedProgram, bufferInfo);
    twgl.setUniforms(ctx.texturedProgram, {
      u_matrix: ctx.matrix,
      u_texture: placeholderTex,
      u_tint: tint,
    });
    twgl.drawBufferInfo(gl, bufferInfo);
    return;
  }

  const texture = ctx.textureCache.get(data.imageId);
  if (!texture) {
    const assetData = ctx.getAssetData(data.imageId);
    if (!assetData) return;

    const img = new Image();
    img.src = assetData;
    img.onload = () => {
      const tex = twgl.createTexture(gl, {
        src: img,
        minMag: gl.LINEAR,
      });
      ctx.textureCache.set(data.imageId!, tex);
      ctx.imageSizeCache.set(data.imageId!, { w: img.naturalWidth, h: img.naturalHeight });
      ctx.onTextureLoaded();
    };
    return;
  }

  const opacity = data.opacity ?? 1;
  const tint = data.tint ? parseColor(data.tint) : [1, 1, 1, 1];
  tint[3] = opacity;

  const sliceMode = data.sliceMode ?? 'none';
  const imgSize = ctx.imageSizeCache?.get(data.imageId);

  if (sliceMode === 'nine-slice' && imgSize) {
    renderNineSlice(ctx, texture, tint, data.sliceBorder ?? 16, imgSize, rect, gl, data.sliceFill ?? 'stretch');
  } else {
    const corners = getWorldCorners(rect);
    const positions = cornersToTriangles(corners);
    const texcoords = new Float32Array([
      0, 0, 1, 0, 0, 1,
      0, 1, 1, 0, 1, 1,
    ]);

    gl.useProgram(ctx.texturedProgram.program);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: positions },
      a_texcoord: { numComponents: 2, data: texcoords },
    });
    twgl.setBuffersAndAttributes(gl, ctx.texturedProgram, bufferInfo);
    twgl.setUniforms(ctx.texturedProgram, {
      u_matrix: ctx.matrix,
      u_texture: texture,
      u_tint: tint,
    });
    twgl.drawBufferInfo(gl, bufferInfo);
  }
}

/**
 * CPU 側タイリング: セル領域を元テクスチャサイズ単位で繰り返し配置。
 */
function buildRepeatQuads(
  localX0: number,
  localY0: number,
  cellW: number,
  cellH: number,
  tileW: number,
  tileH: number,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  toWorld: (lx: number, ly: number) => [number, number],
  positions: number[],
  texcoords: number[]
): void {
  if (cellW <= 0 || cellH <= 0 || tileW <= 0 || tileH <= 0) return;
  let y = 0;
  while (y < cellH) {
    const remH = Math.min(tileH, cellH - y);
    const fracV = remH / tileH;
    const cv0 = v0;
    const cv1 = v0 + (v1 - v0) * fracV;
    let x = 0;
    while (x < cellW) {
      const remW = Math.min(tileW, cellW - x);
      const fracU = remW / tileW;
      const cu0 = u0;
      const cu1 = u0 + (u1 - u0) * fracU;

      const qx0 = localX0 + x;
      const qy0 = localY0 + y;
      const qx1 = localX0 + x + remW;
      const qy1 = localY0 + y + remH;

      const tl = toWorld(qx0, qy0);
      const tr = toWorld(qx1, qy0);
      const bl = toWorld(qx0, qy1);
      const br = toWorld(qx1, qy1);

      positions.push(
        tl[0], tl[1], tr[0], tr[1], bl[0], bl[1],
        bl[0], bl[1], tr[0], tr[1], br[0], br[1],
      );
      texcoords.push(
        cu0, cv0, cu1, cv0, cu0, cv1,
        cu0, cv1, cu1, cv0, cu1, cv1,
      );
      x += remW;
    }
    y += remH;
  }
}

/**
 * 9-slice 描画: テクスチャを 3x3 グリッドに分割。
 * stretch: 角はそのまま、辺・中央は引き延ばし。
 * repeat: 角はそのまま、辺・中央はタイル繰り返し。
 */
function renderNineSlice(
  ctx: UIRendererContext,
  texture: WebGLTexture,
  tint: number[],
  border: number,
  imgSize: { w: number; h: number },
  rect: WorldRect,
  gl: WebGLRenderingContext,
  sliceFill: 'stretch' | 'repeat' = 'stretch'
): void {
  const dw = rect.w * rect.scaleX;
  const dh = rect.h * rect.scaleY;
  const b = Math.min(border, imgSize.w / 2, imgSize.h / 2, dw / 2, dh / 2);

  const uL = b / imgSize.w;
  const uR = 1 - uL;
  const vT = b / imgSize.h;
  const vB = 1 - vT;

  const hw = dw / 2;
  const hh = dh / 2;
  const xs = [-hw, -hw + b, hw - b, hw];
  const ys = [-hh, -hh + b, hh - b, hh];
  const us = [0, uL, uR, 1];
  const vs = [0, vT, vB, 1];

  const rad = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const toWorld = (lx: number, ly: number): [number, number] => [
    rect.x + lx * cos - ly * sin,
    rect.y + lx * sin + ly * cos,
  ];

  const positions: number[] = [];
  const texcoords: number[] = [];

  const srcMiddleW = imgSize.w - b * 2;
  const srcMiddleH = imgSize.h - b * 2;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x0 = xs[col]!, x1 = xs[col + 1]!;
      const y0 = ys[row]!, y1 = ys[row + 1]!;
      const u0 = us[col]!, u1 = us[col + 1]!;
      const v0 = vs[row]!, v1 = vs[row + 1]!;

      const isCorner = (row === 0 || row === 2) && (col === 0 || col === 2);

      if (sliceFill === 'repeat' && !isCorner) {
        const tileW = col === 1 ? srcMiddleW : b;
        const tileH = row === 1 ? srcMiddleH : b;
        buildRepeatQuads(
          x0, y0,
          x1 - x0, y1 - y0,
          tileW, tileH,
          u0, v0, u1, v1,
          toWorld, positions, texcoords,
        );
      } else {
        const tl = toWorld(x0, y0);
        const tr = toWorld(x1, y0);
        const bl = toWorld(x0, y1);
        const br = toWorld(x1, y1);

        positions.push(
          tl[0], tl[1], tr[0], tr[1], bl[0], bl[1],
          bl[0], bl[1], tr[0], tr[1], br[0], br[1],
        );
        texcoords.push(
          u0, v0, u1, v0, u0, v1,
          u0, v1, u1, v0, u1, v1,
        );
      }
    }
  }

  gl.useProgram(ctx.texturedProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(positions) },
    a_texcoord: { numComponents: 2, data: new Float32Array(texcoords) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.texturedProgram, bufferInfo);
  twgl.setUniforms(ctx.texturedProgram, {
    u_matrix: ctx.matrix,
    u_texture: texture,
    u_tint: tint,
  });
  twgl.drawBufferInfo(gl, bufferInfo);
}

/**
 * 選択中オブジェクトの nine-slice 境界をオレンジ線で描画。
 */
export function renderNineSliceGuides(
  ctx: UIRendererContext,
  objects: EditorUIObject[],
  selectedObjectIds: string[],
  canvasWidth: number,
  canvasHeight: number
): void {
  if (selectedObjectIds.length !== 1) return;

  const objId = selectedObjectIds[0]!;
  const obj = objects.find((o) => o.id === objId);
  if (!obj) return;

  const imageComp = obj.components.find((c) => c.type === 'image');
  if (!imageComp) return;
  const data = (imageComp.data ?? {}) as Record<string, unknown>;
  if (data.sliceMode !== 'nine-slice') return;

  const sliceBorder = (data.sliceBorder as number) ?? 16;

  const worldRects = resolveAllTransforms(objects, canvasWidth, canvasHeight);
  const rect = worldRects.get(objId);
  if (!rect) return;

  const { gl } = ctx;
  const dw = rect.w * rect.scaleX;
  const dh = rect.h * rect.scaleY;
  const b = Math.min(sliceBorder, dw / 2, dh / 2);
  const hw = dw / 2;
  const hh = dh / 2;

  const rad = (rect.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const toWorld = (lx: number, ly: number): [number, number] => [
    rect.x + lx * cos - ly * sin,
    rect.y + lx * sin + ly * cos,
  ];

  const linePositions: number[] = [];

  const ll1 = toWorld(-hw + b, -hh);
  const ll2 = toWorld(-hw + b, hh);
  linePositions.push(ll1[0], ll1[1], ll2[0], ll2[1]);

  const rl1 = toWorld(hw - b, -hh);
  const rl2 = toWorld(hw - b, hh);
  linePositions.push(rl1[0], rl1[1], rl2[0], rl2[1]);

  const tl1 = toWorld(-hw, -hh + b);
  const tl2 = toWorld(hw, -hh + b);
  linePositions.push(tl1[0], tl1[1], tl2[0], tl2[1]);

  const bl1 = toWorld(-hw, hh - b);
  const bl2 = toWorld(hw, hh - b);
  linePositions.push(bl1[0], bl1[1], bl2[0], bl2[1]);

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(linePositions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, {
    u_matrix: ctx.matrix,
    u_color: [0.98, 0.57, 0.24, 0.8],
  });
  twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
}
