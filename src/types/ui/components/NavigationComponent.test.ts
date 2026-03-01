import { NavigationComponent } from './NavigationComponent';

describe('NavigationComponent', () => {
  it('has type "navigation"', () => {
    const c = new NavigationComponent();
    expect(c.type).toBe('navigation');
  });

  it('has label "ナビゲーション"', () => {
    const c = new NavigationComponent();
    expect(c.label).toBe('ナビゲーション');
  });

  it('has correct default values', () => {
    const c = new NavigationComponent();
    expect(c.direction).toBe('vertical');
    expect(c.wrap).toBe(false);
    expect(c.initialIndex).toBe(0);
    expect(c.columns).toBeUndefined();
  });

  it('round-trips serialize and deserialize', () => {
    const c = new NavigationComponent();
    c.direction = 'grid';
    c.wrap = true;
    c.initialIndex = 3;
    c.columns = 4;

    const data = c.serialize();
    const c2 = new NavigationComponent();
    c2.deserialize(data);

    expect(c2.direction).toBe('grid');
    expect(c2.wrap).toBe(true);
    expect(c2.initialIndex).toBe(3);
    expect(c2.columns).toBe(4);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new NavigationComponent();
    c.deserialize({});

    expect(c.direction).toBe('vertical');
    expect(c.wrap).toBe(false);
    expect(c.initialIndex).toBe(0);
    expect(c.columns).toBeUndefined();
  });

  it('clone creates independent copy', () => {
    const c = new NavigationComponent();
    c.direction = 'horizontal';
    c.wrap = true;
    c.initialIndex = 2;
    c.columns = 3;

    const cloned = c.clone();
    cloned.direction = 'grid';
    cloned.initialIndex = 5;

    expect(c.direction).toBe('horizontal');
    expect(c.initialIndex).toBe(2);
    expect(cloned.direction).toBe('grid');
    expect(cloned.initialIndex).toBe(5);
  });
});
