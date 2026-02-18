import type { GameContext } from '../runtime/GameContext';
import { EventAction } from '../actions/EventAction';

import { EventRunner } from './EventRunner';

class MockAction extends EventAction {
  readonly type = 'mock';
  executedCount = 0;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    this.executedCount++;
  }

  toJSON(): Record<string, unknown> {
    return {};
  }
  fromJSON(_data: Record<string, unknown>): void {}
}

class CounterAction extends EventAction {
  readonly type = 'counter';

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const current = (context.variable.get('count') as number) ?? 0;
    context.variable.set('count', current + 1);
  }

  toJSON(): Record<string, unknown> {
    return {};
  }
  fromJSON(_data: Record<string, unknown>): void {}
}

function createMockContext(vars: Record<string, unknown> = {}): GameContext {
  const store = { ...vars };
  return {
    variable: {
      get: jest.fn((name: string) => store[name]),
      set: jest.fn((name: string, value: unknown) => {
        store[name] = value;
      }),
      getAll: jest.fn(() => ({ ...store })),
    },
  } as unknown as GameContext;
}

describe('EventRunner', () => {
  it('runs actions sequentially', async () => {
    const runner = new EventRunner();
    const a1 = new MockAction();
    const a2 = new MockAction();

    await runner.run([a1, a2], createMockContext());

    expect(a1.executedCount).toBe(1);
    expect(a2.executedCount).toBe(1);
  });

  it('runs no actions for empty array', async () => {
    const runner = new EventRunner();
    await runner.run([], createMockContext());
  });

  it('throws when iteration limit exceeded', async () => {
    class InfiniteAction extends EventAction {
      readonly type = 'infinite';
      async execute(
        _context: GameContext,
        run: (actions: EventAction[]) => Promise<void>
      ): Promise<void> {
        await run([this]);
      }
      toJSON(): Record<string, unknown> {
        return {};
      }
      fromJSON(_data: Record<string, unknown>): void {}
    }

    const runner = new EventRunner();
    await expect(runner.run([new InfiniteAction()], createMockContext())).rejects.toThrow(
      /イテレーション上限/
    );
  });

  it('passes context to each action', async () => {
    const runner = new EventRunner();
    const ctx = createMockContext({ count: 0 });
    const action = new CounterAction();

    await runner.run([action, action, action], ctx);

    expect(ctx.variable.set).toHaveBeenCalledTimes(3);
  });

  it('supports nested child action execution', async () => {
    class ParentAction extends EventAction {
      readonly type = 'parent';
      children: EventAction[];
      constructor(children: EventAction[]) {
        super();
        this.children = children;
      }
      async execute(
        _context: GameContext,
        run: (actions: EventAction[]) => Promise<void>
      ): Promise<void> {
        await run(this.children);
      }
      toJSON(): Record<string, unknown> {
        return {};
      }
      fromJSON(_data: Record<string, unknown>): void {}
    }

    const runner = new EventRunner();
    const child = new MockAction();
    const parent = new ParentAction([child]);

    await runner.run([parent], createMockContext());

    expect(child.executedCount).toBe(1);
  });
});
