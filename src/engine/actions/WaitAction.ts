import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class WaitAction extends EventAction {
  readonly type = 'wait';
  frames = 60;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    await context.waitFrames(this.frames);
  }

  toJSON(): Record<string, unknown> {
    return { frames: this.frames };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.frames = (data.frames as number) ?? 60;
  }
}
