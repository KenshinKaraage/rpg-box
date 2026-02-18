import { EffectComponent } from './EffectComponent';

describe('EffectComponent', () => {
  it('has type "effect"', () => {
    const c = new EffectComponent();
    expect(c.type).toBe('effect');
  });

  it('has correct default values', () => {
    const c = new EffectComponent();
    expect(c.effectId).toBeUndefined();
    expect(c.onComplete).toBe('none');
  });

  it('round-trips serialize and deserialize', () => {
    const c = new EffectComponent();
    c.effectId = 'effect_fire';
    c.onComplete = 'delete';

    const data = c.serialize();
    const c2 = new EffectComponent();
    c2.deserialize(data);

    expect(c2.effectId).toBe('effect_fire');
    expect(c2.onComplete).toBe('delete');
  });

  it('deserialize with missing props uses defaults', () => {
    const c = new EffectComponent();
    c.deserialize({});

    expect(c.effectId).toBeUndefined();
    expect(c.onComplete).toBe('none');
  });

  it('clone creates independent copy', () => {
    const c = new EffectComponent();
    c.effectId = 'effect_fire';
    c.onComplete = 'hide';

    const cloned = c.clone();
    cloned.effectId = 'effect_ice';

    expect(c.effectId).toBe('effect_fire');
    expect(cloned.effectId).toBe('effect_ice');
  });
});
