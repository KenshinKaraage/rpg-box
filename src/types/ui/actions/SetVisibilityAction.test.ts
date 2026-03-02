import { SetVisibilityAction } from './SetVisibilityAction';

describe('SetVisibilityAction', () => {
  it('has type "uiSetVisibility"', () => {
    const a = new SetVisibilityAction();
    expect(a.type).toBe('uiSetVisibility');
  });

  it('has correct default values', () => {
    const a = new SetVisibilityAction();
    expect(a.targetId).toBe('');
    expect(a.visible).toBe(true);
  });

  it('round-trips serialize and deserialize', () => {
    const a = new SetVisibilityAction();
    a.targetId = 'panel-1';
    a.visible = false;

    const json = a.toJSON();
    const b = new SetVisibilityAction();
    b.fromJSON(json);

    expect(b.targetId).toBe('panel-1');
    expect(b.visible).toBe(false);
  });

  it('deserialize with empty object uses defaults', () => {
    const a = new SetVisibilityAction();
    a.fromJSON({});
    expect(a.targetId).toBe('');
    expect(a.visible).toBe(true);
  });
});
