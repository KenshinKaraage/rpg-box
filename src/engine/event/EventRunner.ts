import type { GameContext } from '../runtime/GameContext';
import type { EventAction } from '../actions/EventAction';

const MAX_ITERATIONS = 100_000;

export class EventRunner {
  private iterationCount = 0;

  async run(actions: EventAction[], context: GameContext): Promise<void> {
    for (const action of actions) {
      this.iterationCount++;
      if (this.iterationCount > MAX_ITERATIONS) {
        throw new Error(`EventRunner: イテレーション上限 (${MAX_ITERATIONS}) を超えました`);
      }
      // Yield to event loop periodically to prevent stack overflow on deep recursion
      if (this.iterationCount % 1000 === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
      await action.execute(context, (children) => this.run(children, context));
    }
  }
}
