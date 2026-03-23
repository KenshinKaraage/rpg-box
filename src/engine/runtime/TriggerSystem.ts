/**
 * Evaluates trigger components on map objects each frame.
 * Returns the first triggered event (if any) for the GameRuntime to execute.
 *
 * Priority order: Talk > Touch/Step > Auto > Input
 */

import type { GameWorld, RuntimeObject, Direction } from './GameWorld';
import type { InputManager, GameButton } from './InputManager';

// ── Types ──

export interface TriggerResult {
  eventId: string;
  targetObject: RuntimeObject;
  triggerType: string;
}

// ── Direction helpers ──

const DIR_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

// ── TriggerSystem ──

export class TriggerSystem {
  /** Objects whose move just completed (fromX, fromY recorded). */
  private moveCompletions = new Map<string, { fromX: number; fromY: number }>();

  /** Auto triggers that have already fired (runOnce tracking). */
  private firedAutoTriggers = new Set<string>();

  /** Frame counters for interval-based auto triggers. */
  private autoTriggerCounters = new Map<string, number>();

  /** Notify that an object completed a grid move (call from GameRuntime). */
  notifyMoveCompleted(obj: RuntimeObject, fromX: number, fromY: number): void {
    this.moveCompletions.set(obj.id, { fromX, fromY });
  }

  /** Reset state (e.g. on map change). */
  reset(): void {
    this.moveCompletions.clear();
    this.firedAutoTriggers.clear();
    this.autoTriggerCounters.clear();
  }

  /** Evaluate all triggers. Returns first triggered event or null. */
  update(world: GameWorld, input: InputManager): TriggerResult | null {
    const ctrl = world.activeController;

    // 1. Talk triggers (confirm + facing direction)
    if (ctrl && input.isJustPressed('confirm')) {
      console.log(`[TriggerSystem] confirm pressed, checking talk triggers. ctrl at (${ctrl.gridX}, ${ctrl.gridY}) facing ${ctrl.facing}`);
      const result = this.checkTalkTriggers(world, ctrl);
      if (result) {
        console.log(`[TriggerSystem] talk trigger hit:`, result.eventId, result.targetObject.id);
        this.moveCompletions.clear();
        return result;
      }
      console.log(`[TriggerSystem] no talk trigger found`);
    }

    // 2. Touch / Step triggers (player just moved)
    if (ctrl) {
      const moveInfo = this.moveCompletions.get(ctrl.id);
      if (moveInfo) {
        const result = this.checkTouchStepTriggers(world, ctrl);
        if (result) {
          this.moveCompletions.clear();
          return result;
        }
      }
    }

    // Clear move completions after checking
    this.moveCompletions.clear();

    // 3. Auto triggers
    const autoResult = this.checkAutoTriggers(world);
    if (autoResult) return autoResult;

    // 4. Input triggers
    const inputResult = this.checkInputTriggers(world, input);
    if (inputResult) return inputResult;

    return null;
  }

  // ── Private: Talk ──

  private checkTalkTriggers(world: GameWorld, ctrl: RuntimeObject): TriggerResult | null {
    const delta = DIR_DELTA[ctrl.facing];
    const targetX = ctrl.gridX + delta.dx;
    const targetY = ctrl.gridY + delta.dy;

    const target = world.getObjectAtTile(targetX, targetY);
    if (!target) return null;

    const talk = target.components['talkTrigger'];
    if (!talk) return null;

    const hasActions = Array.isArray(talk.actions) && (talk.actions as unknown[]).length > 0;
    if (!talk.eventId && !hasActions) return null;

    if (talk.direction === 'front') {
      return { eventId: talk.eventId as string, targetObject: target, triggerType: 'talkTrigger' };
    }

    if (talk.direction === 'any') {
      return { eventId: talk.eventId as string, targetObject: target, triggerType: 'talkTrigger' };
    }

    return null;
  }

  // ── Private: Touch / Step ──

  private checkTouchStepTriggers(world: GameWorld, ctrl: RuntimeObject): TriggerResult | null {
    for (const obj of world.objects) {
      if (obj.id === ctrl.id) continue;
      if (obj.gridX !== ctrl.gridX || obj.gridY !== ctrl.gridY) continue;

      // Touch trigger: player walked onto this object
      const touch = obj.components['touchTrigger'];
      if (touch) {
        const hasActions = Array.isArray(touch.actions) && (touch.actions as unknown[]).length > 0;
        if (touch.eventId || hasActions) {
          return { eventId: touch.eventId as string, targetObject: obj, triggerType: 'touchTrigger' };
        }
      }

      // Step trigger: same as touch (player stepped on object's tile)
      const step = obj.components['stepTrigger'];
      if (step) {
        const hasActions = Array.isArray(step.actions) && (step.actions as unknown[]).length > 0;
        if (step.eventId || hasActions) {
          return { eventId: step.eventId as string, targetObject: obj, triggerType: 'stepTrigger' };
        }
      }
    }
    return null;
  }

  // ── Private: Auto ──

  private checkAutoTriggers(world: GameWorld): TriggerResult | null {
    for (const obj of world.objects) {
      const auto = obj.components['autoTrigger'];
      if (!auto) continue;
      const hasActions = Array.isArray(auto.actions) && (auto.actions as unknown[]).length > 0;
      if (!auto.eventId && !hasActions) continue;

      const key = obj.id;
      const runOnce = (auto.runOnce as boolean) ?? true;
      const interval = (auto.interval as number) ?? 0;

      if (runOnce) {
        if (this.firedAutoTriggers.has(key)) continue;
        this.firedAutoTriggers.add(key);
        return { eventId: auto.eventId as string, targetObject: obj, triggerType: 'autoTrigger' };
      }

      // Interval-based: fire immediately on first frame, then every `interval` frames
      const counter = this.autoTriggerCounters.get(key);
      if (counter === undefined) {
        // First time — fire immediately
        this.autoTriggerCounters.set(key, 0);
        return { eventId: auto.eventId as string, targetObject: obj, triggerType: 'autoTrigger' };
      }
      const next = counter + 1;
      if (next >= interval) {
        this.autoTriggerCounters.set(key, 0);
        return { eventId: auto.eventId as string, targetObject: obj, triggerType: 'autoTrigger' };
      }
      this.autoTriggerCounters.set(key, next);
    }
    return null;
  }

  // ── Private: Input ──

  private checkInputTriggers(world: GameWorld, input: InputManager): TriggerResult | null {
    for (const obj of world.objects) {
      const trigger = obj.components['inputTrigger'];
      if (!trigger || !trigger.key) continue;

      const hasActions = Array.isArray(trigger.actions) && (trigger.actions as unknown[]).length > 0;
      if (!trigger.eventId && !hasActions) continue;

      if (input.isJustPressed(trigger.key as GameButton)) {
        return { eventId: trigger.eventId as string, targetObject: obj, triggerType: 'inputTrigger' };
      }
    }
    return null;
  }
}
