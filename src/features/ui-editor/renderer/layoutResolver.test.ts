import { applyLayoutOverrides } from './layoutResolver';
import { LayoutGroupComponent } from '@/types/ui/components/LayoutGroupComponent';
import { GridLayoutComponent } from '@/types/ui/components/GridLayoutComponent';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

// Aliases for the static methods (replacing old exports)
const resolveLayoutGroup = LayoutGroupComponent.alignChildren;
const resolveGridLayout = GridLayoutComponent.alignChildren;

function makeChild(
  id: string,
  w: number,
  h: number,
  components: EditorUIObject['components'] = []
): EditorUIObject {
  return {
    id,
    name: id,
    transform: { ...createDefaultRectTransform(), width: w, height: h },
    components,
  };
}

// ────────────────────────────────────────────────
// resolveLayoutGroup
// ────────────────────────────────────────────────

describe('resolveLayoutGroup', () => {
  it('lays out children vertically with spacing', () => {
    const children = [makeChild('a', 100, 40), makeChild('b', 100, 60), makeChild('c', 100, 30)];
    const result = resolveLayoutGroup(children, { direction: 'vertical', spacing: 10 }, 200, 400);

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.get('b')).toEqual({ x: 0, y: 50 }); // 40 + 10
    expect(result.get('c')).toEqual({ x: 0, y: 120 }); // 50 + 60 + 10
  });

  it('lays out children horizontally', () => {
    const children = [makeChild('a', 80, 50), makeChild('b', 60, 50)];
    const result = resolveLayoutGroup(children, { direction: 'horizontal', spacing: 5 }, 300, 100);

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.get('b')).toEqual({ x: 85, y: 0 }); // 80 + 5
  });

  it('aligns children to center (vertical)', () => {
    const children = [makeChild('a', 60, 40)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'vertical', alignment: 'center' },
      200,
      400
    );

    expect(result.get('a')).toEqual({ x: 70, y: 0 }); // (200 - 60) / 2
  });

  it('aligns children to end (vertical)', () => {
    const children = [makeChild('a', 60, 40)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'vertical', alignment: 'end' },
      200,
      400
    );

    expect(result.get('a')).toEqual({ x: 140, y: 0 }); // 200 - 60
  });

  it('reverses order', () => {
    const children = [makeChild('a', 100, 30), makeChild('b', 100, 50)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'vertical', reverseOrder: true, spacing: 0 },
      100,
      200
    );

    // Reversed: b comes first, then a
    expect(result.get('b')).toEqual({ x: 0, y: 0 });
    expect(result.get('a')).toEqual({ x: 0, y: 50 });
  });

  it('handles empty children', () => {
    const result = resolveLayoutGroup([], {}, 100, 100);
    expect(result.size).toBe(0);
  });

  it('skips children with layoutElement participate=false', () => {
    const children = [
      makeChild('a', 100, 40),
      makeChild('cursor', 20, 40, [{ type: 'layoutElement', data: { participate: false } }]),
      makeChild('b', 100, 60),
    ];
    const result = resolveLayoutGroup(children, { direction: 'vertical', spacing: 10 }, 200, 400);

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.has('cursor')).toBe(false); // excluded
    expect(result.get('b')).toEqual({ x: 0, y: 50 }); // 40 + 10 (no gap for cursor)
  });

  it('applies padding to layout start position and alignment area', () => {
    const children = [makeChild('a', 100, 40), makeChild('b', 100, 60)];
    const result = resolveLayoutGroup(
      children,
      {
        direction: 'vertical',
        spacing: 5,
        paddingTop: 10,
        paddingLeft: 20,
      },
      300,
      400
    );

    expect(result.get('a')).toEqual({ x: 20, y: 10 }); // paddingLeft, paddingTop
    expect(result.get('b')).toEqual({ x: 20, y: 55 }); // 10 + 40 + 5
  });

  it('adds extra space from layoutElement space property', () => {
    const children = [
      makeChild('a', 100, 40, [{ type: 'layoutElement', data: { participate: true, space: 20 } }]),
      makeChild('b', 100, 40),
    ];
    const result = resolveLayoutGroup(children, { direction: 'vertical', spacing: 5 }, 200, 400);

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.get('b')).toEqual({ x: 0, y: 65 }); // 40 + 5 (spacing) + 20 (extra space)
  });
  it('justify center (vertical) offsets children on main axis', () => {
    // Parent 400 tall, children total 40+10+60=110, offset=(400-110)/2=145
    const children = [makeChild('a', 100, 40), makeChild('b', 100, 60)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'vertical', spacing: 10, justify: 'center' },
      200,
      400
    );

    expect(result.get('a')).toEqual({ x: 0, y: 145 });
    expect(result.get('b')).toEqual({ x: 0, y: 195 }); // 145 + 40 + 10
  });

  it('justify end (vertical) pushes children to bottom', () => {
    const children = [makeChild('a', 100, 40), makeChild('b', 100, 60)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'vertical', spacing: 10, justify: 'end' },
      200,
      400
    );

    // total=110, offset=400-110=290
    expect(result.get('a')).toEqual({ x: 0, y: 290 });
    expect(result.get('b')).toEqual({ x: 0, y: 340 });
  });

  it('justify center (horizontal) centers children horizontally', () => {
    // Parent 400 wide, children total 80+10+60=150, offset=(400-150)/2=125
    const children = [makeChild('a', 80, 50), makeChild('b', 60, 50)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'horizontal', spacing: 10, justify: 'center' },
      400,
      100
    );

    expect(result.get('a')).toEqual({ x: 125, y: 0 });
    expect(result.get('b')).toEqual({ x: 215, y: 0 }); // 125 + 80 + 10
  });

  it('justify end (horizontal) pushes children to right', () => {
    const children = [makeChild('a', 80, 50), makeChild('b', 60, 50)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'horizontal', spacing: 10, justify: 'end' },
      400,
      100
    );

    // total=150, offset=400-150=250
    expect(result.get('a')).toEqual({ x: 250, y: 0 });
    expect(result.get('b')).toEqual({ x: 340, y: 0 });
  });

  it('justify center + alignment center (vertical) centers both axes', () => {
    const children = [makeChild('a', 60, 40)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'vertical', alignment: 'center', justify: 'center' },
      200,
      400
    );

    // x = (200-60)/2 = 70, y = (400-40)/2 = 180
    expect(result.get('a')).toEqual({ x: 70, y: 180 });
  });

  it('justify center + alignment center (horizontal) centers both axes', () => {
    const children = [makeChild('a', 80, 30)];
    const result = resolveLayoutGroup(
      children,
      { direction: 'horizontal', alignment: 'center', justify: 'center' },
      400,
      200
    );

    // x = (400-80)/2 = 160, y = (200-30)/2 = 85
    expect(result.get('a')).toEqual({ x: 160, y: 85 });
  });
});

// ────────────────────────────────────────────────
// resolveGridLayout
// ────────────────────────────────────────────────

describe('resolveGridLayout', () => {
  it('arranges children in a 2-column grid', () => {
    const children = [
      makeChild('a', 50, 50),
      makeChild('b', 50, 50),
      makeChild('c', 50, 50),
      makeChild('d', 50, 50),
    ];
    const result = resolveGridLayout(children, { columns: 2, spacingX: 10, spacingY: 10 });

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.get('b')).toEqual({ x: 60, y: 0 }); // 50 + 10
    expect(result.get('c')).toEqual({ x: 0, y: 60 });
    expect(result.get('d')).toEqual({ x: 60, y: 60 });
  });

  it('uses cellWidth/cellHeight when specified', () => {
    const children = [makeChild('a', 30, 30), makeChild('b', 30, 30), makeChild('c', 30, 30)];
    const result = resolveGridLayout(children, {
      columns: 2,
      cellWidth: 100,
      cellHeight: 80,
      spacingX: 5,
      spacingY: 5,
    });

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.get('b')).toEqual({ x: 105, y: 0 }); // 100 + 5
    expect(result.get('c')).toEqual({ x: 0, y: 85 }); // 80 + 5
  });

  it('handles single column', () => {
    const children = [makeChild('a', 50, 50), makeChild('b', 50, 50)];
    const result = resolveGridLayout(children, { columns: 1, spacingY: 10 });

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.get('b')).toEqual({ x: 0, y: 60 });
  });

  it('handles empty children', () => {
    const result = resolveGridLayout([], { columns: 3 });
    expect(result.size).toBe(0);
  });

  it('skips children with layoutElement participate=false', () => {
    const children = [
      makeChild('a', 50, 50),
      makeChild('skip', 50, 50, [{ type: 'layoutElement', data: { participate: false } }]),
      makeChild('b', 50, 50),
    ];
    const result = resolveGridLayout(children, { columns: 2, spacingX: 10 });

    expect(result.get('a')).toEqual({ x: 0, y: 0 });
    expect(result.has('skip')).toBe(false);
    expect(result.get('b')).toEqual({ x: 60, y: 0 }); // second slot in row 0
  });
});

// ────────────────────────────────────────────────
// applyLayoutOverrides
// ────────────────────────────────────────────────

describe('applyLayoutOverrides', () => {
  it('applies layout overrides from parent LayoutGroup', () => {
    const parent: EditorUIObject = {
      id: 'parent',
      name: 'parent',
      transform: { ...createDefaultRectTransform(), width: 300, height: 400 },
      components: [{ type: 'layoutGroup', data: { direction: 'vertical', spacing: 10 } }],
    };
    const childA: EditorUIObject = {
      id: 'a',
      name: 'a',
      parentId: 'parent',
      transform: { ...createDefaultRectTransform(), width: 100, height: 50 },
      components: [],
    };
    const childB: EditorUIObject = {
      id: 'b',
      name: 'b',
      parentId: 'parent',
      transform: { ...createDefaultRectTransform(), width: 100, height: 30 },
      components: [],
    };

    const overrides = applyLayoutOverrides([parent, childA, childB]);
    expect(overrides.get('a')).toEqual({ x: 0, y: 0 });
    expect(overrides.get('b')).toEqual({ x: 0, y: 60 }); // 50 + 10
  });

  it('applies grid layout overrides', () => {
    const parent: EditorUIObject = {
      id: 'parent',
      name: 'parent',
      transform: { ...createDefaultRectTransform(), width: 400, height: 400 },
      components: [{ type: 'gridLayout', data: { columns: 2, spacingX: 5, spacingY: 5 } }],
    };
    const children = ['a', 'b', 'c'].map((id) => ({
      id,
      name: id,
      parentId: 'parent',
      transform: { ...createDefaultRectTransform(), width: 50, height: 50 },
      components: [],
    }));

    const overrides = applyLayoutOverrides([parent, ...children]);
    expect(overrides.get('a')).toEqual({ x: 0, y: 0 });
    expect(overrides.get('b')).toEqual({ x: 55, y: 0 });
    expect(overrides.get('c')).toEqual({ x: 0, y: 55 });
  });

  it('returns empty map when no layout components', () => {
    const objects = [makeChild('a', 100, 100)];
    const overrides = applyLayoutOverrides(objects);
    expect(overrides.size).toBe(0);
  });
});
