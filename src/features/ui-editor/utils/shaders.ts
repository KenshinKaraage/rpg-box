/**
 * UIエディタ用 WebGL シェーダー
 */

/** 単色描画 — 頂点シェーダー */
export const SOLID_VERT = `
attribute vec2 a_position;
uniform mat4 u_matrix;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
}
`;

/** 単色描画 — フラグメントシェーダー */
export const SOLID_FRAG = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;

/** テクスチャ描画 — 頂点シェーダー */
export const TEXTURED_VERT = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
uniform mat4 u_matrix;
varying vec2 v_texcoord;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
`;

/** テクスチャ描画 — フラグメントシェーダー */
export const TEXTURED_FRAG = `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform vec4 u_tint;
void main() {
  vec4 texColor = texture2D(u_texture, v_texcoord);
  gl_FragColor = texColor * u_tint;
}
`;
