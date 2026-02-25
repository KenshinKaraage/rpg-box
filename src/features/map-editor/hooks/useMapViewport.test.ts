import { clampViewport, applyZoom } from './useMapViewport';

describe('clampViewport', () => {
  it('マップ外へのパンはキャンバス幅の50%まで許可する', () => {
    // canvas=200x200 → margin=100
    const result = clampViewport(
      { x: -9999, y: -9999, zoom: 1 },
      { w: 200, h: 200 },
      { w: 10, h: 10 },
      32
    );
    expect(result.x).toBeGreaterThanOrEqual(-100);
    expect(result.y).toBeGreaterThanOrEqual(-100);
  });

  it('マップ外への超過パンは制限される', () => {
    // canvas=200x200 → margin=100。x=-101 は -100 にクランプされる
    const result = clampViewport(
      { x: -9999, y: -9999, zoom: 1 },
      { w: 200, h: 200 },
      { w: 10, h: 10 },
      32
    );
    expect(result.x).toBe(-100);
    expect(result.y).toBe(-100);
  });
});

describe('applyZoom', () => {
  it('ズームイン後にズーム値が増加する', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 1 }, 1, 160, 80);
    expect(result.zoom).toBeGreaterThan(1);
  });

  it('ズームアウト後にズーム値が減少する', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 2 }, -1, 160, 80);
    expect(result.zoom).toBeLessThan(2);
  });

  it('最小ズーム0.25を下回らない', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 0.25 }, -1, 160, 80);
    expect(result.zoom).toBeGreaterThanOrEqual(0.25);
  });

  it('最大ズーム4を超えない', () => {
    const result = applyZoom({ x: 0, y: 0, zoom: 4 }, 1, 160, 80);
    expect(result.zoom).toBeLessThanOrEqual(4);
  });
});
