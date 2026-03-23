import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class ScriptAction extends EventAction {
  readonly type = 'script';
  scriptId = '';
  args: Record<string, unknown> = {};

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const script = context.scriptRunner.findById(this.scriptId);
    const promise = context.scriptRunner.executeById(this.scriptId, context, this.args);
    // isAsync: 完了まで待機する。それ以外: 待たずに次のアクションへ
    if (script?.isAsync) {
      await promise;
    }
  }

  toJSON(): Record<string, unknown> {
    return { scriptId: this.scriptId, args: this.args };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.scriptId = data.scriptId as string;
    this.args = (data.args as Record<string, unknown>) ?? {};
  }
}
