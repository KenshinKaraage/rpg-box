/**
 * Selection outline renderer — 選択オブジェクトの青枠を WebGL で描画
 */
import * as twgl from 'twgl.js';
import { resolveAllTransforms, getWorldCorners } from './transformResolver';
import type { EditorUIObject } from '@/stores/uiEditorSlice';
import type { UIRendererContext } from './UIRenderer';

/**
 * 選択中オブジェクトの矩形枠を青い線で描画（回転・スケール対応）
 */
export function renderSelectionOutlines(
  ctx: UIRendererContext,
  objects: EditorUIObject[],
  selectedObjectIds: string[],
  canvasWidth: number,
  canvasHeight: number
): void {
  if (selectedObjectIds.length === 0) return;

  const worldRects = resolveAllTransforms(objects, canvasWidth, canvasHeight);
  const { gl } = ctx;
  const linePositions: number[] = [];

  for (const id of selectedObjectIds) {
    const rect = worldRects.get(id);
    if (!rect) continue;

    const corners = getWorldCorners(rect);
    // corners: [topLeft, topRight, bottomRight, bottomLeft]
    for (let i = 0; i < 4; i++) {
      const a = corners[i]!;
      const b = corners[(i + 1) % 4]!;
      linePositions.push(a[0], a[1], b[0], b[1]);
    }
  }

  if (linePositions.length === 0) return;

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: new Float32Array(linePositions) },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, {
    u_matrix: ctx.matrix,
    u_color: [0.23, 0.51, 0.96, 0.9],
  });
  twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
}
