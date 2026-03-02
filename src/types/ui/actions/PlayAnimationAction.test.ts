import { PlayAnimationAction } from './PlayAnimationAction';

describe('PlayAnimationAction', () => {
  it('has type "uiPlayAnimation"', () => {
    const a = new PlayAnimationAction();
    expect(a.type).toBe('uiPlayAnimation');
  });

  it('has correct default values', () => {
    const a = new PlayAnimationAction();
    expect(a.targetId).toBe('');
    expect(a.autoPlay).toBe(true);
    expect(a.loop).toBe(false);
  });

  it('round-trips serialize and deserialize', () => {
    const a = new PlayAnimationAction();
    a.targetId = 'anim-obj';
    a.autoPlay = false;
    a.loop = true;

    const json = a.toJSON();
    const b = new PlayAnimationAction();
    b.fromJSON(json);

    expect(b.targetId).toBe('anim-obj');
    expect(b.autoPlay).toBe(false);
    expect(b.loop).toBe(true);
  });

  it('deserialize with empty object uses defaults', () => {
    const a = new PlayAnimationAction();
    a.fromJSON({});
    expect(a.targetId).toBe('');
    expect(a.autoPlay).toBe(true);
    expect(a.loop).toBe(false);
  });
});
