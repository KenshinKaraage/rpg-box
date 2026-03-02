import {
  screenToWorld,
  worldToScreen,
  hitTest,
  computeAbsolutePositions,
} from './useUISelection';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

function makeObject(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  parentId?: string
): EditorUIObject {
  return {
    id,
    name: id,
    parentId,
    transform: { ...createDefaultRectTransform(), x, y, width: w, height: h },
    components: [],
  };
}

// ────────────────────────────────────────────────
// screenToWorld / worldToScreen
// ────────────────────────────────────────────────

describe('screenToWorld', () => {
  it('converts with no offset and zoom=1', () => {
    const result = screenToWorld(100, 200, { x: 0, y: 0, zoom: 1 });
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('applies viewport offset', () => {
    const result = screenToWorld(100, 200, { x: 50, y: 30, zoom: 1 });
    expect(result).toEqual({ x: 150, y: 230 });
  });

  it('applies zoom', () => {
    const result = screenToWorld(100, 200, { x: 0, y: 0, zoom: 2 });
    expect(result).toEqual({ x: 50, y: 100 });
  });

  it('applies both offset and zoom', () => {
    const result = screenToWorld(100, 200, { x: 100, y: 100, zoom: 2 });
    expect(result).toEqual({ x: 100, y: 150 });
  });
});

describe('worldToScreen', () => {
  it('converts with no offset and zoom=1', () => {
    const result = worldToScreen(100, 200, { x: 0, y: 0, zoom: 1 });
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('is inverse of screenToWorld', () => {
    const viewport = { x: 50, y: 30, zoom: 2 };
    const world = screenToWorld(100, 200, viewport);
    const screen = worldToScreen(world.x, world.y, viewport);
    expect(screen.x).toBeCloseTo(100, 5);
    expect(screen.y).toBeCloseTo(200, 5);
  });
});

// ────────────────────────────────────────────────
// computeAbsolutePositions
// ────────────────────────────────────────────────

describe('computeAbsolutePositions', () => {
  it('returns object positions for root objects', () => {
    const objects = [makeObject('a', 10, 20, 50, 50)];
    const positions = computeAbsolutePositions(objects);
    expect(positions.get('a')).toEqual({ absX: 10, absY: 20 });
  });

  it('accumulates parent position for children', () => {
    const objects = [
      makeObject('p', 100, 200, 300, 300),
      makeObject('c', 10, 20, 50, 50, 'p'),
    ];
    const positions = computeAbsolutePositions(objects);
    expect(positions.get('c')).toEqual({ absX: 110, absY: 220 });
  });

  it('accumulates multiple levels of nesting', () => {
    const objects = [
      makeObject('g', 10, 10, 500, 500),
      makeObject('p', 20, 20, 300, 300, 'g'),
      makeObject('c', 5, 5, 50, 50, 'p'),
    ];
    const positions = computeAbsolutePositions(objects);
    expect(positions.get('c')).toEqual({ absX: 35, absY: 35 });
  });
});

// ────────────────────────────────────────────────
// hitTest
// ────────────────────────────────────────────────

describe('hitTest', () => {
  it('returns object id when click is inside bounds', () => {
    const objects = [makeObject('a', 10, 10, 100, 100)];
    expect(hitTest(objects, 50, 50)).toBe('a');
  });

  it('returns null when click is outside all objects', () => {
    const objects = [makeObject('a', 10, 10, 100, 100)];
    expect(hitTest(objects, 200, 200)).toBeNull();
  });

  it('returns front-most (last) object when overlapping', () => {
    const objects = [
      makeObject('back', 0, 0, 200, 200),
      makeObject('front', 50, 50, 100, 100),
    ];
    expect(hitTest(objects, 75, 75)).toBe('front');
  });

  it('returns null for empty object list', () => {
    expect(hitTest([], 50, 50)).toBeNull();
  });

  it('hits child object using accumulated position', () => {
    const objects = [
      makeObject('p', 100, 100, 200, 200),
      makeObject('c', 10, 10, 50, 50, 'p'),
    ];
    // pivot=0.5: parent bounds centered at (100,100) → (0,0)-(200,200)
    // child abs=(110,110), bounds centered → (85,85)-(135,135)
    expect(hitTest(objects, 120, 120)).toBe('c');
    expect(hitTest(objects, 50, 50)).toBe('p'); // In parent but not in child
  });

  it('respects scale for hit area', () => {
    const obj = makeObject('a', 10, 10, 100, 100);
    obj.transform.scaleX = 0.5;
    obj.transform.scaleY = 0.5;
    // Scaled dimensions: 50x50, pivot=0.5 → bounds centered at (10,10): (-15,-15)-(35,35)
    expect(hitTest([obj], 30, 30)).toBe('a');
    expect(hitTest([obj], 40, 40)).toBeNull();
  });
});
