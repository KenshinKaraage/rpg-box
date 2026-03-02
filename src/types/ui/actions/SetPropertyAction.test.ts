import { SetPropertyAction } from './SetPropertyAction';

describe('SetPropertyAction', () => {
  it('has type "uiSetProperty"', () => {
    const a = new SetPropertyAction();
    expect(a.type).toBe('uiSetProperty');
  });

  it('has correct default values', () => {
    const a = new SetPropertyAction();
    expect(a.targetId).toBe('');
    expect(a.component).toBe('transform');
    expect(a.property).toBe('');
    expect(a.value).toBe(0);
  });

  it('round-trips serialize and deserialize', () => {
    const a = new SetPropertyAction();
    a.targetId = 'obj-1';
    a.component = 'shape';
    a.property = 'fillColor';
    a.value = '#ff0000';

    const json = a.toJSON();
    const b = new SetPropertyAction();
    b.fromJSON(json);

    expect(b.targetId).toBe('obj-1');
    expect(b.component).toBe('shape');
    expect(b.property).toBe('fillColor');
    expect(b.value).toBe('#ff0000');
  });

  it('handles string value', () => {
    const a = new SetPropertyAction();
    a.value = 'hello';
    const json = a.toJSON();
    const b = new SetPropertyAction();
    b.fromJSON(json);
    expect(b.value).toBe('hello');
  });

  it('deserialize with empty object uses defaults', () => {
    const a = new SetPropertyAction();
    a.fromJSON({});
    expect(a.targetId).toBe('');
    expect(a.component).toBe('transform');
    expect(a.property).toBe('');
    expect(a.value).toBe(0);
  });
});
