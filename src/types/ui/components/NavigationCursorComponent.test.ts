import { NavigationCursorComponent } from './NavigationCursorComponent';

describe('NavigationCursorComponent', () => {
  it('has type "navigationCursor"', () => {
    const c = new NavigationCursorComponent();
    expect(c.type).toBe('navigationCursor');
  });

  it('has label "ナビゲーションカーソル"', () => {
    const c = new NavigationCursorComponent();
    expect(c.label).toBe('ナビゲーションカーソル');
  });

  it('has correct default values', () => {
    const c = new NavigationCursorComponent();
    expect(c.offsetX).toBe(0);
    expect(c.offsetY).toBe(0);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new NavigationCursorComponent();
    c.offsetX = -16;
    c.offsetY = 4;

    const data = c.serialize();
    const c2 = new NavigationCursorComponent();
    c2.deserialize(data);

    expect(c2.offsetX).toBe(-16);
    expect(c2.offsetY).toBe(4);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new NavigationCursorComponent();
    c.deserialize({});

    expect(c.offsetX).toBe(0);
    expect(c.offsetY).toBe(0);
  });

  it('clone creates independent copy', () => {
    const c = new NavigationCursorComponent();
    c.offsetX = 10;
    c.offsetY = 20;

    const cloned = c.clone();
    cloned.offsetX = 30;
    cloned.offsetY = 40;

    expect(c.offsetX).toBe(10);
    expect(c.offsetY).toBe(20);
    expect(cloned.offsetX).toBe(30);
    expect(cloned.offsetY).toBe(40);
  });
});
