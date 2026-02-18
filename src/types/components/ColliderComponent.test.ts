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
    expect(c.passable).toBe(false);
    expect(c.layer).toBe(0);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new ColliderComponent();
    c.width = 3;
    c.height = 2;
    c.passable = true;
    c.layer = 5;

    const data = c.serialize();
    const c2 = new ColliderComponent();
    c2.deserialize(data);

    expect(c2.width).toBe(3);
    expect(c2.height).toBe(2);
    expect(c2.passable).toBe(true);
    expect(c2.layer).toBe(5);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new ColliderComponent();
    c.deserialize({});

    expect(c.width).toBe(1);
    expect(c.height).toBe(1);
    expect(c.passable).toBe(false);
    expect(c.layer).toBe(0);
  });

  it('clone creates independent copy', () => {
    const c = new ColliderComponent();
    c.width = 4;
    c.passable = true;

    const cloned = c.clone();
    cloned.width = 10;

    expect(c.width).toBe(4);
    expect(cloned.width).toBe(10);
  });
});
