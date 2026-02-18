import type { GameContext } from '../runtime/GameContext';

import { EventAction } from './EventAction';

export class LoopAction extends EventAction {
  readonly type = 'loop';
  count?: number;
  actions: EventAction[] = [];

  async execute(
    _context: GameContext,
    run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    if (this.count !== undefined) {
      for (let i = 0; i < this.count; i++) {
        await run(this.actions);
      }
    } else {
      // Infinite loop — relies on EventRunner's iteration limit
      for (;;) {
        await run(this.actions);
      }
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      count: this.count,
      actions: this.actions.map((a) => ({ type: a.type, data: a.toJSON() })),
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.count = data.count as number | undefined;
  }
}
