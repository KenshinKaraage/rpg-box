import {
  screenToWorld,
  worldToScreen,
  hitTest,
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
// hitTest (uses resolveAllTransforms internally)
// ────────────────────────────────────────────────

const CW = 800;
const CH = 600;

describe('hitTest', () => {
  it('returns object id when click is inside bounds', () => {
    const objects = [makeObject('a', 10, 10, 100, 100)];
    // resolveAllTransforms: default anchor=left/top → anchorWorld=(0,0)
    // pivot at (10,10), bounds (-40,-40)-(60,60)
    expect(hitTest(objects, 10, 10, CW, CH)).toBe('a');
  });

  it('returns null when click is outside all objects', () => {
    const objects = [makeObject('a', 10, 10, 100, 100)];
    // bounds (-40,-40)-(60,60), so (200,200) is outside
    expect(hitTest(objects, 200, 200, CW, CH)).toBeNull();
  });

  it('returns front-most (last) object when overlapping', () => {
    const objects = [
      makeObject('back', 0, 0, 200, 200),
      makeObject('front', 0, 0, 100, 100),
    ];
    // both centered at (0,0): back bounds (-100,-100)-(100,100), front bounds (-50,-50)-(50,50)
    expect(hitTest(objects, 0, 0, CW, CH)).toBe('front');
  });

  it('returns null for empty object list', () => {
    expect(hitTest([], 50, 50, CW, CH)).toBeNull();
  });
});
