import type { GameContext } from '../runtime/GameContext';
import { EventAction } from './EventAction';

/** 返り値の代入先 */
export interface ScriptResultTarget {
  /** 'game' = ゲーム変数、'object' = オブジェクト変数 */
  type: 'game' | 'object';
  /** 変数名 */
  variableName: string;
}

export class ScriptAction extends EventAction {
  readonly type = 'script';
  scriptId = '';
  args: Record<string, unknown> = {};
  /** 返り値の代入先（未設定なら返り値を無視） */
  resultTarget?: ScriptResultTarget;

  async execute(
    context: GameContext,
    _run: (actions: EventAction[]) => Promise<void>
  ): Promise<void> {
    const script = context.scriptRunner.findById(this.scriptId);
    if (!script) return;
    const result = context.scriptRunner.executeById(this.scriptId, context, this.args);
    const value = script.isAsync ? await result : result;

    // 返り値を変数に代入
    if (this.resultTarget && value !== undefined) {
      if (this.resultTarget.type === 'game') {
        context.variable.set(this.resultTarget.variableName, value);
      }
      // 'object' タイプはトリガー元オブジェクトの変数に代入（将来対応）
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      scriptId: this.scriptId,
      args: this.args,
      resultTarget: this.resultTarget,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.scriptId = data.scriptId as string;
    this.args = (data.args as Record<string, unknown>) ?? {};
    this.resultTarget = data.resultTarget as ScriptResultTarget | undefined;
  }
}
