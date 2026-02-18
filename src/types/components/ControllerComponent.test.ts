import { ControllerComponent } from './ControllerComponent';

describe('ControllerComponent', () => {
  it('has type "controller"', () => {
    const c = new ControllerComponent();
    expect(c.type).toBe('controller');
  });

  it('has correct default values', () => {
    const c = new ControllerComponent();
    expect(c.moveSpeed).toBe(1);
    expect(c.dashEnabled).toBe(true);
    expect(c.inputEnabled).toBe(true);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new ControllerComponent();
    c.moveSpeed = 3;
    c.dashEnabled = false;
    c.inputEnabled = false;

    const data = c.serialize();
    const c2 = new ControllerComponent();
    c2.deserialize(data);

    expect(c2.moveSpeed).toBe(3);
    expect(c2.dashEnabled).toBe(false);
    expect(c2.inputEnabled).toBe(false);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new ControllerComponent();
    c.deserialize({});

    expect(c.moveSpeed).toBe(1);
    expect(c.dashEnabled).toBe(true);
    expect(c.inputEnabled).toBe(true);
  });

  it('clone creates independent copy', () => {
    const c = new ControllerComponent();
    c.moveSpeed = 5;

    const cloned = c.clone();
    cloned.moveSpeed = 10;

    expect(c.moveSpeed).toBe(5);
    expect(cloned.moveSpeed).toBe(10);
  });
});
