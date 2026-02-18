import type { GameContext } from '../runtime/GameContext';
import { AudioAction } from './AudioAction';

function createMockContext(): GameContext {
  return {
    sound: { play: jest.fn(), stop: jest.fn(), stopAll: jest.fn() },
  } as unknown as GameContext;
}
const noopRun = jest.fn();

describe('AudioAction', () => {
  it('has type "audio"', () => {
    expect(new AudioAction().type).toBe('audio');
  });

  it('playBGM calls sound.play', async () => {
    const action = new AudioAction();
    action.operation = 'playBGM';
    action.audioId = 'bgm-1';
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.sound.play).toHaveBeenCalledWith('bgm-1');
  });

  it('stopBGM calls sound.stopAll', async () => {
    const action = new AudioAction();
    action.operation = 'stopBGM';
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.sound.stopAll).toHaveBeenCalled();
  });

  it('playSE calls sound.play', async () => {
    const action = new AudioAction();
    action.operation = 'playSE';
    action.audioId = 'se-hit';
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.sound.play).toHaveBeenCalledWith('se-hit');
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new AudioAction();
    action.operation = 'playBGM';
    action.audioId = 'bgm-1';
    const json = action.toJSON();
    const restored = new AudioAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('playBGM');
    expect(restored.audioId).toBe('bgm-1');
  });
});
