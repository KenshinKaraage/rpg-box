import type { GameContext } from '../runtime/GameContext';
import { CameraAction } from './CameraAction';

function createMockContext(): GameContext {
  const overlayTarget = { id: '__camera__', overlayR: 0, overlayG: 0, overlayB: 0, overlayA: 0 };
  return {
    camera: {
      panTo: jest.fn(),
      resetPan: jest.fn(),
      shake: jest.fn(),
      setZoom: jest.fn(),
      setOverlay: jest.fn((r: number, g: number, b: number, a: number) => {
        overlayTarget.overlayR = r;
        overlayTarget.overlayG = g;
        overlayTarget.overlayB = b;
        overlayTarget.overlayA = a;
      }),
      getOverlayTarget: jest.fn(() => overlayTarget),
      reset: jest.fn(),
    },
    tween: {
      to: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as GameContext;
}
const noopRun = jest.fn();

describe('CameraAction', () => {
  it('has type "camera"', () => {
    expect(new CameraAction().type).toBe('camera');
  });

  it('pan calls camera.panTo', async () => {
    const action = new CameraAction();
    action.operation = 'pan';
    action.x = 100;
    action.y = 200;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.panTo).toHaveBeenCalledWith(100, 200);
  });

  it('zoom calls camera.setZoom', async () => {
    const action = new CameraAction();
    action.operation = 'zoom';
    action.scale = 2;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.setZoom).toHaveBeenCalledWith(2);
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

  it('effect flash sets overlay with intensity and tweens alpha to 0', async () => {
    const action = new CameraAction();
    action.operation = 'effect';
    action.effect = 'flash';
    action.color = '#ffffff';
    action.intensity = 0.8;
    action.duration = 20;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.setOverlay).toHaveBeenCalledWith(1, 1, 1, 0.8);
    expect(ctx.tween!.to).toHaveBeenCalledWith(
      expect.objectContaining({ id: '__camera__' }),
      'overlayA', 0, expect.any(Number), 'easeOut'
    );
  });

  it('effect fadeOut tweens alpha to intensity', async () => {
    const action = new CameraAction();
    action.operation = 'effect';
    action.effect = 'fadeOut';
    action.color = '#000000';
    action.intensity = 0.5;
    action.duration = 30;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.setOverlay).toHaveBeenCalledWith(0, 0, 0, 0);
    expect(ctx.tween!.to).toHaveBeenCalledWith(
      expect.objectContaining({ id: '__camera__' }),
      'overlayA', 0.5, expect.any(Number), 'easeIn'
    );
  });

  it('effect fadeIn tweens alpha to 0 (defaults intensity to 1)', async () => {
    const action = new CameraAction();
    action.operation = 'effect';
    action.effect = 'fadeIn';
    action.color = '#000000';
    action.duration = 30;
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.setOverlay).toHaveBeenCalledWith(0, 0, 0, 1);
    expect(ctx.tween!.to).toHaveBeenCalledWith(
      expect.objectContaining({ id: '__camera__' }),
      'overlayA', 0, expect.any(Number), 'easeOut'
    );
  });

  it('reset calls camera.reset', async () => {
    const action = new CameraAction();
    action.operation = 'reset';
    const ctx = createMockContext();
    await action.execute(ctx, noopRun);
    expect(ctx.camera.reset).toHaveBeenCalledTimes(1);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new CameraAction();
    action.operation = 'effect';
    action.effect = 'flash';
    action.color = '#ff0000';
    action.duration = 15;
    const json = action.toJSON();
    const restored = new CameraAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('effect');
    expect(restored.effect).toBe('flash');
    expect(restored.color).toBe('#ff0000');
    expect(restored.duration).toBe(15);
  });
});
