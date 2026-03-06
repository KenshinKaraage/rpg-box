import type { GameContext } from '../runtime/GameContext';
import { WaitAction } from './WaitAction';
import { ObjectAction } from './ObjectAction';
import { MapAction } from './MapAction';

const noopRun = jest.fn();

function mockContext(overrides?: Partial<GameContext>): GameContext {
  return {
    waitFrames: jest.fn().mockResolvedValue(undefined),
    pendingMapChange: null,
    ...overrides,
  } as unknown as GameContext;
}

describe('WaitAction', () => {
  it('has type "wait"', () => {
    expect(new WaitAction().type).toBe('wait');
  });

  it('calls context.waitFrames with frame count', async () => {
    const ctx = mockContext();
    const action = new WaitAction();
    action.frames = 30;
    await action.execute(ctx, noopRun);
    expect(ctx.waitFrames).toHaveBeenCalledWith(30);
  });

  it('uses default 60 frames', async () => {
    const ctx = mockContext();
    const action = new WaitAction();
    await action.execute(ctx, noopRun);
    expect(ctx.waitFrames).toHaveBeenCalledWith(60);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new WaitAction();
    action.frames = 30;
    const json = action.toJSON();
    expect(json).toEqual({ frames: 30 });
    const restored = new WaitAction();
    restored.fromJSON(json);
    expect(restored.frames).toBe(30);
  });
});

describe('ObjectAction', () => {
  it('has type "object"', () => {
    expect(new ObjectAction().type).toBe('object');
  });

  it('execute is no-op', async () => {
    const ctx = mockContext();
    const action = new ObjectAction();
    action.operation = 'move';
    action.targetId = 'obj-1';
    await action.execute(ctx, noopRun);
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new ObjectAction();
    action.operation = 'move';
    action.targetId = 'obj-1';
    action.x = 10;
    action.y = 20;
    const json = action.toJSON();
    const restored = new ObjectAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('move');
    expect(restored.targetId).toBe('obj-1');
    expect(restored.x).toBe(10);
    expect(restored.y).toBe(20);
  });
});

describe('MapAction', () => {
  it('has type "map"', () => {
    expect(new MapAction().type).toBe('map');
  });

  it('changeMap sets context.pendingMapChange', async () => {
    const ctx = mockContext();
    const action = new MapAction();
    action.operation = 'changeMap';
    action.targetMapId = 'map-2';
    action.x = 5;
    action.y = 10;
    await action.execute(ctx, noopRun);
    expect(ctx.pendingMapChange).toEqual({
      mapId: 'map-2',
      x: 5,
      y: 10,
    });
  });

  it('changeMap defaults position to 0,0', async () => {
    const ctx = mockContext();
    const action = new MapAction();
    action.operation = 'changeMap';
    action.targetMapId = 'map-3';
    await action.execute(ctx, noopRun);
    expect(ctx.pendingMapChange).toEqual({
      mapId: 'map-3',
      x: 0,
      y: 0,
    });
  });

  it('changeMap does nothing without targetMapId', async () => {
    const ctx = mockContext();
    const action = new MapAction();
    action.operation = 'changeMap';
    await action.execute(ctx, noopRun);
    expect(ctx.pendingMapChange).toBeNull();
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new MapAction();
    action.operation = 'changeMap';
    action.targetMapId = 'map-2';
    action.x = 5;
    action.y = 10;
    const json = action.toJSON();
    const restored = new MapAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('changeMap');
    expect(restored.targetMapId).toBe('map-2');
    expect(restored.x).toBe(5);
    expect(restored.y).toBe(10);
  });
});
