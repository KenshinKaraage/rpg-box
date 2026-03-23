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
    expect(a.valueSource).toEqual({ source: 'literal', value: 0 });
  });

  it('round-trips serialize and deserialize (literal)', () => {
    const a = new SetPropertyAction();
    a.targetId = 'obj-1';
    a.component = 'shape';
    a.property = 'fillColor';
    a.valueSource = { source: 'literal', value: '#ff0000' };

    const json = a.toJSON();
    const b = new SetPropertyAction();
    b.fromJSON(json);

    expect(b.targetId).toBe('obj-1');
    expect(b.component).toBe('shape');
    expect(b.property).toBe('fillColor');
    expect(b.valueSource).toEqual({ source: 'literal', value: '#ff0000' });
  });

  it('round-trips serialize and deserialize (arg)', () => {
    const a = new SetPropertyAction();
    a.valueSource = { source: 'arg', argId: 'text' };

    const json = a.toJSON();
    const b = new SetPropertyAction();
    b.fromJSON(json);

    expect(b.valueSource).toEqual({ source: 'arg', argId: 'text' });
  });

  it('backward compat: old data with value field', () => {
    const a = new SetPropertyAction();
    a.fromJSON({ targetId: 'obj-1', component: 'text', property: 'content', value: 'hello' });

    expect(a.valueSource).toEqual({ source: 'literal', value: 'hello' });
  });

  it('deserialize with empty object uses defaults', () => {
    const a = new SetPropertyAction();
    a.fromJSON({});
    expect(a.targetId).toBe('');
    expect(a.component).toBe('transform');
    expect(a.property).toBe('');
    expect(a.valueSource).toEqual({ source: 'literal', value: 0 });
  });

  it('execute resolves literal value', async () => {
    const a = new SetPropertyAction();
    a.targetId = 'obj-1';
    a.component = 'text';
    a.property = 'content';
    a.valueSource = { source: 'literal', value: 'hello' };

    const calls: unknown[] = [];
    const mockManager = {
      setPropertyById: (...args: unknown[]) => calls.push(args),
    } as never;

    await a.execute('canvas-1', mockManager, {});
    expect(calls[0]).toEqual(['canvas-1', 'obj-1', 'text', 'content', 'hello']);
  });

  it('execute resolves arg value from fnArgs', async () => {
    const a = new SetPropertyAction();
    a.targetId = 'obj-1';
    a.component = 'text';
    a.property = 'content';
    a.valueSource = { source: 'arg', argId: 'message' };

    const calls: unknown[] = [];
    const mockManager = {
      setPropertyById: (...args: unknown[]) => calls.push(args),
    } as never;

    await a.execute('canvas-1', mockManager, { message: 'こんにちは' });
    expect(calls[0]).toEqual(['canvas-1', 'obj-1', 'text', 'content', 'こんにちは']);
  });
});
