import { parseColor } from './UIRenderer';

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    const [r, g, b, a] = parseColor('#ff0000');
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
    expect(a).toBeCloseTo(1);
  });

  it('parses 3-digit hex', () => {
    const [r, g, b, a] = parseColor('#f00');
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
    expect(a).toBeCloseTo(1);
  });

  it('parses 8-digit hex with alpha', () => {
    const [r, g, b, a] = parseColor('#ff000080');
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
    expect(a).toBeCloseTo(0.502, 1);
  });

  it('parses white', () => {
    const [r, g, b, a] = parseColor('#ffffff');
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(1);
    expect(b).toBeCloseTo(1);
    expect(a).toBeCloseTo(1);
  });

  it('parses black', () => {
    const [r, g, b, a] = parseColor('#000000');
    expect(r).toBeCloseTo(0);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0);
    expect(a).toBeCloseTo(1);
  });

  it('returns white for invalid color', () => {
    const result = parseColor('invalid');
    expect(result).toEqual([1, 1, 1, 1]);
  });

  it('parses mid-gray', () => {
    const [r, g, b] = parseColor('#808080');
    expect(r).toBeCloseTo(0.502, 1);
    expect(g).toBeCloseTo(0.502, 1);
    expect(b).toBeCloseTo(0.502, 1);
  });
});
