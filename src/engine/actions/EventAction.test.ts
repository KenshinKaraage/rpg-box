import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';
import {
  registerAction,
  getAction,
  getAllActions,
  getActionNames,
  clearActionRegistry,
} from './index';

// Concrete test action
class TestAction extends EventAction {
  readonly type = 'test';
  value = 0;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    this.value += 1;
  }

  toJSON(): Record<string, unknown> {
    return { value: this.value };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.value = data.value as number;
  }
}

describe('EventAction base', () => {
  it('concrete action has type', () => {
    const action = new TestAction();
    expect(action.type).toBe('test');
  });

  it('execute runs action logic', async () => {
    const action = new TestAction();
    const mockRun = jest.fn();
    await action.execute({} as GameContext, mockRun);
    expect(action.value).toBe(1);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new TestAction();
    action.value = 42;
    const json = action.toJSON();
    expect(json).toEqual({ value: 42 });

    const restored = new TestAction();
    restored.fromJSON(json);
    expect(restored.value).toBe(42);
  });
});

describe('actionRegistry', () => {
  beforeEach(() => clearActionRegistry());

  it('registers and retrieves an action', () => {
    registerAction('test', TestAction);
    const Cls = getAction('test');
    expect(Cls).toBe(TestAction);
  });

  it('returns undefined for unregistered type', () => {
    expect(getAction('nonexistent')).toBeUndefined();
  });

  it('getAllActions returns all entries', () => {
    registerAction('test', TestAction);
    const all = getAllActions();
    expect(all).toEqual([['test', TestAction]]);
  });

  it('getActionNames returns type strings', () => {
    registerAction('test', TestAction);
    expect(getActionNames()).toEqual(['test']);
  });

  it('clearActionRegistry removes all', () => {
    registerAction('test', TestAction);
    clearActionRegistry();
    expect(getAction('test')).toBeUndefined();
  });
});
