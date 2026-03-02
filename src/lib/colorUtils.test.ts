import {
  rgbToHsv,
  hsvToRgb,
  hexToRgb,
  rgbToHex,
  splitColorAlpha,
  mergeColorAlpha,
} from './colorUtils';

describe('rgbToHsv / hsvToRgb round-trip', () => {
  const cases: [number, number, number][] = [
    [255, 0, 0],     // red
    [0, 255, 0],     // green
    [0, 0, 255],     // blue
    [255, 255, 0],   // yellow
    [0, 255, 255],   // cyan
    [255, 0, 255],   // magenta
    [255, 255, 255], // white
    [0, 0, 0],       // black
    [128, 128, 128], // gray
    [64, 128, 192],  // arbitrary
  ];

  it.each(cases)('round-trips (%i, %i, %i)', (r, g, b) => {
    const hsv = rgbToHsv(r, g, b);
    const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    expect(rgb.r).toBeCloseTo(r, 0);
    expect(rgb.g).toBeCloseTo(g, 0);
    expect(rgb.b).toBeCloseTo(b, 0);
  });
});

describe('rgbToHsv', () => {
  it('red is h=0, s=1, v=1', () => {
    const hsv = rgbToHsv(255, 0, 0);
    expect(hsv.h).toBeCloseTo(0);
    expect(hsv.s).toBeCloseTo(1);
    expect(hsv.v).toBeCloseTo(1);
  });

  it('black is s=0, v=0', () => {
    const hsv = rgbToHsv(0, 0, 0);
    expect(hsv.s).toBe(0);
    expect(hsv.v).toBe(0);
  });

  it('white is s=0, v=1', () => {
    const hsv = rgbToHsv(255, 255, 255);
    expect(hsv.s).toBe(0);
    expect(hsv.v).toBeCloseTo(1);
  });
});

describe('hexToRgb', () => {
  it('parses 6-char hex', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
  });

  it('parses 3-char hex', () => {
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parses 8-char hex (ignores alpha)', () => {
    expect(hexToRgb('#ff800080')).toEqual({ r: 255, g: 128, b: 0 });
  });

  it('handles without #', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });
});

describe('rgbToHex', () => {
  it('converts RGB to hex', () => {
    expect(rgbToHex(255, 128, 0)).toBe('#ff8000');
  });

  it('pads single-digit values', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('clamps out-of-range values', () => {
    expect(rgbToHex(300, -10, 128)).toBe('#ff0080');
  });
});

describe('hexToRgb / rgbToHex round-trip', () => {
  it('round-trips #ff8000', () => {
    const rgb = hexToRgb('#ff8000');
    expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe('#ff8000');
  });
});

describe('splitColorAlpha', () => {
  it('splits 6-char hex', () => {
    expect(splitColorAlpha('#ff8000')).toEqual({ hex6: '#ff8000', alpha: 1 });
  });

  it('splits 8-char hex', () => {
    const result = splitColorAlpha('#ff800080');
    expect(result.hex6).toBe('#ff8000');
    expect(result.alpha).toBeCloseTo(128 / 255);
  });

  it('splits 3-char hex', () => {
    expect(splitColorAlpha('#f80')).toEqual({ hex6: '#ff8800', alpha: 1 });
  });

  it('defaults for undefined', () => {
    expect(splitColorAlpha(undefined)).toEqual({ hex6: '#ffffff', alpha: 1 });
  });

  it('defaults for invalid', () => {
    expect(splitColorAlpha('invalid')).toEqual({ hex6: '#ffffff', alpha: 1 });
  });
});

describe('mergeColorAlpha', () => {
  it('returns hex6 when alpha is 1', () => {
    expect(mergeColorAlpha('#ff8000', 1)).toBe('#ff8000');
  });

  it('appends alpha hex when alpha < 1', () => {
    expect(mergeColorAlpha('#ff8000', 0.5)).toBe('#ff800080');
  });

  it('appends 00 for alpha = 0', () => {
    expect(mergeColorAlpha('#ff8000', 0)).toBe('#ff800000');
  });

  it('clamps alpha > 1', () => {
    expect(mergeColorAlpha('#ff8000', 1.5)).toBe('#ff8000');
  });

  it('clamps alpha < 0', () => {
    expect(mergeColorAlpha('#ff8000', -0.5)).toBe('#ff800000');
  });
});
