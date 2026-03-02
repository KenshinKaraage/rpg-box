import { UIAction } from './UIAction';

/**
 * 登録された関数を呼び出すアクション
 *
 * ランタイムの関数レジストリに登録された関数を名前で呼び出す。
 */
export class CallFunctionAction extends UIAction {
  readonly type = 'uiCallFunction';

  functionName: string = '';
  args: Record<string, unknown> = {};

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
