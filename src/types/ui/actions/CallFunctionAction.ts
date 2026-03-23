import { UIAction, type UIActionManager } from './UIAction';

/**
 * 登録された関数を呼び出すアクション
 *
 * ランタイムの関数レジストリに登録された関数を名前で呼び出す。
 */
export class CallFunctionAction extends UIAction {
  readonly type = 'uiCallFunction';

  functionName: string = '';
  args: Record<string, unknown> = {};

  async execute(canvasId: string, manager: UIActionManager, fnArgs: Record<string, unknown>, depth: number): Promise<void> {
    if (!this.functionName) return;
    const mergedArgs = { ...fnArgs, ...this.args };
    await manager.executeFunction(canvasId, this.functionName, mergedArgs, depth + 1);
  }

  toJSON(): Record<string, unknown> {
    return {
      functionName: this.functionName,
      args: structuredClone(this.args),
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.functionName = (data.functionName as string) ?? '';
    this.args = data.args ? structuredClone(data.args as Record<string, unknown>) : {};
  }
}
