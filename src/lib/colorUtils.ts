/**
 * 色変換ユーティリティ
 *
 * RGB (0-255), HSV (h:0-360, s:0-1, v:0-1), Hex (#rrggbb / #rrggbbaa) 間の変換。
 */

// ──────────────────────────────────────────────
// RGB ↔ HSV
// ──────────────────────────────────────────────

export interface RGB {
  r: number; // 0-255
  g: number;
  b: number;
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

export function rgbToHsv(r: number, g: number, b: number): HSV {
  const r01 = r / 255;
  const g01 = g / 255;
  const b01 = b / 255;
  const max = Math.max(r01, g01, b01);
  const min = Math.min(r01, g01, b01);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r01) {
      h = ((g01 - b01) / d) % 6;
    } else if (max === g01) {
      h = (b01 - r01) / d + 2;
    } else {
      h = (r01 - g01) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function hsvToRgb(h: number, s: number, v: number): RGB {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r01 = 0,
    g01 = 0,
    b01 = 0;

  if (h < 60) {
    r01 = c; g01 = x; b01 = 0;
  } else if (h < 120) {
    r01 = x; g01 = c; b01 = 0;
  } else if (h < 180) {
    r01 = 0; g01 = c; b01 = x;
  } else if (h < 240) {
    r01 = 0; g01 = x; b01 = c;
  } else if (h < 300) {
    r01 = x; g01 = 0; b01 = c;
  } else {
    r01 = c; g01 = 0; b01 = x;
  }

  return {
    r: Math.round((r01 + m) * 255),
    g: Math.round((g01 + m) * 255),
    b: Math.round((b01 + m) * 255),
  };
}

// ──────────────────────────────────────────────
// Hex ↔ RGB
// ──────────────────────────────────────────────

export function hexToRgb(hex: string): RGB {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
    };
  }
  // 6 or 8 chars — take first 6
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

// ──────────────────────────────────────────────
// Hex with alpha (#rrggbbaa) split / merge
// ──────────────────────────────────────────────

/**
 * #rrggbb or #rrggbbaa を { hex6, alpha } に分離
 */
export function splitColorAlpha(value: string | undefined): { hex6: string; alpha: number } {
  if (!value || !value.startsWith('#')) return { hex6: '#ffffff', alpha: 1 };
  const h = value.slice(1);
  if (h.length === 8) {
    return {
      hex6: '#' + h.slice(0, 6),
      alpha: parseInt(h.slice(6, 8), 16) / 255,
    };
  }
  if (h.length === 6) {
    return { hex6: value, alpha: 1 };
  }
  if (h.length === 3) {
    return { hex6: '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2], alpha: 1 };
  }
  return { hex6: '#ffffff', alpha: 1 };
}

/**
 * hex6 (#rrggbb) + alpha (0-1) を結合。alpha=1 なら #rrggbb、それ以外は #rrggbbaa
 */
export function mergeColorAlpha(hex6: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  if (a === 255) return hex6;
  return hex6 + a.toString(16).padStart(2, '0');
}
