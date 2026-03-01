import { ShapeComponent } from './ShapeComponent';

describe('ShapeComponent', () => {
  it('has type "shape"', () => {
    const c = new ShapeComponent();
    expect(c.type).toBe('shape');
  });

  it('has label "図形"', () => {
    const c = new ShapeComponent();
    expect(c.label).toBe('図形');
  });

  it('has correct default values', () => {
    const c = new ShapeComponent();
    expect(c.shapeType).toBe('rectangle');
    expect(c.fillColor).toBeUndefined();
    expect(c.strokeColor).toBeUndefined();
    expect(c.strokeWidth).toBe(1);
    expect(c.cornerRadius).toBe(0);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new ShapeComponent();
    c.shapeType = 'ellipse';
    c.fillColor = '#00ff00';
    c.strokeColor = '#0000ff';
    c.strokeWidth = 3;
    c.cornerRadius = 8;

    const data = c.serialize();
    const c2 = new ShapeComponent();
    c2.deserialize(data);

    expect(c2.shapeType).toBe('ellipse');
    expect(c2.fillColor).toBe('#00ff00');
    expect(c2.strokeColor).toBe('#0000ff');
    expect(c2.strokeWidth).toBe(3);
    expect(c2.cornerRadius).toBe(8);
  });

  it('deserialize with empty object falls back to defaults', () => {
    const c = new ShapeComponent();
    c.deserialize({});

    expect(c.shapeType).toBe('rectangle');
    expect(c.fillColor).toBeUndefined();
    expect(c.strokeColor).toBeUndefined();
    expect(c.strokeWidth).toBe(1);
    expect(c.cornerRadius).toBe(0);
  });

  it('clone creates independent copy', () => {
    const c = new ShapeComponent();
    c.shapeType = 'polygon';
    c.fillColor = '#ff0000';
    c.strokeWidth = 5;

    const cloned = c.clone();
    cloned.shapeType = 'ellipse';
    cloned.fillColor = '#00ff00';

    expect(c.shapeType).toBe('polygon');
    expect(c.fillColor).toBe('#ff0000');
    expect(cloned.shapeType).toBe('ellipse');
    expect(cloned.fillColor).toBe('#00ff00');
  });
});
