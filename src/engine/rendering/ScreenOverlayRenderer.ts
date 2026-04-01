/**
 * 画面全体を覆うカラーオーバーレイ（フェード/フラッシュ用）
 */

import * as twgl from 'twgl.js';

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;

// NDC full-screen quad (-1 to 1)
const QUAD = new Float32Array([
  -1, -1, 1, -1, -1, 1,
  1, -1, 1, 1, -1, 1,
]);

export class ScreenOverlayRenderer {
  private programInfo: twgl.ProgramInfo;
  private bufferInfo: twgl.BufferInfo;

  constructor(gl: WebGLRenderingContext) {
    this.programInfo = twgl.createProgramInfo(gl, [VERT, FRAG]);
    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { numComponents: 2, data: QUAD },
    });
  }

  /** RGBA (0-1) でオーバーレイを描画。alpha=0 なら何もしない */
  render(gl: WebGLRenderingContext, r: number, g: number, b: number, a: number): void {
    if (a <= 0) return;
    gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
    twgl.setUniforms(this.programInfo, { u_color: [r, g, b, a] });
    twgl.drawBufferInfo(gl, this.bufferInfo);
  }
}
