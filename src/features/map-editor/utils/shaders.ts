export const TILE_VERT = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
uniform mat4 u_matrix;
varying vec2 v_texcoord;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
`;

export const TILE_FRAG = `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;

export const GRID_VERT = `
attribute vec2 a_position;
uniform mat4 u_matrix;
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
}
`;

export const GRID_FRAG = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;
