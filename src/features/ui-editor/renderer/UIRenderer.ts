/**
 * UIRenderer — WebGL 描画パイプライン
 *
 * UIObject ツリーを走査し、各コンポーネントに応じた描画を行う。
 * T189d: Visual (Image, Text, Shape) + Mask (FillMask, ColorMask) を描画。
 */
import * as twgl from 'twgl.js';
import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';
import { resolveAllTransforms, getWorldCorners } from './transformResolver';
import type { WorldRect } from './transformResolver';
import { SOLID_VERT, SOLID_FRAG, TEXTURED_VERT, TEXTURED_FRAG } from '../utils/shaders';

export interface UIRendererContext {
  gl: WebGLRenderingContext;
  solidProgram: twgl.ProgramInfo;
  texturedProgram: twgl.ProgramInfo;
  matrix: twgl.m4.Mat4;
  textureCache: Map<string, WebGLTexture>;
  /** アセットデータ取得コールバック (imageId → data URL or null) */
  getAssetData: (assetId: string) => string | null;
  /** テクスチャロード完了コールバック */
  onTextureLoaded: () => void;
}

/**
 * UIRenderer のインスタンスを生成するためのセットアップ
 */
export function createRendererPrograms(gl: WebGLRenderingContext) {
  return {
    solidProgram: twgl.createProgramInfo(gl, [SOLID_VERT, SOLID_FRAG]),
    texturedProgram: twgl.createProgramInfo(gl, [TEXTURED_VERT, TEXTURED_FRAG]),
  };
}

/**
 * UIObject ツリーを描画する
 */
export function renderUIObjects(
  ctx: UIRendererContext,
  objects: EditorUIObject[],
  canvasWidth: number,
  canvasHeight: number
): void {
  const { gl } = ctx;
  const worldRects = resolveAllTransforms(objects, canvasWidth, canvasHeight);

  // 深さ優先で描画順を決定（配列順 = Z-order）
  const drawOrder = buildDrawOrder(objects);

  for (const objectId of drawOrder) {
    const obj = objects.find((o) => o.id === objectId);
    if (!obj) continue;
    const worldRect = worldRects.get(objectId);
    if (!worldRect) continue;

    for (const comp of obj.components) {
      renderComponent(ctx, comp, worldRect, gl);
    }
  }
}

/**
 * 深さ優先で描画順を構築
 */
function buildDrawOrder(objects: EditorUIObject[]): string[] {
  const order: string[] = [];
  const childrenMap = new Map<string | undefined, EditorUIObject[]>();

  for (const obj of objects) {
    const siblings = childrenMap.get(obj.parentId);
    if (siblings) {
      siblings.push(obj);
    } else {
      childrenMap.set(obj.parentId, [obj]);
    }
  }

  function traverse(parentId: string | undefined) {
    const children = childrenMap.get(parentId);
    if (!children) return;
    for (const child of children) {
      order.push(child.id);
      traverse(child.id);
    }
  }

  traverse(undefined);
  return order;
}

/**
 * 個別コンポーネントの描画ディスパッチ
 */
function renderComponent(
  ctx: UIRendererContext,
  comp: SerializedUIComponent,
  worldRect: WorldRect,
  gl: WebGLRenderingContext
): void {
  switch (comp.type) {
    case 'shape':
      renderShape(ctx, comp.data as ShapeData, worldRect, gl);
      break;
    case 'image':
      renderImage(ctx, comp.data as ImageData, worldRect, gl);
      break;
    case 'text':
      renderText(ctx, comp.data as TextData, worldRect, gl);
      break;
    case 'fillMask':
      renderFillMask(ctx, comp.data as FillMaskData, worldRect, gl);
      break;
    case 'colorMask':
      renderColorMask(ctx, comp.data as ColorMaskData, worldRect, gl);
      break;
    // Layout, Navigation, Animation, Action は T189e で実装
  }
}

// ──────────────────────────────────────────────
// Component data types (serialized form)
// ──────────────────────────────────────────────

interface ShapeData {
  shapeType?: 'rectangle' | 'ellipse' | 'polygon';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

interface ImageData {
  imageId?: string;
  tint?: string;
  opacity?: number;
  sliceMode?: 'none' | 'nine-slice';
}

interface TextData {
  content?: string;
  fontSize?: number;
  fontId?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
}

interface FillMaskData {
  direction?: 'horizontal' | 'vertical';
  fillAmount?: number;
  reverse?: boolean;
}

interface ColorMaskData {
  color?: string;
  blendMode?: 'multiply' | 'add' | 'overlay';
  opacity?: number;
}

// ──────────────────────────────────────────────
// Shape renderer
// ──────────────────────────────────────────────

function renderShape(
  ctx: UIRendererContext,
  data: ShapeData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const fillColor = parseColor(data.fillColor ?? '#ffffff');
  const corners = getWorldCorners(rect);

  const shapeType = data.shapeType ?? 'rectangle';

  if (shapeType === 'rectangle' || shapeType === 'polygon') {
    // 塗りつぶし（2三角形）
    const positions = new Float32Array([
      corners[0]![0], corners[0]![1],
      corners[1]![0], corners[1]![1],
      corners[3]![0], corners[3]![1],
      corners[3]![0], corners[3]![1],
      corners[1]![0], corners[1]![1],
      corners[2]![0], corners[2]![1],
    ]);

    gl.useProgram(ctx.solidProgram.program);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: positions },
    });
    twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
    twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: fillColor });
    twgl.drawBufferInfo(gl, bufferInfo);

    // 枠線
    if (data.strokeColor) {
      const strokeColor = parseColor(data.strokeColor);
      const borderPositions = new Float32Array([
        corners[0]![0], corners[0]![1],
        corners[1]![0], corners[1]![1],
        corners[1]![0], corners[1]![1],
        corners[2]![0], corners[2]![1],
        corners[2]![0], corners[2]![1],
        corners[3]![0], corners[3]![1],
        corners[3]![0], corners[3]![1],
        corners[0]![0], corners[0]![1],
      ]);
      const borderBuffer = twgl.createBufferInfoFromArrays(gl, {
        a_position: { numComponents: 2, data: borderPositions },
      });
      twgl.setBuffersAndAttributes(gl, ctx.solidProgram, borderBuffer);
      twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: strokeColor });
      twgl.drawBufferInfo(gl, borderBuffer, gl.LINES);
    }
  } else if (shapeType === 'ellipse') {
    renderEllipse(ctx, fillColor, rect, gl);
  }
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

  // Fan triangles from center
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;

    // Center
    positions.push(rect.x, rect.y);

    // Point 1
    const lx1 = Math.cos(a1) * hw;
    const ly1 = Math.sin(a1) * hh;
    positions.push(rect.x + lx1 * cos - ly1 * sin, rect.y + lx1 * sin + ly1 * cos);

    // Point 2
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

// ──────────────────────────────────────────────
// Image renderer
// ──────────────────────────────────────────────

function renderImage(
  ctx: UIRendererContext,
  data: ImageData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  if (!data.imageId) return;

  const texture = ctx.textureCache.get(data.imageId);
  if (!texture) {
    const assetData = ctx.getAssetData(data.imageId);
    if (!assetData) return;

    // 非同期テクスチャロード
    const img = new Image();
    img.src = assetData;
    img.onload = () => {
      const tex = twgl.createTexture(gl, {
        src: img,
        minMag: gl.LINEAR,
      });
      ctx.textureCache.set(data.imageId!, tex);
      ctx.onTextureLoaded();
    };
    return;
  }

  const corners = getWorldCorners(rect);
  const opacity = data.opacity ?? 1;
  const tint = data.tint ? parseColor(data.tint) : [1, 1, 1, 1];
  tint[3] = opacity;

  const positions = new Float32Array([
    corners[0]![0], corners[0]![1],
    corners[1]![0], corners[1]![1],
    corners[3]![0], corners[3]![1],
    corners[3]![0], corners[3]![1],
    corners[1]![0], corners[1]![1],
    corners[2]![0], corners[2]![1],
  ]);

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

// ──────────────────────────────────────────────
// Text renderer (Canvas2D → テクスチャ)
// ──────────────────────────────────────────────

/** テキストテクスチャのキャッシュキー生成 */
function textCacheKey(data: TextData, rect: WorldRect): string {
  return `text:${data.content}:${data.fontSize}:${data.color}:${data.align}:${data.lineHeight}:${rect.w}:${rect.h}:${rect.scaleX}:${rect.scaleY}`;
}

function renderText(
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
  const positions = new Float32Array([
    corners[0]![0], corners[0]![1],
    corners[1]![0], corners[1]![1],
    corners[3]![0], corners[3]![1],
    corners[3]![0], corners[3]![1],
    corners[1]![0], corners[1]![1],
    corners[2]![0], corners[2]![1],
  ]);
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
    u_tint: [1, 1, 1, 1],
  });
  twgl.drawBufferInfo(gl, bufferInfo);
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

  // Vertical alignment
  const totalHeight = lines.length * lineHeightPx;
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

  return twgl.createTexture(gl, {
    src: canvas2d,
    minMag: gl.LINEAR,
  });
}

// ──────────────────────────────────────────────
// FillMask renderer
// ──────────────────────────────────────────────

function renderFillMask(
  ctx: UIRendererContext,
  data: FillMaskData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const fillAmount = Math.max(0, Math.min(1, data.fillAmount ?? 1));
  if (fillAmount >= 1) return; // No masking needed

  const direction = data.direction ?? 'horizontal';
  const reverse = data.reverse ?? false;

  // FillMask は未充填部分を半透明黒でオーバーレイして表現
  const corners = getWorldCorners(rect);
  const maskColor = [0, 0, 0, 0.5];

  let positions: Float32Array;

  if (direction === 'horizontal') {
    // 水平: fillAmount の右側（または reverse で左側）をマスク
    const t = reverse ? fillAmount : 1 - fillAmount;
    const maskedCorners = interpolateCorners(corners, direction, reverse ? 0 : t, reverse ? t : 1);
    positions = cornersToTriangles(maskedCorners);
  } else {
    // 垂直: fillAmount の下側（または reverse で上側）をマスク
    const t = reverse ? fillAmount : 1 - fillAmount;
    const maskedCorners = interpolateCorners(corners, direction, reverse ? 0 : t, reverse ? t : 1);
    positions = cornersToTriangles(maskedCorners);
  }

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: positions },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: maskColor });
  twgl.drawBufferInfo(gl, bufferInfo);
}

function interpolateCorners(
  corners: [number, number][],
  direction: 'horizontal' | 'vertical',
  tStart: number,
  tEnd: number
): [number, number][] {
  // corners: [topLeft, topRight, bottomRight, bottomLeft]
  if (direction === 'horizontal') {
    const tl = lerp2d(corners[0]!, corners[1]!, tStart);
    const tr = lerp2d(corners[0]!, corners[1]!, tEnd);
    const br = lerp2d(corners[3]!, corners[2]!, tEnd);
    const bl = lerp2d(corners[3]!, corners[2]!, tStart);
    return [tl, tr, br, bl];
  } else {
    const tl = lerp2d(corners[0]!, corners[3]!, tStart);
    const tr = lerp2d(corners[1]!, corners[2]!, tStart);
    const br = lerp2d(corners[1]!, corners[2]!, tEnd);
    const bl = lerp2d(corners[0]!, corners[3]!, tEnd);
    return [tl, tr, br, bl];
  }
}

function lerp2d(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function cornersToTriangles(corners: [number, number][]): Float32Array {
  return new Float32Array([
    corners[0]![0], corners[0]![1],
    corners[1]![0], corners[1]![1],
    corners[3]![0], corners[3]![1],
    corners[3]![0], corners[3]![1],
    corners[1]![0], corners[1]![1],
    corners[2]![0], corners[2]![1],
  ]);
}

// ──────────────────────────────────────────────
// ColorMask renderer
// ──────────────────────────────────────────────

function renderColorMask(
  ctx: UIRendererContext,
  data: ColorMaskData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const color = parseColor(data.color ?? '#ffffff');
  const opacity = data.opacity ?? 1;
  const blendMode = data.blendMode ?? 'multiply';

  // ブレンドモードを設定
  switch (blendMode) {
    case 'multiply':
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
      break;
    case 'add':
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      break;
    case 'overlay':
      // overlay の正確な実装はシェーダーが必要。近似として softlight 的なブレンドを使用
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

// ──────────────────────────────────────────────
// Color utilities
// ──────────────────────────────────────────────

/**
 * CSS カラー文字列を [r, g, b, a] (0-1) に変換
 */
export function parseColor(hex: string): number[] {
  if (hex.startsWith('#')) {
    const h = hex.slice(1);
    if (h.length === 3) {
      const r = parseInt(h[0]! + h[0]!, 16) / 255;
      const g = parseInt(h[1]! + h[1]!, 16) / 255;
      const b = parseInt(h[2]! + h[2]!, 16) / 255;
      return [r, g, b, 1];
    }
    if (h.length === 6) {
      const r = parseInt(h.slice(0, 2), 16) / 255;
      const g = parseInt(h.slice(2, 4), 16) / 255;
      const b = parseInt(h.slice(4, 6), 16) / 255;
      return [r, g, b, 1];
    }
    if (h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16) / 255;
      const g = parseInt(h.slice(2, 4), 16) / 255;
      const b = parseInt(h.slice(4, 6), 16) / 255;
      const a = parseInt(h.slice(6, 8), 16) / 255;
      return [r, g, b, a];
    }
  }
  return [1, 1, 1, 1];
}
