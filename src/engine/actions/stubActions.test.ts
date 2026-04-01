import type { GameContext } from '../runtime/GameContext';
import { WaitAction } from './WaitAction';
import { ObjectAction } from './ObjectAction';
import { MapAction } from './MapAction';

function mockContext(overrides?: Partial<GameContext>): GameContext {
  return {
    waitFrames: jest.fn().mockResolvedValue(undefined),
    pendingMapChange: null,
    ...overrides,
  } as unknown as GameContext;
}

const noopRun = jest.fn();

describe('WaitAction', () => {
  it('has type "wait"', () => {
    expect(new WaitAction().type).toBe('wait');
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new WaitAction();
    action.frames = 60;
    const json = action.toJSON();
    const restored = new WaitAction();
    restored.fromJSON(json);
    expect(restored.frames).toBe(60);
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
    expect(ctx.pendingMapChange).toEqual({ mapId: 'map-2', x: 5, y: 10 });
  });

  it('changeMap with no targetMapId does nothing', async () => {
    const ctx = mockContext();
    const action = new MapAction();
    action.operation = 'changeMap';
    await action.execute(ctx, noopRun);
    expect(ctx.pendingMapChange).toBeNull();
  });

  it('toJSON / fromJSON round-trips', () => {
    const action = new MapAction();
    action.operation = 'changeMap';
    action.targetMapId = 'test-map';
    action.x = 3;
    action.y = 7;
    const json = action.toJSON();
    const restored = new MapAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('changeMap');
    expect(restored.targetMapId).toBe('test-map');
  });
});

describe('ObjectAction', () => {
  it('has type "object"', () => {
    expect(new ObjectAction().type).toBe('object');
  });

  it('toJSON / fromJSON round-trips (move teleport)', () => {
    const action = new ObjectAction();
    action.operation = 'move';
    action.targetName = 'NPC';
    action.moveType = 'teleport';
    action.x = 10;
    action.y = 5;
    const json = action.toJSON();
    const restored = new ObjectAction();
    restored.fromJSON(json);
    expect(restored.operation).toBe('move');
    expect(restored.targetName).toBe('NPC');
    expect(restored.moveType).toBe('teleport');
    expect(restored.x).toBe(10);
  });

  it('toJSON / fromJSON round-trips (move walk)', () => {
    const action = new ObjectAction();
    action.operation = 'move';
    action.targetName = 'NPC';
    action.moveType = 'walk';
    action.x = 5;
    action.y = 3;
    const json = action.toJSON();
    const restored = new ObjectAction();
    restored.fromJSON(json);
    expect(restored.moveType).toBe('walk');
  });

  it('toJSON / fromJSON round-trips (face)', () => {
    const action = new ObjectAction();
    action.operation = 'face';
    action.targetName = 'self';
    action.direction = 'left';
    const json = action.toJSON();
    const restored = new ObjectAction();
    restored.fromJSON(json);
    expect(restored.direction).toBe('left');
  });

  it('toJSON / fromJSON round-trips (visible)', () => {
    const action = new ObjectAction();
    action.operation = 'visible';
    action.targetName = 'NPC';
    action.visible = false;
    const json = action.toJSON();
    const restored = new ObjectAction();
    restored.fromJSON(json);
    expect(restored.visible).toBe(false);
  });
});
