import { buildNavigationState, moveFocus, resolveCursorPosition } from './navigationResolver';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';
import type { WorldRect } from './transformResolver';

function makeNav(
  id: string,
  data: Record<string, unknown>,
  children: EditorUIObject[]
): { nav: EditorUIObject; all: EditorUIObject[] } {
  const nav: EditorUIObject = {
    id,
    name: id,
    transform: createDefaultRectTransform(),
    components: [{ type: 'navigation', data }],
  };
  const items = children.map((c) => ({ ...c, parentId: id }));
  return { nav, all: [nav, ...items] };
}

function makeItem(id: string): EditorUIObject {
  return {
    id,
    name: id,
    transform: createDefaultRectTransform(),
    components: [{ type: 'navigationItem', data: {} }],
  };
}

// ────────────────────────────────────────────────
// buildNavigationState
// ────────────────────────────────────────────────

describe('buildNavigationState', () => {
  it('builds state from navigation parent and items', () => {
    const { nav, all } = makeNav('nav1', { direction: 'vertical' }, [makeItem('a'), makeItem('b')]);
    const state = buildNavigationState(nav, all);

    expect(state).not.toBeNull();
    expect(state!.navigationId).toBe('nav1');
    expect(state!.items).toEqual(['a', 'b']);
    expect(state!.focusIndex).toBe(0);
    expect(state!.config.direction).toBe('vertical');
  });

  it('returns null when object has no navigation component', () => {
    const obj: EditorUIObject = {
      id: 'x',
      name: 'x',
      transform: createDefaultRectTransform(),
      components: [],
    };
    expect(buildNavigationState(obj, [obj])).toBeNull();
  });

  it('returns null when no navigation items exist', () => {
    const nav: EditorUIObject = {
      id: 'nav',
      name: 'nav',
      transform: createDefaultRectTransform(),
      components: [{ type: 'navigation', data: {} }],
    };
    expect(buildNavigationState(nav, [nav])).toBeNull();
  });

  it('clamps initialIndex to items length', () => {
    const { nav, all } = makeNav('nav1', { initialIndex: 10 }, [makeItem('a'), makeItem('b')]);
    const state = buildNavigationState(nav, all);
    expect(state!.focusIndex).toBe(1); // clamped to last item
  });

  it('ignores children without navigationItem component', () => {
    const plain: EditorUIObject = {
      id: 'plain',
      name: 'plain',
      transform: createDefaultRectTransform(),
      components: [],
    };
    const { nav, all } = makeNav('nav1', {}, [makeItem('a')]);
    all.push({ ...plain, parentId: 'nav1' });
    const state = buildNavigationState(nav, all);
    expect(state!.items).toEqual(['a']);
  });

  it('applies default config values', () => {
    const { nav, all } = makeNav('nav1', {}, [makeItem('a')]);
    const state = buildNavigationState(nav, all);
    expect(state!.config).toEqual({
      direction: 'vertical',
      wrap: false,
      initialIndex: 0,
      columns: 1,
    });
  });
});

// ────────────────────────────────────────────────
// moveFocus
// ────────────────────────────────────────────────

describe('moveFocus', () => {
  const verticalState = {
    navigationId: 'nav',
    items: ['a', 'b', 'c'],
    focusIndex: 1,
    config: { direction: 'vertical' as const, wrap: false, initialIndex: 0, columns: 1 },
  };

  it('moves down in vertical mode', () => {
    expect(moveFocus(verticalState, 'down')).toBe(2);
  });

  it('moves up in vertical mode', () => {
    expect(moveFocus(verticalState, 'up')).toBe(0);
  });

  it('ignores left/right in vertical mode', () => {
    expect(moveFocus(verticalState, 'left')).toBe(1);
    expect(moveFocus(verticalState, 'right')).toBe(1);
  });

  it('clamps at boundaries without wrap', () => {
    const atEnd = { ...verticalState, focusIndex: 2 };
    expect(moveFocus(atEnd, 'down')).toBe(2);

    const atStart = { ...verticalState, focusIndex: 0 };
    expect(moveFocus(atStart, 'up')).toBe(0);
  });

  it('wraps around with wrap enabled', () => {
    const wrapped = { ...verticalState, config: { ...verticalState.config, wrap: true } };
    const atEnd = { ...wrapped, focusIndex: 2 };
    expect(moveFocus(atEnd, 'down')).toBe(0);

    const atStart = { ...wrapped, focusIndex: 0 };
    expect(moveFocus(atStart, 'up')).toBe(2);
  });

  it('moves in horizontal mode', () => {
    const horizontal = {
      ...verticalState,
      config: { ...verticalState.config, direction: 'horizontal' as const },
    };
    expect(moveFocus(horizontal, 'right')).toBe(2);
    expect(moveFocus(horizontal, 'left')).toBe(0);
    expect(moveFocus(horizontal, 'up')).toBe(1); // ignored
  });

  it('moves in grid mode', () => {
    const grid = {
      navigationId: 'nav',
      items: ['a', 'b', 'c', 'd', 'e', 'f'],
      focusIndex: 1,
      config: { direction: 'grid' as const, wrap: false, initialIndex: 0, columns: 3 },
    };
    expect(moveFocus(grid, 'right')).toBe(2);
    expect(moveFocus(grid, 'left')).toBe(0);
    expect(moveFocus(grid, 'down')).toBe(4); // 1 + 3
    expect(moveFocus(grid, 'up')).toBe(0); // clamped: 1 - 3 = -2 → 0
  });

  it('returns 0 for empty items', () => {
    const empty = { ...verticalState, items: [] };
    expect(moveFocus(empty, 'down')).toBe(0);
  });
});

// ────────────────────────────────────────────────
// resolveCursorPosition
// ────────────────────────────────────────────────

describe('resolveCursorPosition', () => {
  it('applies offset to focused item position', () => {
    const cursor: EditorUIObject = {
      id: 'cursor',
      name: 'cursor',
      transform: createDefaultRectTransform(),
      components: [{ type: 'navigationCursor', data: { offsetX: -10, offsetY: 5 } }],
    };
    const rect: WorldRect = { x: 100, y: 200, w: 50, h: 30, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 };
    const pos = resolveCursorPosition(cursor, rect);
    expect(pos).toEqual({ x: 90, y: 205 });
  });

  it('defaults offset to 0', () => {
    const cursor: EditorUIObject = {
      id: 'cursor',
      name: 'cursor',
      transform: createDefaultRectTransform(),
      components: [{ type: 'navigationCursor', data: {} }],
    };
    const rect: WorldRect = { x: 50, y: 60, w: 40, h: 40, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 };
    const pos = resolveCursorPosition(cursor, rect);
    expect(pos).toEqual({ x: 50, y: 60 });
  });

  it('handles missing cursor component gracefully', () => {
    const cursor: EditorUIObject = {
      id: 'cursor',
      name: 'cursor',
      transform: createDefaultRectTransform(),
      components: [],
    };
    const rect: WorldRect = { x: 10, y: 20, w: 30, h: 30, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 };
    const pos = resolveCursorPosition(cursor, rect);
    expect(pos).toEqual({ x: 10, y: 20 });
  });
});
