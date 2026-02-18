import type { GameContext } from '../runtime/GameContext';
import { CameraAction } from './CameraAction';

function createMockContext(): GameContext {
  return {
    camera: { moveTo: jest.fn(), shake: jest.fn() },
  } as unknown as GameContext;
}
const noopRun = jest.fn();

describe('CameraAction', () => {
  it('has type "camera"', () => {
    expect(new CameraAction().type).toBe('camera');
  });

  it('pan calls camera.moveTo', async () => {
    const action = new CameraAction();
    action.operation = 'pan';
    action.x = 100;
    action.y = 200;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.moveTo).toHaveBeenCalledWith(100, 200);
  });

  it('effect shake calls camera.shake', async () => {
    const action = new CameraAction();
    action.operation = 'effect';
    action.effect = 'shake';
    action.intensity = 5;
    action.duration = 30;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.shake).toHaveBeenCalledWith(5, 30);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new CameraAction();
    action.operation = 'pan';
    action.x = 10;
    action.y = 20;
    const json = action.toJSON();
    const restored = new CameraAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('pan');
    expect(restored.x).toBe(10);
    expect(restored.y).toBe(20);
  });
});
