import { NavigateAction } from './NavigateAction';

describe('NavigateAction', () => {
  it('has type "uiNavigate"', () => {
    const a = new NavigateAction();
    expect(a.type).toBe('uiNavigate');
  });

  it('has correct default values', () => {
    const a = new NavigateAction();
    expect(a.canvasId).toBe('');
    expect(a.transition).toBe('none');
  });

  it('round-trips serialize and deserialize', () => {
    const a = new NavigateAction();
    a.canvasId = 'battle-canvas';
    a.transition = 'fade';

    const json = a.toJSON();
    const b = new NavigateAction();
    b.fromJSON(json);

    expect(b.canvasId).toBe('battle-canvas');
    expect(b.transition).toBe('fade');
  });

  it('supports slide transition', () => {
    const a = new NavigateAction();
    a.transition = 'slide';
    const json = a.toJSON();
    const b = new NavigateAction();
    b.fromJSON(json);
    expect(b.transition).toBe('slide');
  });

  it('deserialize with empty object uses defaults', () => {
    const a = new NavigateAction();
    a.fromJSON({});
    expect(a.canvasId).toBe('');
    expect(a.transition).toBe('none');
  });
});
