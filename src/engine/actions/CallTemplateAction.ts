import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

export class CallTemplateAction extends EventAction {
  readonly type = 'callTemplate';
  templateId = '';
  args: Record<string, unknown> = {};

  async execute(
    _context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    // No-op: template resolution not yet implemented
  }

  toJSON(): Record<string, unknown> {
    return { templateId: this.templateId, args: this.args };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.templateId = data.templateId as string;
    this.args = (data.args as Record<string, unknown>) ?? {};
  }
}
