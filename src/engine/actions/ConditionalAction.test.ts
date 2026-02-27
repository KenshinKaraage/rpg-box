import type { GameContext } from '../runtime/GameContext';

import { ConditionalAction } from './ConditionalAction';
import type { EventAction } from './EventAction';

function createMockContext(vars: Record<string, unknown> = {}): GameContext {
  return {
    variable: {
      get: jest.fn((name: string) => vars[name]),
      set: jest.fn(),
      getAll: jest.fn(() => ({})),
    },
  } as unknown as GameContext;
}

describe('ConditionalAction', () => {
  it('has type "conditional"', () => {
    expect(new ConditionalAction().type).toBe('conditional');
  });

  it('runs thenActions when condition == is true', async () => {
    const action = new ConditionalAction();
    action.condition = {
      left: { type: 'variable', variableId: 'hp' },
      operator: '==',
      right: { type: 'literal', value: 100 },
    };
    const thenAction = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as EventAction;
    action.thenActions = [thenAction];
    const run = jest.fn();
    await action.execute(createMockContext({ hp: 100 }), run);
    expect(run).toHaveBeenCalledWith([thenAction]);
  });

  it('runs elseActions when condition == is false', async () => {
    const action = new ConditionalAction();
    action.condition = {
      left: { type: 'variable', variableId: 'hp' },
      operator: '==',
      right: { type: 'literal', value: 100 },
    };
    const elseAction = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as EventAction;
    action.thenActions = [];
    action.elseActions = [elseAction];
    const run = jest.fn();
    await action.execute(createMockContext({ hp: 50 }), run);
    expect(run).toHaveBeenCalledWith([elseAction]);
  });

  it.each([
    ['!=', { hp: 50 }, 0, true],
    ['!=', { hp: 0 }, 0, false],
    ['>', { hp: 50 }, 10, true],
    ['>', { hp: 10 }, 50, false],
    ['<', { hp: 10 }, 50, true],
    ['<', { hp: 50 }, 10, false],
    ['>=', { hp: 50 }, 50, true],
    ['>=', { hp: 49 }, 50, false],
    ['<=', { hp: 50 }, 50, true],
    ['<=', { hp: 51 }, 50, false],
  ] as const)('operator %s with vars=%j value=%s => %s', async (op, vars, val, shouldRunThen) => {
    const action = new ConditionalAction();
    action.condition = {
      left: { type: 'variable', variableId: 'hp' },
      operator: op as ConditionalAction['condition']['operator'],
      right: { type: 'literal', value: val },
    };
    action.thenActions = [];
    action.elseActions = [];
    const run = jest.fn();
    await action.execute(createMockContext(vars), run);
    expect(run).toHaveBeenCalledWith(shouldRunThen ? action.thenActions : action.elseActions);
  });

  it('compares two variables', async () => {
    const action = new ConditionalAction();
    action.condition = {
      left: { type: 'variable', variableId: 'hp' },
      operator: '>',
      right: { type: 'variable', variableId: 'mp' },
    };
    const run = jest.fn();
    await action.execute(createMockContext({ hp: 100, mp: 50 }), run);
    expect(run).toHaveBeenCalledWith(action.thenActions);
  });

  it('compares two literals', async () => {
    const action = new ConditionalAction();
    action.condition = {
      left: { type: 'literal', value: 10 },
      operator: '<',
      right: { type: 'literal', value: 20 },
    };
    const run = jest.fn();
    await action.execute(createMockContext(), run);
    expect(run).toHaveBeenCalledWith(action.thenActions);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new ConditionalAction();
    action.condition = {
      left: { type: 'variable', variableId: 'hp' },
      operator: '>=',
      right: { type: 'literal', value: 50 },
    };
    const json = action.toJSON();
    expect(json.condition).toEqual({
      left: { type: 'variable', variableId: 'hp' },
      operator: '>=',
      right: { type: 'literal', value: 50 },
    });
    const restored = new ConditionalAction();
    restored.fromJSON(json);
    expect(restored.condition).toEqual(action.condition);
  });

  it('fromJSON handles legacy format', () => {
    const action = new ConditionalAction();
    action.fromJSON({
      condition: { variableId: 'hp', operator: '>=', value: 50 },
    });
    expect(action.condition).toEqual({
      left: { type: 'variable', variableId: 'hp' },
      operator: '>=',
      right: { type: 'literal', value: 50 },
    });
  });
});
