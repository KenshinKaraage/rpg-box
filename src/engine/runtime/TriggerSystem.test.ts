import { TriggerSystem } from './TriggerSystem';
import type { GameWorld, RuntimeObject, Direction } from './GameWorld';
import type { InputManager } from './InputManager';

// ── Helpers ──

function makeRuntimeObject(
  id: string,
  gx: number,
  gy: number,
  components: Record<string, Record<string, unknown>> = {},
  facing: Direction = 'down'
): RuntimeObject {
  return {
    id,
    name: id,
    components,
    gridX: gx,
    gridY: gy,
    pixelX: gx * 32,
    pixelY: gy * 32,
    facing,
    isMoving: false,
    moveProgress: 0,
    moveTargetX: gx,
    moveTargetY: gy,
  };
}

function mockInput(justPressed: Record<string, boolean> = {}): InputManager {
  return {
    isDown: () => false,
    isJustPressed: (button: string) => justPressed[button] ?? false,
    isJustReleased: () => false,
    update: () => {},
  } as unknown as InputManager;
}

function mockWorld(
  objects: RuntimeObject[],
  activeController: RuntimeObject | null = null
): GameWorld {
  return {
    objects,
    activeController,
    getObjectAtTile: (x: number, y: number) =>
      objects.find((o) => o.gridX === x && o.gridY === y) ?? null,
  } as unknown as GameWorld;
}

// ── Tests ──

describe('TriggerSystem', () => {
  describe('TalkTrigger', () => {
    it('fires when confirm pressed and player faces object', () => {
      const player = makeRuntimeObject('player', 1, 1, {}, 'right');
      const npc = makeRuntimeObject('npc', 2, 1, {
        talkTrigger: { eventId: 'evt1', direction: 'front' },
      });
      const world = mockWorld([player, npc], player);
      const trigger = new TriggerSystem();

      const result = trigger.update(world, mockInput({ confirm: true }));

      expect(result).toEqual({ eventId: 'evt1', targetObject: npc });
    });

    it('does not fire when player faces wrong direction', () => {
      const player = makeRuntimeObject('player', 1, 1, {}, 'left');
      const npc = makeRuntimeObject('npc', 2, 1, {
        talkTrigger: { eventId: 'evt1', direction: 'front' },
      });
      const world = mockWorld([player, npc], player);
      const trigger = new TriggerSystem();

      const result = trigger.update(world, mockInput({ confirm: true }));

      expect(result).toBeNull();
    });

    it('fires with direction=any regardless of facing', () => {
      const player = makeRuntimeObject('player', 1, 1, {}, 'left');
      const npc = makeRuntimeObject('npc', 2, 1, {
        talkTrigger: { eventId: 'evt1', direction: 'any' },
      });
      const world = mockWorld([player, npc], player);
      const trigger = new TriggerSystem();

      // Player faces left but npc is to the right — still fires with 'any'
      // Need to be adjacent though
      const npcLeft = makeRuntimeObject('npc2', 0, 1, {
        talkTrigger: { eventId: 'evt2', direction: 'any' },
      });
      const world2 = mockWorld([player, npcLeft], player);
      const result = trigger.update(world2, mockInput({ confirm: true }));

      expect(result).toEqual({ eventId: 'evt2', targetObject: npcLeft });
    });

    it('does not fire without confirm press', () => {
      const player = makeRuntimeObject('player', 1, 1, {}, 'right');
      const npc = makeRuntimeObject('npc', 2, 1, {
        talkTrigger: { eventId: 'evt1', direction: 'front' },
      });
      const world = mockWorld([player, npc], player);
      const trigger = new TriggerSystem();

      const result = trigger.update(world, mockInput());

      expect(result).toBeNull();
    });
  });

  describe('TouchTrigger', () => {
    it('fires when player moves onto object tile', () => {
      const player = makeRuntimeObject('player', 2, 1, {});
      player.isMoving = false;
      const obj = makeRuntimeObject('portal', 2, 1, {
        touchTrigger: { eventId: 'evt_touch' },
      });
      const world = mockWorld([player, obj], player);
      const trigger = new TriggerSystem();

      // First update: player at (2,1) just arrived — should fire
      // We track "previous position" internally, so simulate arrival
      // by having player previously at a different tile
      trigger.notifyMoveCompleted(player, 1, 1); // moved from (1,1) to current (2,1)
      const result = trigger.update(world, mockInput());

      expect(result).toEqual({ eventId: 'evt_touch', targetObject: obj });
    });

    it('does not fire when player has not moved', () => {
      const player = makeRuntimeObject('player', 2, 1, {});
      const obj = makeRuntimeObject('portal', 2, 1, {
        touchTrigger: { eventId: 'evt_touch' },
      });
      const world = mockWorld([player, obj], player);
      const trigger = new TriggerSystem();

      const result = trigger.update(world, mockInput());

      expect(result).toBeNull();
    });
  });

  describe('StepTrigger', () => {
    it('fires when player steps on the trigger object tile', () => {
      const player = makeRuntimeObject('player', 3, 2, {});
      const trap = makeRuntimeObject('trap', 3, 2, {
        stepTrigger: { eventId: 'evt_step' },
      });
      const world = mockWorld([player, trap], player);
      const trigger = new TriggerSystem();

      trigger.notifyMoveCompleted(player, 2, 2);
      const result = trigger.update(world, mockInput());

      expect(result).toEqual({ eventId: 'evt_step', targetObject: trap });
    });
  });

  describe('AutoTrigger', () => {
    it('fires once on first update when runOnce=true', () => {
      const obj = makeRuntimeObject('intro', 0, 0, {
        autoTrigger: { eventId: 'evt_auto', runOnce: true, interval: 0 },
      });
      const world = mockWorld([obj]);
      const trigger = new TriggerSystem();

      const r1 = trigger.update(world, mockInput());
      expect(r1).toEqual({ eventId: 'evt_auto', targetObject: obj });

      // Second time: should not fire
      const r2 = trigger.update(world, mockInput());
      expect(r2).toBeNull();
    });

    it('fires repeatedly with interval', () => {
      const obj = makeRuntimeObject('rain', 0, 0, {
        autoTrigger: { eventId: 'evt_rain', runOnce: false, interval: 3 },
      });
      const world = mockWorld([obj]);
      const trigger = new TriggerSystem();

      // Frame 1: fires (first time)
      const r1 = trigger.update(world, mockInput());
      expect(r1).toEqual({ eventId: 'evt_rain', targetObject: obj });

      // Frames 2-3: does not fire (interval=3)
      expect(trigger.update(world, mockInput())).toBeNull();
      expect(trigger.update(world, mockInput())).toBeNull();

      // Frame 4: fires again
      const r4 = trigger.update(world, mockInput());
      expect(r4).toEqual({ eventId: 'evt_rain', targetObject: obj });
    });
  });

  describe('InputTrigger', () => {
    it('fires when specified key is just pressed', () => {
      const obj = makeRuntimeObject('menu', 0, 0, {
        inputTrigger: { eventId: 'evt_menu', key: 'menu' },
      });
      const world = mockWorld([obj]);
      const trigger = new TriggerSystem();

      const result = trigger.update(world, mockInput({ menu: true }));

      expect(result).toEqual({ eventId: 'evt_menu', targetObject: obj });
    });

    it('does not fire for wrong key', () => {
      const obj = makeRuntimeObject('menu', 0, 0, {
        inputTrigger: { eventId: 'evt_menu', key: 'menu' },
      });
      const world = mockWorld([obj]);
      const trigger = new TriggerSystem();

      const result = trigger.update(world, mockInput({ confirm: true }));

      expect(result).toBeNull();
    });
  });

  describe('priority', () => {
    it('talk trigger takes priority over touch/step', () => {
      const player = makeRuntimeObject('player', 1, 1, {}, 'right');
      const npc = makeRuntimeObject('npc', 2, 1, {
        talkTrigger: { eventId: 'evt_talk', direction: 'front' },
        touchTrigger: { eventId: 'evt_touch' },
      });
      const world = mockWorld([player, npc], player);
      const trigger = new TriggerSystem();

      trigger.notifyMoveCompleted(player, 0, 1);
      const result = trigger.update(world, mockInput({ confirm: true }));

      // Talk takes priority
      expect(result?.eventId).toBe('evt_talk');
    });
  });

  describe('no activeController', () => {
    it('still evaluates auto and input triggers', () => {
      const obj = makeRuntimeObject('bg', 0, 0, {
        autoTrigger: { eventId: 'evt_auto', runOnce: true, interval: 0 },
      });
      const world = mockWorld([obj], null);
      const trigger = new TriggerSystem();

      const result = trigger.update(world, mockInput());

      expect(result).toEqual({ eventId: 'evt_auto', targetObject: obj });
    });
  });
});
