/**
 * レンダラー共有ユーティリティ
 */

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

export function cornersToTriangles(corners: [number, number][]): Float32Array {
  return new Float32Array([
    corners[0]![0], corners[0]![1],
    corners[1]![0], corners[1]![1],
    corners[3]![0], corners[3]![1],
    corners[3]![0], corners[3]![1],
    corners[1]![0], corners[1]![1],
    corners[2]![0], corners[2]![1],
  ]);
}

export function lerp2d(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function interpolateCorners(
  corners: [number, number][],
  direction: 'horizontal' | 'vertical',
  tStart: number,
  tEnd: number
): [number, number][] {
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
