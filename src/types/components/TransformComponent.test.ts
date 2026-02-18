import { TransformComponent } from './TransformComponent';

describe('TransformComponent', () => {
  it('has type "transform"', () => {
    const c = new TransformComponent();
    expect(c.type).toBe('transform');
  });

  it('has correct default values', () => {
    const c = new TransformComponent();
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    expect(c.rotation).toBe(0);
    expect(c.scaleX).toBe(1);
    expect(c.scaleY).toBe(1);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new TransformComponent();
    c.x = 10;
    c.y = 20;
    c.rotation = 90;
    c.scaleX = 2;
    c.scaleY = 0.5;

    const data = c.serialize();
    const c2 = new TransformComponent();
    c2.deserialize(data);

    expect(c2.x).toBe(10);
    expect(c2.y).toBe(20);
    expect(c2.rotation).toBe(90);
    expect(c2.scaleX).toBe(2);
    expect(c2.scaleY).toBe(0.5);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new TransformComponent();
    c.deserialize({});

    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    expect(c.rotation).toBe(0);
    expect(c.scaleX).toBe(1);
    expect(c.scaleY).toBe(1);
  });

  it('clone creates independent copy', () => {
    const c = new TransformComponent();
    c.x = 5;
    c.y = 10;

    const cloned = c.clone();
    cloned.x = 99;

    expect(c.x).toBe(5);
    expect(cloned.x).toBe(99);
  });
});
