import type { GameContext } from '../runtime/GameContext';

import { VariableOpAction } from './VariableOpAction';

function createMockContext(initialValue: unknown = 0): GameContext {
  let value = initialValue;
  return {
    variable: {
      get: jest.fn(() => value),
      set: jest.fn((_, v) => {
        value = v;
      }),
      getAll: jest.fn(() => ({})),
    },
  } as unknown as GameContext;
}

const noopRun = jest.fn();

describe('VariableOpAction', () => {
  it('has type "variableOp"', () => {
    expect(new VariableOpAction().type).toBe('variableOp');
  });

  it('set operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'set';
    action.value = 100;
    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 100);
  });

  it('add operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'add';
    action.value = 10;
    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 60);
  });

  it('subtract operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'subtract';
    action.value = 20;
    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 30);
  });

  it('multiply operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'multiply';
    action.value = 3;
    const ctx = createMockContext(10);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 30);
  });

  it('divide operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'divide';
    action.value = 2;
    const ctx = createMockContext(100);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 50);
  });

  it('set operation with string value', async () => {
    const action = new VariableOpAction();
    action.variableId = 'name';
    action.operation = 'set';
    action.value = 'hero';
    const ctx = createMockContext('old');
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('name', 'hero');
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'add';
    action.value = 10;
    const json = action.toJSON();
    expect(json).toEqual({ variableId: 'hp', operation: 'add', value: 10 });
    const restored = new VariableOpAction();
    restored.fromJSON(json);
    expect(restored.variableId).toBe('hp');
    expect(restored.operation).toBe('add');
    expect(restored.value).toBe(10);
  });
});
