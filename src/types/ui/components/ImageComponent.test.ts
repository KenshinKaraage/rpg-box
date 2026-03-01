import { ImageComponent } from './ImageComponent';

describe('ImageComponent', () => {
  it('has type "image"', () => {
    const c = new ImageComponent();
    expect(c.type).toBe('image');
  });

  it('has label "画像"', () => {
    const c = new ImageComponent();
    expect(c.label).toBe('画像');
  });

  it('has correct default values', () => {
    const c = new ImageComponent();
    expect(c.imageId).toBeUndefined();
    expect(c.tint).toBeUndefined();
    expect(c.opacity).toBe(1);
    expect(c.sliceMode).toBe('none');
  });

  it('round-trips serialize and deserialize', () => {
    const c = new ImageComponent();
    c.imageId = 'img_001';
    c.tint = '#ff0000';
    c.opacity = 0.5;
    c.sliceMode = 'nine-slice';

    const data = c.serialize();
    const c2 = new ImageComponent();
    c2.deserialize(data);

    expect(c2.imageId).toBe('img_001');
    expect(c2.tint).toBe('#ff0000');
    expect(c2.opacity).toBe(0.5);
    expect(c2.sliceMode).toBe('nine-slice');
  });

  it('deserialize with empty object falls back to defaults', () => {
    const c = new ImageComponent();
    c.deserialize({});

    expect(c.imageId).toBeUndefined();
    expect(c.tint).toBeUndefined();
    expect(c.opacity).toBe(1);
    expect(c.sliceMode).toBe('none');
  });

  it('clone creates independent copy', () => {
    const c = new ImageComponent();
    c.imageId = 'img_001';
    c.opacity = 0.8;
    c.sliceMode = 'nine-slice';

    const cloned = c.clone();
    cloned.imageId = 'img_002';
    cloned.opacity = 0.3;

    expect(c.imageId).toBe('img_001');
    expect(c.opacity).toBe(0.8);
    expect(cloned.imageId).toBe('img_002');
    expect(cloned.opacity).toBe(0.3);
  });
});
