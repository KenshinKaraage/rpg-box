import { SpriteComponent } from './SpriteComponent';

describe('SpriteComponent', () => {
  it('has type "sprite"', () => {
    const c = new SpriteComponent();
    expect(c.type).toBe('sprite');
  });

  it('has correct default values', () => {
    const c = new SpriteComponent();
    expect(c.imageId).toBeUndefined();
    expect(c.animationId).toBeUndefined();
    expect(c.flipX).toBe(false);
    expect(c.flipY).toBe(false);
    expect(c.tint).toBeUndefined();
    expect(c.opacity).toBe(1);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new SpriteComponent();
    c.imageId = 'img_001';
    c.animationId = 'anim_walk';
    c.flipX = true;
    c.flipY = true;
    c.tint = '#ff0000';
    c.opacity = 0.5;

    const data = c.serialize();
    const c2 = new SpriteComponent();
    c2.deserialize(data);

    expect(c2.imageId).toBe('img_001');
    expect(c2.animationId).toBe('anim_walk');
    expect(c2.flipX).toBe(true);
    expect(c2.flipY).toBe(true);
    expect(c2.tint).toBe('#ff0000');
    expect(c2.opacity).toBe(0.5);
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new SpriteComponent();
    c.deserialize({});

    expect(c.imageId).toBeUndefined();
    expect(c.animationId).toBeUndefined();
    expect(c.flipX).toBe(false);
    expect(c.flipY).toBe(false);
    expect(c.tint).toBeUndefined();
    expect(c.opacity).toBe(1);
  });

  it('clone creates independent copy', () => {
    const c = new SpriteComponent();
    c.imageId = 'img_001';
    c.opacity = 0.8;

    const cloned = c.clone();
    cloned.imageId = 'img_002';

    expect(c.imageId).toBe('img_001');
    expect(cloned.imageId).toBe('img_002');
  });
});
