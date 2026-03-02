import { instantiateObjects } from './useTemplateInstantiate';
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

describe('instantiateObjects', () => {
  it('generates new IDs for all objects', () => {
    const objects = [makeObject('a'), makeObject('b', 'a')];
    const result = instantiateObjects(objects, []);

    expect(result).toHaveLength(2);
    expect(result[0]!.id).not.toBe('a');
    expect(result[1]!.id).not.toBe('b');
  });

  it('remaps parentId references to new IDs', () => {
    const objects = [makeObject('root'), makeObject('child', 'root')];
    const result = instantiateObjects(objects, []);

    const root = result.find((o) => !o.parentId)!;
    const child = result.find((o) => o.parentId !== undefined)!;

    expect(child.parentId).toBe(root.id);
  });

  it('preserves hierarchy across multiple levels', () => {
    const objects = [
      makeObject('a'),
      makeObject('b', 'a'),
      makeObject('c', 'b'),
    ];
    const result = instantiateObjects(objects, []);

    const newA = result[0]!;
    const newB = result[1]!;
    const newC = result[2]!;

    expect(newA.parentId).toBeUndefined();
    expect(newB.parentId).toBe(newA.id);
    expect(newC.parentId).toBe(newB.id);
  });

  it('avoids ID conflicts with existing IDs', () => {
    const objects = [makeObject('a')];
    const existingIds = ['obj_1', 'obj_2'];
    const result = instantiateObjects(objects, existingIds);

    expect(existingIds).not.toContain(result[0]!.id);
  });

  it('deep copies objects (mutation safe)', () => {
    const objects = [makeObject('a', undefined, ['image'])];
    const result = instantiateObjects(objects, []);

    result[0]!.name = 'modified';
    result[0]!.components[0]!.data = { changed: true };

    expect(objects[0]!.name).toBe('a');
    expect((objects[0]!.components[0]!.data as Record<string, unknown>).foo).toBe('bar');
  });

  it('preserves transform and component data', () => {
    const objects = [makeObject('a', undefined, ['text', 'shape'])];
    objects[0]!.transform.x = 42;
    objects[0]!.transform.y = 99;

    const result = instantiateObjects(objects, []);

    expect(result[0]!.transform.x).toBe(42);
    expect(result[0]!.transform.y).toBe(99);
    expect(result[0]!.components).toHaveLength(2);
    expect(result[0]!.components[0]!.type).toBe('text');
  });

  it('handles empty input', () => {
    const result = instantiateObjects([], []);
    expect(result).toHaveLength(0);
  });

  it('generates unique IDs across all new objects', () => {
    const objects = [
      makeObject('a'),
      makeObject('b', 'a'),
      makeObject('c', 'a'),
    ];
    const result = instantiateObjects(objects, []);
    const ids = result.map((o) => o.id);
    expect(new Set(ids).size).toBe(3);
  });
});
