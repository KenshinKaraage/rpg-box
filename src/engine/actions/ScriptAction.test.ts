import type { GameContext } from '../runtime/GameContext';
import { ScriptAction } from './ScriptAction';

describe('ScriptAction', () => {
  it('has type "script"', () => {
    expect(new ScriptAction().type).toBe('script');
  });

  it('execute calls scriptRunner.executeById', async () => {
    const action = new ScriptAction();
    action.scriptId = 'scr-1';
    action.args = { damage: 10 };
    const ctx = {
      scriptRunner: { executeById: jest.fn().mockResolvedValue(undefined) },
    } as unknown as GameContext;
    await action.execute(ctx, jest.fn());
    expect(ctx.scriptRunner.executeById).toHaveBeenCalledWith('scr-1', ctx, { damage: 10 });
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new ScriptAction();
    action.scriptId = 'scr-1';
    action.args = { damage: 10 };
    const json = action.toJSON();
    expect(json).toEqual({ scriptId: 'scr-1', args: { damage: 10 } });
    const restored = new ScriptAction();
    restored.fromJSON(json);
    expect(restored.scriptId).toBe('scr-1');
    expect(restored.args).toEqual({ damage: 10 });
  });
});
