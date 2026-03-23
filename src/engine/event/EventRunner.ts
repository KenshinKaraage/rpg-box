import type { GameContext } from '../runtime/GameContext';
import type { EventAction } from '../actions/EventAction';
import type { ScriptAction } from '../actions/ScriptAction';

const MAX_ITERATIONS = 100_000;

export class EventRunner {
  private iterationCount = 0;

  /**
   * Run actions sequentially.
   * @param parentNextAction The next action after this block ends (from parent scope).
   *   Used to populate context.currentEvent.nextAction for the last action in a block.
   */
  async run(
    actions: EventAction[],
    context: GameContext,
    parentNextAction: EventAction | null = null
  ): Promise<void> {
    for (let i = 0; i < actions.length; i++) {
      this.iterationCount++;
      if (this.iterationCount > MAX_ITERATIONS) {
        throw new Error(`EventRunner: イテレーション上限 (${MAX_ITERATIONS}) を超えました`);
      }
      if (this.iterationCount % 1000 === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }

      // 次のアクション: 同じブロック内に次があればそれ、なければ親の次
      const localNext = i + 1 < actions.length ? actions[i + 1]! : parentNextAction;
      context.setNextAction(summarizeAction(localNext));

      // 子ブロック（Conditional/Loop）には localNext を伝播
      await actions[i]!.execute(context, (children) =>
        this.run(children, context, localNext)
      );
    }
  }
}

/**
 * EventAction を nextAction 情報に変換する。
 * スクリプトからは currentEvent.nextAction.type / .scriptId で参照される。
 */
function summarizeAction(action: EventAction | null): { type: string; scriptId?: string } | null {
  if (!action) return null;
  const summary: { type: string; scriptId?: string } = { type: action.type };
  if (action.type === 'script') {
    summary.scriptId = (action as ScriptAction).scriptId;
  }
  return summary;
}
