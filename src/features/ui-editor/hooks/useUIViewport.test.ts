import { applyZoom } from './useUIViewport';
import type { UIEditorViewport } from '@/stores/uiEditorSlice';

describe('applyZoom', () => {
  const base: UIEditorViewport = { x: 0, y: 0, zoom: 1 };

  it('zooms in by ZOOM_STEP per delta', () => {
    const result = applyZoom(base, 1, 0, 0);
    expect(result.zoom).toBeCloseTo(1.1);
  });

  it('zooms out by ZOOM_STEP per delta', () => {
    const result = applyZoom(base, -1, 0, 0);
    expect(result.zoom).toBeCloseTo(0.9);
  });

  it('clamps to minimum zoom', () => {
    const low: UIEditorViewport = { x: 0, y: 0, zoom: 0.15 };
    const result = applyZoom(low, -1, 0, 0);
    expect(result.zoom).toBeCloseTo(0.1);
  });

  it('clamps to maximum zoom', () => {
    const high: UIEditorViewport = { x: 0, y: 0, zoom: 7.95 };
    const result = applyZoom(high, 1, 0, 0);
    expect(result.zoom).toBeCloseTo(8.0);
  });

  it('keeps world coordinate at pivot fixed', () => {
    const vp: UIEditorViewport = { x: 100, y: 50, zoom: 1 };
    const pivotX = 200;
    const pivotY = 150;

    // World coordinate at pivot before zoom
    const worldXBefore = (vp.x + pivotX) / vp.zoom;
    const worldYBefore = (vp.y + pivotY) / vp.zoom;

    const result = applyZoom(vp, 2, pivotX, pivotY);

    // World coordinate at pivot after zoom
    const worldXAfter = (result.x + pivotX) / result.zoom;
    const worldYAfter = (result.y + pivotY) / result.zoom;

    expect(worldXAfter).toBeCloseTo(worldXBefore);
    expect(worldYAfter).toBeCloseTo(worldYBefore);
  });

  it('returns same viewport when zoom is at limit', () => {
    const max: UIEditorViewport = { x: 0, y: 0, zoom: 8 };
    const result = applyZoom(max, 1, 0, 0);
    expect(result.zoom).toBe(8);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});
