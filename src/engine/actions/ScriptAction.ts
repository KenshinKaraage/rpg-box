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
    console.log(`[ScriptAction] execute: scriptId="${this.scriptId}", args=`, this.args);
    const script = context.scriptRunner.findById(this.scriptId);
    if (!script) {
      console.warn(`[ScriptAction] script "${this.scriptId}" not found`);
      return;
    }
    console.log(`[ScriptAction] found script "${script.name}", isAsync=${script.isAsync}`);
    const promise = context.scriptRunner.executeById(this.scriptId, context, this.args);
    if (script.isAsync) {
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
