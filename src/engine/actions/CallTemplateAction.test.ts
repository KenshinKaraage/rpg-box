import type { GameContext } from '../runtime/GameContext';
import { CallTemplateAction } from './CallTemplateAction';

describe('CallTemplateAction', () => {
  it('has type "callTemplate"', () => {
    expect(new CallTemplateAction().type).toBe('callTemplate');
  });

  it('execute is a no-op', async () => {
    const action = new CallTemplateAction();
    action.templateId = 'tpl-1';
    const run = jest.fn();
    await action.execute({} as GameContext, run);
    expect(run).not.toHaveBeenCalled();
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new CallTemplateAction();
    action.templateId = 'tpl-1';
    action.args = { x: 10, y: 20 };
    const json = action.toJSON();
    expect(json).toEqual({ templateId: 'tpl-1', args: { x: 10, y: 20 } });
    const restored = new CallTemplateAction();
    restored.fromJSON(json);
    expect(restored.templateId).toBe('tpl-1');
    expect(restored.args).toEqual({ x: 10, y: 20 });
  });
});
