import type { GameContext } from '../runtime/GameContext';
import { AudioAction } from './AudioAction';

function createMockContext(): GameContext {
  return {
    sound: {
      playBGM: jest.fn(),
      stopBGM: jest.fn(),
      playSE: jest.fn(),
      stopAll: jest.fn(),
    },
  } as unknown as GameContext;
}
const noopRun = jest.fn();

describe('AudioAction', () => {
  it('has type "audio"', () => {
    expect(new AudioAction().type).toBe('audio');
  });

  it('playBGM calls sound.playBGM with options', async () => {
    const action = new AudioAction();
    action.operation = 'playBGM';
    action.audioId = 'bgm-1';
    action.volume = 0.8;
    action.fadeIn = 500;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.sound.playBGM).toHaveBeenCalledWith('bgm-1', {
      volume: 0.8,
      loop: true,
      fadeIn: 500,
    });
  });

  it('stopBGM calls sound.stopBGM with fadeOut', async () => {
    const action = new AudioAction();
    action.operation = 'stopBGM';
    action.fadeOut = 1000;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.sound.stopBGM).toHaveBeenCalledWith(1000);
  });

  it('playSE calls sound.playSE with options', async () => {
    const action = new AudioAction();
    action.operation = 'playSE';
    action.audioId = 'se-hit';
    action.volume = 0.5;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.sound.playSE).toHaveBeenCalledWith('se-hit', { volume: 0.5 });
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new AudioAction();
    action.operation = 'playBGM';
    action.audioId = 'bgm-1';
    action.volume = 0.7;
    action.fadeIn = 300;
    const json = action.toJSON();
    const restored = new AudioAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('playBGM');
    expect(restored.audioId).toBe('bgm-1');
    expect(restored.volume).toBe(0.7);
    expect(restored.fadeIn).toBe(300);
  });
});
