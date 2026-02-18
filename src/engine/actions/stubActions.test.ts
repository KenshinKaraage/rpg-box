import type { GameContext } from '../runtime/GameContext';
import { WaitAction } from './WaitAction';
import { ObjectAction } from './ObjectAction';
import { MapAction } from './MapAction';

const noopRun = jest.fn();
const ctx = {} as GameContext;

describe('WaitAction', () => {
  it('has type "wait"', () => {
    expect(new WaitAction().type).toBe('wait');
  });

  it('execute is no-op', async () => {
    const action = new WaitAction();
    action.frames = 60;
    await action.execute(ctx, noopRun);
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

  it('execute is no-op', async () => {
    const action = new MapAction();
    action.operation = 'changeMap';
    action.targetMapId = 'map-2';
    await action.execute(ctx, noopRun);
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
