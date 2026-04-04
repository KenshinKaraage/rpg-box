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

  it('round-trips serialize and deserialize (new format)', () => {
    const c = new MovementComponent();
    c.pattern = 'route';
    c.speed = 3;
    c.routeSteps = [
      { type: 'move', direction: 'right' },
      { type: 'face', direction: 'down' },
      { type: 'move', direction: 'left' },
    ];
    c.routeLoop = false;

    const data = c.serialize();
    const c2 = new MovementComponent();
    c2.deserialize(data);

    expect(c2.routeSteps).toEqual([
      { type: 'move', direction: 'right' },
      { type: 'face', direction: 'down' },
      { type: 'move', direction: 'left' },
    ]);
    expect(c2.routeLoop).toBe(false);
  });

  it('deserialize legacy format (string steps)', () => {
    const c = new MovementComponent();
    c.deserialize({ routeSteps: ['up', 'down', 'left'] });

    expect(c.routeSteps).toEqual([
      { type: 'move', direction: 'up' },
      { type: 'move', direction: 'down' },
      { type: 'move', direction: 'left' },
    ]);
  });

  it('clone creates independent copy', () => {
    const c = new MovementComponent();
    c.routeSteps = [{ type: 'move', direction: 'up' }, { type: 'face', direction: 'down' }];

    const cloned = c.clone();
    cloned.routeSteps.push({ type: 'move', direction: 'left' });

    expect(c.routeSteps).toHaveLength(2);
    expect(cloned.routeSteps).toHaveLength(3);
  });
});
