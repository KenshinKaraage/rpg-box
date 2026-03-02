import { collectObjectTree } from './useTemplateSave';
import { createDefaultRectTransform } from '@/types/ui/UIComponent';
import type { EditorUIObject } from '@/stores/uiEditorSlice';

function makeObject(
  id: string,
  parentId?: string,
  componentTypes: string[] = []
): EditorUIObject {
  return {
    id,
    name: id,
    parentId,
    transform: { ...createDefaultRectTransform(), x: 10, y: 20 },
    components: componentTypes.map((type) => ({ type, data: { foo: 'bar' } })),
  };
}

describe('collectObjectTree', () => {
  it('collects a single root object', () => {
    const objects = [makeObject('a')];
    const result = collectObjectTree('a', objects);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('a');
    expect(result[0]!.parentId).toBeUndefined();
  });

  it('collects root and its children', () => {
    const objects = [
      makeObject('root'),
      makeObject('child1', 'root'),
      makeObject('child2', 'root'),
    ];
    const result = collectObjectTree('root', objects);
    expect(result).toHaveLength(3);
    expect(result.map((o) => o.id).sort()).toEqual(['child1', 'child2', 'root']);
  });

  it('collects nested children (grandchildren)', () => {
    const objects = [
      makeObject('root'),
      makeObject('child', 'root'),
      makeObject('grandchild', 'child'),
    ];
    const result = collectObjectTree('root', objects);
    expect(result).toHaveLength(3);
    const gc = result.find((o) => o.id === 'grandchild');
    expect(gc?.parentId).toBe('child');
  });

  it('removes parentId from root only', () => {
    const objects = [
      makeObject('parent'),
      makeObject('root', 'parent'),
      makeObject('child', 'root'),
    ];
    const result = collectObjectTree('root', objects);
    expect(result).toHaveLength(2); // root + child, not parent
    const root = result.find((o) => o.id === 'root');
    const child = result.find((o) => o.id === 'child');
    expect(root?.parentId).toBeUndefined();
    expect(child?.parentId).toBe('root');
  });

  it('excludes sibling objects not in the subtree', () => {
    const objects = [
      makeObject('root'),
      makeObject('child', 'root'),
      makeObject('sibling'),
    ];
    const result = collectObjectTree('root', objects);
    expect(result).toHaveLength(2);
    expect(result.find((o) => o.id === 'sibling')).toBeUndefined();
  });

  it('deep copies objects (mutation safe)', () => {
    const objects = [makeObject('a', undefined, ['image'])];
    const result = collectObjectTree('a', objects);
    // Mutating result should not affect original
    result[0]!.name = 'modified';
    result[0]!.components[0]!.data = { changed: true };
    expect(objects[0]!.name).toBe('a');
    expect((objects[0]!.components[0]!.data as Record<string, unknown>).foo).toBe('bar');
  });

  it('preserves component data in copies', () => {
    const objects = [makeObject('a', undefined, ['text', 'shape'])];
    const result = collectObjectTree('a', objects);
    expect(result[0]!.components).toHaveLength(2);
    expect(result[0]!.components[0]!.type).toBe('text');
    expect(result[0]!.components[1]!.type).toBe('shape');
  });

  it('returns empty array for non-existent root', () => {
    const objects = [makeObject('a')];
    const result = collectObjectTree('nonexistent', objects);
    expect(result).toHaveLength(0);
  });
});
