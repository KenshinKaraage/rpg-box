import { GridLayoutComponent } from './GridLayoutComponent';

describe('GridLayoutComponent', () => {
  it('has type "gridLayout"', () => {
    const c = new GridLayoutComponent();
    expect(c.type).toBe('gridLayout');
  });

  it('has label "グリッドレイアウト"', () => {
    const c = new GridLayoutComponent();
    expect(c.label).toBe('グリッドレイアウト');
  });

  it('has correct default values', () => {
    const c = new GridLayoutComponent();
    expect(c.columns).toBe(2);
    expect(c.spacingX).toBe(0);
    expect(c.spacingY).toBe(0);
    expect(c.cellWidth).toBeUndefined();
    expect(c.cellHeight).toBeUndefined();
  });

  it('round-trips serialize and deserialize', () => {
    const c = new GridLayoutComponent();
    c.columns = 4;
    c.spacingX = 10;
    c.spacingY = 5;
    c.cellWidth = 64;
    c.cellHeight = 48;

    const data = c.serialize();
    const c2 = new GridLayoutComponent();
    c2.deserialize(data);

    expect(c2.columns).toBe(4);
    expect(c2.spacingX).toBe(10);
    expect(c2.spacingY).toBe(5);
    expect(c2.cellWidth).toBe(64);
    expect(c2.cellHeight).toBe(48);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new GridLayoutComponent();
    c.deserialize({});

    expect(c.columns).toBe(2);
    expect(c.spacingX).toBe(0);
    expect(c.spacingY).toBe(0);
    expect(c.cellWidth).toBeUndefined();
    expect(c.cellHeight).toBeUndefined();
  });

  it('clone creates independent copy', () => {
    const c = new GridLayoutComponent();
    c.columns = 3;
    c.cellWidth = 100;

    const cloned = c.clone();
    cloned.columns = 5;
    cloned.cellWidth = 200;

    expect(c.columns).toBe(3);
    expect(c.cellWidth).toBe(100);
    expect(cloned.columns).toBe(5);
    expect(cloned.cellWidth).toBe(200);
  });
});
