import { ColorMaskComponent } from './ColorMaskComponent';

describe('ColorMaskComponent', () => {
  it('has type "colorMask"', () => {
    const c = new ColorMaskComponent();
    expect(c.type).toBe('colorMask');
  });

  it('has label "カラーマスク"', () => {
    const c = new ColorMaskComponent();
    expect(c.label).toBe('カラーマスク');
  });

  it('has correct default values', () => {
    const c = new ColorMaskComponent();
    expect(c.color).toBe('#ffffff');
    expect(c.blendMode).toBe('multiply');
    expect(c.opacity).toBe(1);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new ColorMaskComponent();
    c.color = '#ff0000';
    c.blendMode = 'add';
    c.opacity = 0.5;

    const data = c.serialize();
    const c2 = new ColorMaskComponent();
    c2.deserialize(data);

    expect(c2.color).toBe('#ff0000');
    expect(c2.blendMode).toBe('add');
    expect(c2.opacity).toBe(0.5);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new ColorMaskComponent();
    c.deserialize({});

    expect(c.color).toBe('#ffffff');
    expect(c.blendMode).toBe('multiply');
    expect(c.opacity).toBe(1);
  });

  it('clone creates independent copy', () => {
    const c = new ColorMaskComponent();
    c.color = '#00ff00';
    c.blendMode = 'overlay';
    c.opacity = 0.3;

    const cloned = c.clone();
    cloned.color = '#0000ff';
    cloned.blendMode = 'add';

    expect(c.color).toBe('#00ff00');
    expect(c.blendMode).toBe('overlay');
    expect(cloned.color).toBe('#0000ff');
    expect(cloned.blendMode).toBe('add');
  });
});
