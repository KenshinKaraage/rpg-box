import { FillMaskComponent } from './FillMaskComponent';

describe('FillMaskComponent', () => {
  it('has type "fillMask"', () => {
    const c = new FillMaskComponent();
    expect(c.type).toBe('fillMask');
  });

  it('has label "フィルマスク"', () => {
    const c = new FillMaskComponent();
    expect(c.label).toBe('フィルマスク');
  });

  it('has correct default values', () => {
    const c = new FillMaskComponent();
    expect(c.direction).toBe('horizontal');
    expect(c.fillAmount).toBe(1);
    expect(c.reverse).toBe(false);
  });

  it('round-trips serialize and deserialize', () => {
    const c = new FillMaskComponent();
    c.direction = 'vertical';
    c.fillAmount = 0.5;
    c.reverse = true;

    const data = c.serialize();
    const c2 = new FillMaskComponent();
    c2.deserialize(data);

    expect(c2.direction).toBe('vertical');
    expect(c2.fillAmount).toBe(0.5);
    expect(c2.reverse).toBe(true);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new FillMaskComponent();
    c.deserialize({});

    expect(c.direction).toBe('horizontal');
    expect(c.fillAmount).toBe(1);
    expect(c.reverse).toBe(false);
  });

  it('clone creates independent copy', () => {
    const c = new FillMaskComponent();
    c.direction = 'vertical';
    c.fillAmount = 0.75;
    c.reverse = true;

    const cloned = c.clone();
    cloned.direction = 'horizontal';
    cloned.fillAmount = 0.25;

    expect(c.direction).toBe('vertical');
    expect(c.fillAmount).toBe(0.75);
    expect(cloned.direction).toBe('horizontal');
    expect(cloned.fillAmount).toBe(0.25);
  });
});
