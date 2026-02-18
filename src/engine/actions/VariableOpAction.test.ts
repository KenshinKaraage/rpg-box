import type { GameContext } from '../runtime/GameContext';

// Import to trigger ValueSource handler registration
import '../values/register';

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

  it('set operation with literal', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'set';
    action.value = { type: 'literal', value: 100 };
    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 100);
  });

  it('add operation with literal', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'add';
    action.value = { type: 'literal', value: 10 };
    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 60);
  });

  it('subtract operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'subtract';
    action.value = { type: 'literal', value: 20 };
    const ctx = createMockContext(50);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 30);
  });

  it('multiply operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'multiply';
    action.value = { type: 'literal', value: 3 };
    const ctx = createMockContext(10);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 30);
  });

  it('divide operation', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'divide';
    action.value = { type: 'literal', value: 2 };
    const ctx = createMockContext(100);
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 50);
  });

  it('set operation with string literal', async () => {
    const action = new VariableOpAction();
    action.variableId = 'name';
    action.operation = 'set';
    action.value = { type: 'literal', value: 'hero' };
    const ctx = createMockContext('old');
    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('name', 'hero');
  });

  it('add with variable source', async () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'add';
    action.value = { type: 'variable', variableId: 'attack' };

    let hp = 50;
    const ctx = {
      variable: {
        get: jest.fn((name: string) => {
          if (name === 'hp') return hp;
          if (name === 'attack') return 25;
          return undefined;
        }),
        set: jest.fn((_, v) => {
          hp = v as number;
        }),
        getAll: jest.fn(() => ({})),
      },
    } as unknown as GameContext;

    await action.execute(ctx, noopRun);
    expect(ctx.variable.set).toHaveBeenCalledWith('hp', 75);
  });

  it('toJSON / fromJSON round-trips with ValueSource', () => {
    const action = new VariableOpAction();
    action.variableId = 'hp';
    action.operation = 'add';
    action.value = { type: 'variable', variableId: 'attack' };
    const json = action.toJSON();
    expect(json).toEqual({
      variableId: 'hp',
      operation: 'add',
      value: { type: 'variable', variableId: 'attack' },
    });
    const restored = new VariableOpAction();
    restored.fromJSON(json);
    expect(restored.variableId).toBe('hp');
    expect(restored.operation).toBe('add');
    expect(restored.value).toEqual({ type: 'variable', variableId: 'attack' });
  });
});
