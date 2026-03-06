import { GameWorld } from './GameWorld';
import type { GameMap, Chipset, MapObject, SerializedComponent } from '@/lib/storage/types';
import type { InputManager } from './InputManager';

// ── Helpers ──

function makeComponent(type: string, data: Record<string, unknown> = {}): SerializedComponent {
  return { type, data };
}

function makeObject(
  id: string,
  x: number,
  y: number,
  components: SerializedComponent[] = []
): MapObject {
  return {
    id,
    name: id,
    components: [makeComponent('transform', { x, y }), ...components],
  };
}

function makeMap(
  width: number,
  height: number,
  objects: MapObject[] = [],
  tiles?: string[][]
): GameMap {
  const layers = [];
  if (tiles) {
    layers.push({ id: 'tile1', name: 'Ground', type: 'tile' as const, tiles });
  }
  layers.push({ id: 'obj1', name: 'Objects', type: 'object' as const, objects });
  return { id: 'map1', name: 'Test Map', width, height, layers, fields: [], values: {} };
}

function makeChipset(passableMap: Record<number, boolean> = {}): Chipset {
  const chips = Object.entries(passableMap).map(([idx, passable]) => ({
    index: parseInt(idx, 10),
    values: { passable },
  }));
  return { id: 'cs1', name: 'Test', imageId: 'img1', tileWidth: 32, tileHeight: 32, fields: [], chips };
}

function mockInput(pressed: Record<string, boolean> = {}): InputManager {
  return {
    isDown: (button: string) => pressed[button] ?? false,
    isJustPressed: (button: string) => pressed[button] ?? false,
    isJustReleased: () => false,
    update: () => {},
  } as unknown as InputManager;
}

// ── Tests ──

describe('GameWorld', () => {
  describe('loadMap', () => {
    it('creates runtime objects from map', () => {
      const world = new GameWorld();
      const obj = makeObject('npc1', 3, 5);
      const map = makeMap(10, 10, [obj]);

      world.loadMap(map, [], []);

      expect(world.objects).toHaveLength(1);
      expect(world.objects[0]!.gridX).toBe(3);
      expect(world.objects[0]!.gridY).toBe(5);
      expect(world.objects[0]!.pixelX).toBe(3 * 32);
      expect(world.objects[0]!.pixelY).toBe(5 * 32);
    });

    it('sets activeController to first object with ControllerComponent', () => {
      const world = new GameWorld();
      const player = makeObject('player', 1, 1, [
        makeComponent('controller', { moveSpeed: 4, inputEnabled: true }),
      ]);
      const npc = makeObject('npc', 5, 5);
      const map = makeMap(10, 10, [player, npc]);

      world.loadMap(map, [], []);

      expect(world.activeController).not.toBeNull();
      expect(world.activeController!.id).toBe('player');
    });

    it('sets activeController to null when no controller exists', () => {
      const world = new GameWorld();
      world.loadMap(makeMap(10, 10, [makeObject('npc', 0, 0)]), [], []);
      expect(world.activeController).toBeNull();
    });
  });

  describe('canMove', () => {
    it('blocks movement outside map bounds', () => {
      const world = new GameWorld();
      world.loadMap(makeMap(5, 5), [], []);

      expect(world.canMove(0, 0, -1, 0)).toBe(false);
      expect(world.canMove(0, 0, 0, -1)).toBe(false);
      expect(world.canMove(4, 4, 5, 4)).toBe(false);
      expect(world.canMove(4, 4, 4, 5)).toBe(false);
    });

    it('allows movement to empty tile', () => {
      const world = new GameWorld();
      world.loadMap(makeMap(5, 5), [], []);
      expect(world.canMove(0, 0, 1, 0)).toBe(true);
    });

    it('blocks movement to impassable tile', () => {
      const world = new GameWorld();
      const tiles = [
        ['cs1:0', 'cs1:1'],
        ['cs1:0', 'cs1:0'],
      ];
      const chipset = makeChipset({ 0: true, 1: false });
      world.loadMap(makeMap(2, 2, [], tiles), [chipset], []);

      expect(world.canMove(0, 0, 1, 0)).toBe(false);
      expect(world.canMove(0, 0, 0, 1)).toBe(true);
    });

    it('blocks movement to tile with non-passable collider', () => {
      const world = new GameWorld();
      const wall = makeObject('wall', 2, 0, [
        makeComponent('collider', { passable: false }),
      ]);
      world.loadMap(makeMap(5, 5, [wall]), [], []);
      expect(world.canMove(1, 0, 2, 0)).toBe(false);
    });

    it('allows movement to tile with passable collider', () => {
      const world = new GameWorld();
      const trigger = makeObject('trigger', 2, 0, [
        makeComponent('collider', { passable: true }),
      ]);
      world.loadMap(makeMap(5, 5, [trigger]), [], []);
      expect(world.canMove(1, 0, 2, 0)).toBe(true);
    });
  });

  describe('movement (unified)', () => {
    it('moves controller object when direction key is held', () => {
      const world = new GameWorld();
      const player = makeObject('player', 1, 1, [
        makeComponent('controller', { moveSpeed: 4, inputEnabled: true }),
      ]);
      world.loadMap(makeMap(10, 10, [player]), [], []);

      world.update(1 / 60, mockInput({ right: true }));

      const obj = world.objects[0]!;
      expect(obj.isMoving).toBe(true);
      expect(obj.facing).toBe('right');
      expect(obj.moveTargetX).toBe(2);
    });

    it('blocks controller movement when event is running', () => {
      const world = new GameWorld();
      const player = makeObject('player', 1, 1, [
        makeComponent('controller', { moveSpeed: 4, inputEnabled: true }),
      ]);
      world.loadMap(makeMap(10, 10, [player]), [], []);

      world.setEventRunning(true);
      world.update(1 / 60, mockInput({ right: true }));

      expect(world.objects[0]!.isMoving).toBe(false);
    });

    it('allows movement with stopOnEvent=false during event', () => {
      const world = new GameWorld();
      const npc = makeObject('npc', 1, 1, [
        makeComponent('movement', { pattern: 'random', speed: 2, stopOnEvent: false }),
      ]);
      world.loadMap(makeMap(10, 10, [npc]), [], []);
      world.setEventRunning(true);

      // Random movement — run many frames to get at least one move
      const noInput = mockInput();
      let moved = false;
      for (let i = 0; i < 1000; i++) {
        world.update(1 / 60, noInput);
        if (world.objects[0]!.isMoving) {
          moved = true;
          break;
        }
      }
      expect(moved).toBe(true);
    });

    it('blocks movement with stopOnEvent=true (default) during event', () => {
      const world = new GameWorld();
      const npc = makeObject('npc', 1, 1, [
        makeComponent('movement', { pattern: 'random', speed: 2 }),
      ]);
      world.loadMap(makeMap(10, 10, [npc]), [], []);
      world.setEventRunning(true);

      const noInput = mockInput();
      for (let i = 0; i < 1000; i++) {
        world.update(1 / 60, noInput);
      }
      expect(world.objects[0]!.isMoving).toBe(false);
    });

    it('completes movement after enough frames', () => {
      const world = new GameWorld();
      const player = makeObject('player', 1, 1, [
        makeComponent('controller', { moveSpeed: 4, inputEnabled: true }),
      ]);
      world.loadMap(makeMap(10, 10, [player]), [], []);

      world.update(1 / 60, mockInput({ right: true }));
      expect(world.objects[0]!.isMoving).toBe(true);

      const noInput = mockInput();
      for (let i = 0; i < 20; i++) {
        world.update(1 / 60, noInput);
      }

      const obj = world.objects[0]!;
      expect(obj.isMoving).toBe(false);
      expect(obj.gridX).toBe(2);
      expect(obj.gridY).toBe(1);
      expect(obj.pixelX).toBe(2 * 32);
    });

    it('interpolates pixel position during movement', () => {
      const world = new GameWorld();
      const player = makeObject('player', 0, 0, [
        makeComponent('controller', { moveSpeed: 4, inputEnabled: true }),
      ]);
      world.loadMap(makeMap(10, 10, [player]), [], []);

      world.update(1 / 60, mockInput({ right: true })); // starts move
      world.update(1 / 60, mockInput()); // advances movement

      const obj = world.objects[0]!;
      expect(obj.pixelX).toBeGreaterThan(0);
      expect(obj.pixelX).toBeLessThan(32);
    });

    it('treats multiple controller objects uniformly', () => {
      const world = new GameWorld();
      const p1 = makeObject('p1', 1, 0, [
        makeComponent('controller', { moveSpeed: 4, inputEnabled: true }),
      ]);
      const p2 = makeObject('p2', 3, 0, [
        makeComponent('controller', { moveSpeed: 4, inputEnabled: true }),
      ]);
      world.loadMap(makeMap(10, 10, [p1, p2]), [], []);

      world.update(1 / 60, mockInput({ right: true }));

      // Both should start moving
      expect(world.objects[0]!.isMoving).toBe(true);
      expect(world.objects[1]!.isMoving).toBe(true);
      // activeController is the first one
      expect(world.activeController!.id).toBe('p1');
    });
  });

  describe('getObjectAtTile', () => {
    it('finds object at given tile', () => {
      const world = new GameWorld();
      const obj = makeObject('npc', 3, 4);
      world.loadMap(makeMap(10, 10, [obj]), [], []);

      expect(world.getObjectAtTile(3, 4)?.id).toBe('npc');
      expect(world.getObjectAtTile(0, 0)).toBeNull();
    });
  });
});
