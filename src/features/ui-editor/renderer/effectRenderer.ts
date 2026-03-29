/**
 * Effect renderer — スプライトシートの一部を切り出して描画
 *
 * EffectComponent の cropX/Y/W/H に基づいて UV を計算し、
 * 指定フレームをテクスチャから切り出して描画する。
 */
import * as twgl from 'twgl.js';
import { getWorldCorners } from './transformResolver';
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { parseColor, cornersToTriangles } from './renderUtils';

export interface EffectData {
  effectId?: string;
  cropX?: number;
  cropY?: number;
  cropW?: number;
  cropH?: number;
  opacity?: number;
  tint?: string;
}

export function renderEffect(
  ctx: UIRendererContext,
  data: EffectData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  if (!data.effectId) return;

  // テクスチャ取得（imageRenderer と同じキャッシュを共有）
  const texture = ctx.textureCache.get(data.effectId);
  if (!texture) {
    const assetData = ctx.getAssetData(data.effectId);
    if (!assetData) return;

    const img = new Image();
    img.src = assetData;
    img.onload = () => {
      const tex = twgl.createTexture(gl, {
        src: img,
        minMag: gl.LINEAR,
      });
      ctx.textureCache.set(data.effectId!, tex);
      ctx.imageSizeCache.set(data.effectId!, { w: img.naturalWidth, h: img.naturalHeight });
      ctx.onTextureLoaded();
    };
    return;
  }

  const imgSize = ctx.imageSizeCache.get(data.effectId);
  if (!imgSize) return;

  const opacity = data.opacity ?? 1;
  const tint = data.tint ? parseColor(data.tint) : [1, 1, 1, 1];
  tint[3] = opacity;

  // UV 計算: crop が指定されていればその範囲、なければ全体
  let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
  if (data.cropW && data.cropW > 0 && data.cropH && data.cropH > 0) {
    u0 = (data.cropX ?? 0) / imgSize.w;
    v0 = (data.cropY ?? 0) / imgSize.h;
    u1 = u0 + data.cropW / imgSize.w;
    v1 = v0 + data.cropH / imgSize.h;
  }

  const corners = getWorldCorners(rect);
  const positions = cornersToTriangles(corners);
  const texcoords = new Float32Array([
    u0, v0, u1, v0, u0, v1,
    u0, v1, u1, v0, u1, v1,
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
