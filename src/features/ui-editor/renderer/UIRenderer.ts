/**
 * UIRenderer — WebGL 描画パイプライン
 *
 * UIObject ツリーを走査し、各コンポーネントに応じた描画を行う。
 * FillMask/ColorMask はステンシルバッファによる正確なマスキングを行う。
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

    renderObject(ctx, obj, worldRect, gl);
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
// Per-object rendering with stencil masking
// ──────────────────────────────────────────────

/**
 * 1つの UIObject を描画する。
 * FillMask/ColorMask がある場合はステンシルバッファを使用して
 * 正確なマスキングを行う。
 */
function renderObject(
  ctx: UIRendererContext,
  obj: EditorUIObject,
  worldRect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const fillMaskComp = obj.components.find((c) => c.type === 'fillMask');
  const colorMaskComp = obj.components.find((c) => c.type === 'colorMask');
  const visuals = obj.components.filter(
    (c) => c.type === 'shape' || c.type === 'image' || c.type === 'text'
  );

  if (visuals.length === 0) return;

  const fillMaskData = fillMaskComp?.data as FillMaskData | undefined;
  const colorMaskData = colorMaskComp?.data as ColorMaskData | undefined;
  const fillAmount = Math.max(0, Math.min(1, fillMaskData?.fillAmount ?? 1));
  const needsFillMask = !!fillMaskData && fillAmount < 1;
  const needsColorMask = !!colorMaskData;
  const needsStencil = needsFillMask || needsColorMask;

  if (needsStencil) {
    gl.enable(gl.STENCIL_TEST);
    gl.clearStencil(0);
    gl.clear(gl.STENCIL_BUFFER_BIT);

    // Step 1: FillMask の充填領域をステンシル bit 0 に書き込む
    if (needsFillMask) {
      gl.colorMask(false, false, false, false);
      gl.stencilFunc(gl.ALWAYS, 0x01, 0xff);
      gl.stencilMask(0x01);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      drawFillRegion(ctx, fillMaskData!, worldRect, gl);
      gl.colorMask(true, true, true, true);
    }

    // Step 2: ビジュアルコンポーネント描画
    //   FillMask あり → bit 0 が立っている箇所のみ描画
    //   描画箇所は bit 1 にマーク（ColorMask 用）
    if (needsFillMask) {
      gl.stencilFunc(gl.EQUAL, 0x03, 0x01);
      gl.stencilMask(0x02);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    } else {
      gl.stencilFunc(gl.ALWAYS, 0x02, 0xff);
      gl.stencilMask(0x02);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    }

    for (const comp of visuals) {
      renderVisualComponent(ctx, comp, worldRect, gl);
    }

    // Step 3: ColorMask はビジュアルが描画された箇所のみに適用
    if (needsColorMask) {
      gl.stencilFunc(gl.EQUAL, 0x02, 0x02);
      gl.stencilMask(0x00);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      renderColorMask(ctx, colorMaskData!, worldRect, gl);
    }

    gl.disable(gl.STENCIL_TEST);
    gl.stencilMask(0xff);
  } else {
    // ステンシル不要 — 直接描画
    for (const comp of visuals) {
      renderVisualComponent(ctx, comp, worldRect, gl);
    }
  }
}

function renderVisualComponent(
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
  }
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
    const positions = cornersToTriangles(corners);
    gl.useProgram(ctx.solidProgram.program);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: positions },
    });
    twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
    twgl.setUniforms(ctx.solidProgram, { u_matrix: ctx.matrix, u_color: fillColor });
    twgl.drawBufferInfo(gl, bufferInfo);

    // 枠線（quads で strokeWidth を反映）
    if (data.strokeColor) {
      const strokeColor = parseColor(data.strokeColor);
      const sw = data.strokeWidth ?? 1;
      renderStrokeQuads(ctx, corners, sw, strokeColor, gl);
    }
  } else if (shapeType === 'ellipse') {
    renderEllipse(ctx, fillColor, rect, gl);

    // 楕円の枠線
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

    // Edge directions
    const d1x = curr[0] - prev[0], d1y = curr[1] - prev[1];
    const d2x = next[0] - curr[0], d2y = next[1] - curr[1];
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);
    if (len1 === 0 || len2 === 0) {
      outer.push([curr[0], curr[1]]);
      inner.push([curr[0], curr[1]]);
      continue;
    }

    // Outward normals (CW winding: rotate edge direction +90°)
    const n1x = d1y / len1, n1y = -d1x / len1;
    const n2x = d2y / len2, n2y = -d2x / len2;

    // Miter direction = average of two normals
    let mx = n1x + n2x, my = n1y + n2y;
    const mlen = Math.sqrt(mx * mx + my * my);
    if (mlen < 0.001) {
      // Degenerate — parallel edges, use single normal
      mx = n1x; my = n1y;
    } else {
      mx /= mlen; my /= mlen;
    }

    // Miter length: hw / dot(miter, normal)
    const dot = mx * n1x + my * n1y;
    const miterLen = dot > 0.1 ? hw / dot : hw;

    outer.push([curr[0] + mx * miterLen, curr[1] + my * miterLen]);
    inner.push([curr[0] - mx * miterLen, curr[1] - my * miterLen]);
  }

  // 8 triangles forming the frame: for each edge, 2 triangles between outer/inner
  const positions: number[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const o0 = outer[i]!, o1 = outer[j]!;
    const i0 = inner[i]!, i1 = inner[j]!;

    // Triangle 1: o0, o1, i0
    positions.push(o0[0], o0[1], o1[0], o1[1], i0[0], i0[1]);
    // Triangle 2: i0, o1, i1
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

/**
 * 楕円の枠線を描画する
 */
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

    // Triangle 1: outer1, outer2, inner1
    positions.push(rotX(ox1, oy1), rotY(ox1, oy1));
    positions.push(rotX(ox2, oy2), rotY(ox2, oy2));
    positions.push(rotX(ix1, iy1), rotY(ix1, iy1));

    // Triangle 2: inner1, outer2, inner2
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

// ──────────────────────────────────────────────
// Text renderer (Canvas2D → テクスチャ)
// ──────────────────────────────────────────────

/** テキストテクスチャのキャッシュキー生成 */
function textCacheKey(data: TextData, rect: WorldRect): string {
  return `text:${data.content}:${data.fontSize}:${data.color}:${data.align}:${data.verticalAlign}:${data.lineHeight}:${rect.w}:${rect.h}:${rect.scaleX}:${rect.scaleY}`;
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
// FillMask — ステンシル書き込み用（充填領域を描画）
// ──────────────────────────────────────────────

/**
 * FillMask の「充填済み」領域をステンシルバッファに書き込む。
 * カラー出力は行わない（colorMask = false で呼び出される）。
 */
function drawFillRegion(
  ctx: UIRendererContext,
  data: FillMaskData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const fillAmount = Math.max(0, Math.min(1, data.fillAmount ?? 1));
  const direction = data.direction ?? 'horizontal';
  const reverse = data.reverse ?? false;
  const corners = getWorldCorners(rect);

  let filledCorners: [number, number][];

  if (direction === 'horizontal') {
    if (reverse) {
      filledCorners = interpolateCorners(corners, direction, 1 - fillAmount, 1);
    } else {
      filledCorners = interpolateCorners(corners, direction, 0, fillAmount);
    }
  } else {
    if (reverse) {
      filledCorners = interpolateCorners(corners, direction, 1 - fillAmount, 1);
    } else {
      filledCorners = interpolateCorners(corners, direction, 0, fillAmount);
    }
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
