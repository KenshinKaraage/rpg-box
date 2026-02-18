import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class ObjectAction extends EventAction {
  readonly type = 'object';
  operation: 'move' | 'rotate' | 'autoWalk' = 'move';
  targetId = '';
  x?: number;
  y?: number;
  speed?: number;
  angle?: number;
  duration?: number;
  enabled?: boolean;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // No-op: map object system not yet implemented (Phase 10)
  }

  toJSON(): Record<string, unknown> {
    return {
      operation: this.operation,
      targetId: this.targetId,
      x: this.x,
      y: this.y,
      speed: this.speed,
      angle: this.angle,
      duration: this.duration,
      enabled: this.enabled,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.operation = data.operation as ObjectAction['operation'];
    this.targetId = data.targetId as string;
    this.x = data.x as number | undefined;
    this.y = data.y as number | undefined;
    this.speed = data.speed as number | undefined;
    this.angle = data.angle as number | undefined;
    this.duration = data.duration as number | undefined;
    this.enabled = data.enabled as boolean | undefined;
  }
}
