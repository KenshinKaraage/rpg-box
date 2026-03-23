/**
 * UIRenderer — WebGL 描画パイプラインのコアディスパッチ
 *
 * UIObject ツリーを走査し、各コンポーネントに応じた描画を行う。
 * FillMask/ColorMask はステンシルバッファによる正確なマスキングを行う。
 *
 * コンポーネント別の描画ロジックは個別レンダラーに分離:
 *   shapeRenderer, imageRenderer, textRenderer, fillMaskRenderer, colorMaskRenderer
 */
import * as twgl from 'twgl.js';
import type { EditorUIObject, SerializedUIComponent } from '@/stores/uiEditorSlice';
import { resolveAllTransforms } from './transformResolver';
import type { WorldRect } from './transformResolver';
import { SOLID_VERT, SOLID_FRAG, TEXTURED_VERT, TEXTURED_FRAG } from '../utils/shaders';
import { renderShape } from './shapeRenderer';
import type { ShapeData } from './shapeRenderer';
import { renderLine } from './lineRenderer';
import type { LineData } from './lineRenderer';
import { renderImage } from './imageRenderer';
import type { ImageData } from './imageRenderer';
import { renderText } from './textRenderer';
import type { TextData } from './textRenderer';
import { drawFillRegion } from './fillMaskRenderer';
import type { FillMaskData } from './fillMaskRenderer';
import { renderColorMask } from './colorMaskRenderer';
import type { ColorMaskData } from './colorMaskRenderer';

// Re-exports for external consumers
export { parseColor } from './renderUtils';
export { renderNineSliceGuides } from './imageRenderer';
export { renderSelectionOutlines } from './selectionRenderer';

export interface UIRendererContext {
  gl: WebGLRenderingContext;
  solidProgram: twgl.ProgramInfo;
  texturedProgram: twgl.ProgramInfo;
  matrix: twgl.m4.Mat4;
  textureCache: Map<string, WebGLTexture>;
  /** 画像のネイティブサイズキャッシュ (imageId → { w, h }) */
  imageSizeCache: Map<string, { w: number; h: number }>;
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
      if (child.transform.visible === false) continue;
      order.push(child.id);
      traverse(child.id);
    }
  }

  traverse(undefined);
  return order;
}

// ──────────────────────────────────────────────
// Per-object rendering with stencil masking
// ──────────────────────────────────────────────

function renderObject(
  ctx: UIRendererContext,
  obj: EditorUIObject,
  worldRect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const fillMaskComp = obj.components.find((c) => c.type === 'fillMask');
  const colorMaskComp = obj.components.find((c) => c.type === 'colorMask');
  const visuals = obj.components.filter(
    (c) => c.type === 'shape' || c.type === 'line' || c.type === 'image' || c.type === 'text'
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
    case 'line':
      renderLine(ctx, comp.data as LineData, worldRect, gl);
      break;
    case 'image':
      renderImage(ctx, comp.data as ImageData, worldRect, gl);
      break;
    case 'text':
      renderText(ctx, comp.data as TextData, worldRect, gl);
      break;
  }
}
