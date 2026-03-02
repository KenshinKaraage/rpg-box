import {
  resolveTransform,
  createRootRect,
  getWorldCorners,
  resolveAllTransforms,
  WorldRect,
} from './transformResolver';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { RectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

function makeObject(overrides: Partial<EditorUIObject> & { id: string }): EditorUIObject {
  return {
    name: 'test',
    transform: createDefaultRectTransform(),
    components: [],
    ...overrides,
  };
}

// ────────────────────────────────────────────────
// createRootRect
// ────────────────────────────────────────────────

describe('createRootRect', () => {
  it('creates a root rect centered on the canvas', () => {
    const root = createRootRect(1280, 720);
    expect(root.x).toBe(640);
    expect(root.y).toBe(360);
    expect(root.w).toBe(1280);
    expect(root.h).toBe(720);
    expect(root.rotation).toBe(0);
    expect(root.scaleX).toBe(1);
    expect(root.scaleY).toBe(1);
  });
});

// ────────────────────────────────────────────────
// resolveTransform
// ────────────────────────────────────────────────

describe('resolveTransform', () => {
  const root = createRootRect(1280, 720);

  it('places object at top-left with anchorX=left, anchorY=top', () => {
    const transform: RectTransform = {
      ...createDefaultRectTransform(),
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    };
    const result = resolveTransform(transform, root);
    // anchor at parent top-left = (0, 0), pivot at (0,0) offset
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.w).toBe(200);
    expect(result.h).toBe(100);
  });

  it('places object at center with anchorX=center, anchorY=center', () => {
    const transform: RectTransform = {
      ...createDefaultRectTransform(),
      anchorX: 'center',
      anchorY: 'center',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    const result = resolveTransform(transform, root);
    expect(result.x).toBe(640);
    expect(result.y).toBe(360);
  });

  it('applies x/y offset from anchor', () => {
    const transform: RectTransform = {
      ...createDefaultRectTransform(),
      x: 50,
      y: 30,
      width: 100,
      height: 100,
    };
    const result = resolveTransform(transform, root);
    expect(result.x).toBe(50);
    expect(result.y).toBe(30);
  });

  it('applies anchorX=right, anchorY=bottom', () => {
    const transform: RectTransform = {
      ...createDefaultRectTransform(),
      anchorX: 'right',
      anchorY: 'bottom',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    const result = resolveTransform(transform, root);
    expect(result.x).toBe(1280);
    expect(result.y).toBe(720);
  });

  it('accumulates rotation', () => {
    const parentRect: WorldRect = {
      x: 640,
      y: 360,
      w: 1280,
      h: 720,
      rotation: 45,
      scaleX: 1,
      scaleY: 1,
      pivotX: 0.5,
      pivotY: 0.5,
    };
    const transform: RectTransform = {
      ...createDefaultRectTransform(),
      anchorX: 'center',
      anchorY: 'center',
      rotation: 30,
    };
    const result = resolveTransform(transform, parentRect);
    expect(result.rotation).toBe(75);
  });

  it('accumulates scale', () => {
    const parentRect: WorldRect = {
      x: 640,
      y: 360,
      w: 1280,
      h: 720,
      rotation: 0,
      scaleX: 2,
      scaleY: 0.5,
      pivotX: 0.5,
      pivotY: 0.5,
    };
    const transform: RectTransform = {
      ...createDefaultRectTransform(),
      anchorX: 'center',
      anchorY: 'center',
      scaleX: 0.5,
      scaleY: 3,
    };
    const result = resolveTransform(transform, parentRect);
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1.5);
  });
});

// ────────────────────────────────────────────────
// getWorldCorners
// ────────────────────────────────────────────────

describe('getWorldCorners', () => {
  it('returns 4 corners for an unrotated rect', () => {
    const rect: WorldRect = { x: 100, y: 50, w: 200, h: 100, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 };
    const corners = getWorldCorners(rect);
    expect(corners).toHaveLength(4);
    // top-left
    expect(corners[0]![0]).toBe(0);
    expect(corners[0]![1]).toBe(0);
    // top-right
    expect(corners[1]![0]).toBe(200);
    expect(corners[1]![1]).toBe(0);
    // bottom-right
    expect(corners[2]![0]).toBe(200);
    expect(corners[2]![1]).toBe(100);
    // bottom-left
    expect(corners[3]![0]).toBe(0);
    expect(corners[3]![1]).toBe(100);
  });

  it('applies scale to corners', () => {
    const rect: WorldRect = { x: 100, y: 50, w: 100, h: 100, rotation: 0, scaleX: 2, scaleY: 2, pivotX: 0.5, pivotY: 0.5 };
    const corners = getWorldCorners(rect);
    // Half width = 100*2/2 = 100
    expect(corners[0]![0]).toBe(0);   // 100 - 100
    expect(corners[1]![0]).toBe(200); // 100 + 100
  });

  it('applies 90-degree rotation', () => {
    const rect: WorldRect = { x: 0, y: 0, w: 200, h: 100, rotation: 90, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 };
    const corners = getWorldCorners(rect);
    // After 90° rotation, top-left (-100, -50) becomes (50, -100)
    expect(corners[0]![0]).toBeCloseTo(50);
    expect(corners[0]![1]).toBeCloseTo(-100);
  });
});

// ────────────────────────────────────────────────
// resolveAllTransforms
// ────────────────────────────────────────────────

describe('resolveAllTransforms', () => {
  it('resolves an empty object list', () => {
    const result = resolveAllTransforms([], 1280, 720);
    expect(result.size).toBe(0);
  });

  it('resolves root-level objects', () => {
    const objects = [
      makeObject({ id: 'a', transform: { ...createDefaultRectTransform(), x: 10, y: 20 } }),
      makeObject({ id: 'b', transform: { ...createDefaultRectTransform(), x: 100, y: 200 } }),
    ];
    const result = resolveAllTransforms(objects, 1280, 720);
    expect(result.size).toBe(2);
    expect(result.get('a')!.x).toBe(10);
    expect(result.get('b')!.x).toBe(100);
  });

  it('resolves parent-child hierarchy', () => {
    const objects = [
      makeObject({
        id: 'parent',
        transform: {
          ...createDefaultRectTransform(),
          x: 100,
          y: 100,
          width: 400,
          height: 300,
        },
      }),
      makeObject({
        id: 'child',
        parentId: 'parent',
        transform: {
          ...createDefaultRectTransform(),
          anchorX: 'center',
          anchorY: 'center',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
        },
      }),
    ];
    const result = resolveAllTransforms(objects, 1280, 720);
    const parentRect = result.get('parent')!;
    const childRect = result.get('child')!;

    // Child is anchored to center of parent
    expect(childRect.x).toBe(parentRect.x);
    expect(childRect.y).toBe(parentRect.y);
  });

  it('resolves grandchild hierarchy', () => {
    const objects = [
      makeObject({
        id: 'root',
        transform: { ...createDefaultRectTransform(), x: 0, y: 0, width: 1280, height: 720 },
      }),
      makeObject({
        id: 'mid',
        parentId: 'root',
        transform: { ...createDefaultRectTransform(), x: 50, y: 50, width: 200, height: 200 },
      }),
      makeObject({
        id: 'leaf',
        parentId: 'mid',
        transform: { ...createDefaultRectTransform(), x: 10, y: 10, width: 50, height: 50 },
      }),
    ];
    const result = resolveAllTransforms(objects, 1280, 720);
    expect(result.size).toBe(3);
    const leafRect = result.get('leaf')!;
    // leaf.x = mid anchor(top-left of mid) + 10
    // mid position needs to be calculated first
    expect(leafRect).toBeDefined();
    expect(leafRect.w).toBe(50);
  });
});
