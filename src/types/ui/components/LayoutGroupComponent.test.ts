import { LayoutGroupComponent } from './LayoutGroupComponent';

describe('LayoutGroupComponent', () => {
  it('has type "layoutGroup"', () => {
    const c = new LayoutGroupComponent();
    expect(c.type).toBe('layoutGroup');
  });

  it('has label "レイアウトグループ"', () => {
    const c = new LayoutGroupComponent();
    expect(c.label).toBe('レイアウトグループ');
  });

  it('has correct default values', () => {
    const c = new LayoutGroupComponent();
    expect(c.direction).toBe('vertical');
    expect(c.spacing).toBe(0);
    expect(c.alignment).toBe('start');
    expect(c.reverseOrder).toBe(false);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new LayoutGroupComponent();
    c.direction = 'horizontal';
    c.spacing = 8;
    c.alignment = 'center';
    c.reverseOrder = true;

    const data = c.serialize();
    const c2 = new LayoutGroupComponent();
    c2.deserialize(data);

    expect(c2.direction).toBe('horizontal');
    expect(c2.spacing).toBe(8);
    expect(c2.alignment).toBe('center');
    expect(c2.reverseOrder).toBe(true);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new LayoutGroupComponent();
    c.deserialize({});

    expect(c.direction).toBe('vertical');
    expect(c.spacing).toBe(0);
    expect(c.alignment).toBe('start');
    expect(c.reverseOrder).toBe(false);
  });

  it('clone creates independent copy', () => {
    const c = new LayoutGroupComponent();
    c.direction = 'horizontal';
    c.spacing = 12;

    const cloned = c.clone();
    cloned.direction = 'vertical';
    cloned.spacing = 0;

    expect(c.direction).toBe('horizontal');
    expect(c.spacing).toBe(12);
    expect(cloned.direction).toBe('vertical');
    expect(cloned.spacing).toBe(0);
  });
});
