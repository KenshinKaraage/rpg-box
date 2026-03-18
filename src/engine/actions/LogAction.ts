import { EventAction } from './EventAction';
import type { GameContext } from '../runtime/GameContext';

/**
 * デバッグ用ログ出力アクション
 * console.log にメッセージを出力する
 */
export class LogAction extends EventAction {
  readonly type = 'log';

  message = '';

  async execute(context: GameContext): Promise<void> {
    console.log('[Game]', this.message);
  }

  toJSON(): Record<string, unknown> {
    return { message: this.message };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.message = (data.message as string) ?? '';
  }
}
