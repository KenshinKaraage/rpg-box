import { MovementComponent } from './MovementComponent';

describe('MovementComponent', () => {
  it('has type "movement"', () => {
    const c = new MovementComponent();
    expect(c.type).toBe('movement');
  });

  it('has correct default values', () => {
    const c = new MovementComponent();
    expect(c.pattern).toBe('fixed');
    expect(c.speed).toBe(1);
    expect(c.routePoints).toEqual([]);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new MovementComponent();
    c.pattern = 'route';
    c.speed = 3;
    c.routePoints = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];

    const data = c.serialize();
    const c2 = new MovementComponent();
    c2.deserialize(data);

    expect(c2.pattern).toBe('route');
    expect(c2.speed).toBe(3);
    expect(c2.routePoints).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new MovementComponent();
    c.deserialize({});

    expect(c.pattern).toBe('fixed');
    expect(c.speed).toBe(1);
    expect(c.routePoints).toEqual([]);
  });

  it('clone creates independent copy', () => {
    const c = new MovementComponent();
    c.routePoints = [{ x: 1, y: 2 }];

    const cloned = c.clone();
    cloned.routePoints[0]!.x = 99;

    expect(c.routePoints[0]!.x).toBe(1);
    expect(cloned.routePoints[0]!.x).toBe(99);
  });
});
