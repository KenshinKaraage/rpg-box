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
    await context.scriptRunner.executeById(this.scriptId, context, this.args);
  }

  toJSON(): Record<string, unknown> {
    return { scriptId: this.scriptId, args: this.args };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.scriptId = data.scriptId as string;
    this.args = (data.args as Record<string, unknown>) ?? {};
  }
}
