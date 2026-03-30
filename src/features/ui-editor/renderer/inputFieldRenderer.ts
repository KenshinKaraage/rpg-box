/**
 * InputField renderer — カーソル矩形のみ描画
 *
 * TextComponent と同じフォントで measureText してカーソルX位置を計算し、
 * 2px 幅の矩形を WebGL で描画する。テキスト描画は TextComponent が担当。
 */
import * as twgl from 'twgl.js';
import type { WorldRect } from './transformResolver';
import type { UIRendererContext } from './UIRenderer';
import { parseColor } from './renderUtils';

export interface InputFieldData {
  cursorPos?: number;
  cursorColor?: string;
  fontSize?: number;
  currentText?: string;
}

export function renderInputField(
  ctx: UIRendererContext,
  data: InputFieldData,
  rect: WorldRect,
  gl: WebGLRenderingContext
): void {
  const cursorPos = data.cursorPos ?? -1;
  if (cursorPos < 0) return; // カーソル非表示

  const text = data.currentText ?? '';
  const fontSize = data.fontSize ?? 24;
  const cursorColor = data.cursorColor ?? '#ffdd44';

  // Canvas2D で measureText してカーソルX位置を計算
  const measureCanvas = getMeasureCanvas();
  measureCanvas.font = `${fontSize}px sans-serif`;
  const textBeforeCursor = text.substring(0, cursorPos);
  const cursorX = measureCanvas.measureText(textBeforeCursor).width;

  // TextComponent のパディング（textRenderer と同じ値を使う）
  // textRenderer は padding なしで描画するため、rect の左端からの相対位置
  const padding = 0;

  // カーソル矩形のワールド座標を計算
  const cursorWidth = 2;
  const cursorHeight = fontSize;

  // rect 内でのカーソル位置（左上基準）
  const localX = padding + cursorX;
  const localY = (rect.h - cursorHeight) / 2;

  // ワールド座標に変換（回転なしの簡易版、pivot考慮）
  // WorldRect.x/y はピボット位置。左上は x - w*pivotX 的だが、
  // ここでは簡易的に rect.x が左上と仮定（textRenderer と同様）
  const worldX = rect.x + localX;
  const worldY = rect.y + localY;

  const color = parseColor(cursorColor);
  color[3] = 1;

  // flat-color quad で描画
  const x0 = worldX;
  const y0 = worldY;
  const x1 = worldX + cursorWidth;
  const y1 = worldY + cursorHeight;

  const positions = new Float32Array([
    x0, y0, x1, y0, x0, y1,
    x0, y1, x1, y0, x1, y1,
  ]);

  gl.useProgram(ctx.solidProgram.program);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: positions },
  });
  twgl.setBuffersAndAttributes(gl, ctx.solidProgram, bufferInfo);
  twgl.setUniforms(ctx.solidProgram, {
    u_matrix: ctx.matrix,
    u_color: color,
  });
  twgl.drawBufferInfo(gl, bufferInfo);
}

// measureText 用のオフスクリーン context（再利用）
let _measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCanvas(): CanvasRenderingContext2D {
  if (!_measureCtx) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    _measureCtx = c.getContext('2d')!;
  }
  return _measureCtx;
}
