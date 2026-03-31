import type { GameContext } from '../runtime/GameContext';
import type { EventAction, EventExecuteOptions } from '../actions/EventAction';
import type { ScriptAction } from '../actions/ScriptAction';

const MAX_ITERATIONS = 100_000;

export class EventRunner {
  private iterationCount = 0;

  /**
   * Run actions sequentially.
   * @param parentNextAction The next action after this block ends (from parent scope).
   * @param options Optional: trigger object reference etc. Passed to every action.
   */
  async run(
    actions: EventAction[],
    context: GameContext,
    parentNextAction: EventAction | null = null,
    options?: EventExecuteOptions
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

      // 子ブロック（Conditional/Loop）には localNext + options を伝播
      await actions[i]!.execute(context, (children) =>
        this.run(children, context, localNext, options),
        options
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
