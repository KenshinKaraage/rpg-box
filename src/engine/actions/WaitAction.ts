import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class WaitAction extends EventAction {
  readonly type = 'wait';
  frames = 60;

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // No-op: game loop not yet implemented (Phase 18)
  }

  toJSON(): Record<string, unknown> {
    return { frames: this.frames };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.frames = (data.frames as number) ?? 60;
  }
}
