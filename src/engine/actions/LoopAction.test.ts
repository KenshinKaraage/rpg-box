import type { GameContext } from '../runtime/GameContext';

import { LoopAction } from './LoopAction';

describe('LoopAction', () => {
  it('has type "loop"', () => {
    expect(new LoopAction().type).toBe('loop');
  });

  it('runs actions count times', async () => {
    const action = new LoopAction();
    action.count = 3;
    const run = jest.fn().mockResolvedValue(undefined);
    await action.execute({} as GameContext, run);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('runs 0 times when count is 0', async () => {
    const action = new LoopAction();
    action.count = 0;
    const run = jest.fn().mockResolvedValue(undefined);
    await action.execute({} as GameContext, run);
    expect(run).not.toHaveBeenCalled();
  });

  it('toJSON / fromJSON round-trips with count', () => {
    const action = new LoopAction();
    action.count = 5;
    const json = action.toJSON();
    expect(json).toEqual({ count: 5, actions: [] });
    const restored = new LoopAction();
    restored.fromJSON(json);
    expect(restored.count).toBe(5);
  });

  it('toJSON with undefined count (infinite)', () => {
    const action = new LoopAction();
    action.count = undefined;
    const json = action.toJSON();
    expect(json.count).toBeUndefined();
  });
});
