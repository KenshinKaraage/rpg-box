// Mock the panel to break the circular import chain
// ColliderComponent.tsx → ColliderPropertyPanel → useStore → register → ColliderComponent
jest.mock('@/features/map-editor/components/panels/ColliderPropertyPanel', () => ({
  ColliderPropertyPanel: () => null,
}));

import { ColliderComponent } from './ColliderComponent';

describe('ColliderComponent', () => {
  it('has type "collider"', () => {
    const c = new ColliderComponent();
    expect(c.type).toBe('collider');
  });

  it('has correct default values', () => {
    const c = new ColliderComponent();
    expect(c.width).toBe(1);
    expect(c.height).toBe(1);
    expect(c.collideLayers).toEqual([]);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new ColliderComponent();
    c.width = 3;
    c.height = 2;
    c.collideLayers = ['tile1', 'obj1'];

    const data = c.serialize();
    const c2 = new ColliderComponent();
    c2.deserialize(data);

    expect(c2.width).toBe(3);
    expect(c2.height).toBe(2);
    expect(c2.collideLayers).toEqual(['tile1', 'obj1']);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new ColliderComponent();
    c.deserialize({});

    expect(c.width).toBe(1);
    expect(c.height).toBe(1);
    expect(c.collideLayers).toEqual([]);
  });

  it('clone creates independent copy', () => {
    const c = new ColliderComponent();
    c.width = 4;
    c.collideLayers = ['tile1'];

    const cloned = c.clone();
    cloned.width = 10;
    cloned.collideLayers.push('obj1');

    expect(c.width).toBe(4);
    expect(cloned.width).toBe(10);
    expect(c.collideLayers).toEqual(['tile1']);
    expect(cloned.collideLayers).toEqual(['tile1', 'obj1']);
  });
});
