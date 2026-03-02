import { CallFunctionAction } from './CallFunctionAction';

describe('CallFunctionAction', () => {
  it('has type "uiCallFunction"', () => {
    const a = new CallFunctionAction();
    expect(a.type).toBe('uiCallFunction');
  });

  it('has correct default values', () => {
    const a = new CallFunctionAction();
    expect(a.functionName).toBe('');
    expect(a.args).toEqual({});
  });

  it('round-trips serialize and deserialize', () => {
    const a = new CallFunctionAction();
    a.functionName = 'openMenu';
    a.args = { menuId: 'main', animate: true };

    const json = a.toJSON();
    const b = new CallFunctionAction();
    b.fromJSON(json);

    expect(b.functionName).toBe('openMenu');
    expect(b.args).toEqual({ menuId: 'main', animate: true });
  });

  it('deep-clones args on serialize', () => {
    const a = new CallFunctionAction();
    a.args = { nested: { value: 1 } };

    const json = a.toJSON();
    (json.args as Record<string, unknown>).nested = 'changed';

    expect(a.args).toEqual({ nested: { value: 1 } });
  });

  it('deep-clones args on deserialize', () => {
    const data = { functionName: 'fn', args: { nested: { value: 1 } } };
    const a = new CallFunctionAction();
    a.fromJSON(data);

    (data.args.nested as Record<string, unknown>).value = 999;
    expect(a.args).toEqual({ nested: { value: 1 } });
  });

  it('deserialize with empty object uses defaults', () => {
    const a = new CallFunctionAction();
    a.fromJSON({});
    expect(a.functionName).toBe('');
    expect(a.args).toEqual({});
  });
});
