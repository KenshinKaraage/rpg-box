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
    expect(c.activeness).toBe(3);
    expect(c.routeSteps).toEqual([]);
    expect(c.routeLoop).toBe(true);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new MovementComponent();
    c.pattern = 'route';
    c.speed = 3;
    c.activeness = 7;
    c.routeSteps = ['right', 'right', 'down', 'left', 'left', 'up'];
    c.routeLoop = false;

    const data = c.serialize();
    const c2 = new MovementComponent();
    c2.deserialize(data);

    expect(c2.pattern).toBe('route');
    expect(c2.speed).toBe(3);
    expect(c2.activeness).toBe(7);
    expect(c2.routeSteps).toEqual(['right', 'right', 'down', 'left', 'left', 'up']);
    expect(c2.routeLoop).toBe(false);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new MovementComponent();
    c.deserialize({});

    expect(c.pattern).toBe('fixed');
    expect(c.speed).toBe(1);
    expect(c.activeness).toBe(3);
    expect(c.routeSteps).toEqual([]);
    expect(c.routeLoop).toBe(true);
  });

  it('clone creates independent copy', () => {
    const c = new MovementComponent();
    c.routeSteps = ['up', 'down'];

    const cloned = c.clone();
    cloned.routeSteps.push('left');

    expect(c.routeSteps).toEqual(['up', 'down']);
    expect(cloned.routeSteps).toEqual(['up', 'down', 'left']);
  });
});
