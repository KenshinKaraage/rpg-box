import { UIAction } from './UIAction';

/**
 * 対象UIオブジェクトのActionComponentに定義されたアクションエントリを発火する
 *
 * 例: ボタンの「onClick」エントリを別のファンクションから呼び出す
 */
export class TriggerObjectActionAction extends UIAction {
  readonly type = 'uiTriggerObjectAction';

  targetId: string = '';
  actionEntryName: string = '';

  toJSON(): Record<string, unknown> {
    return {
      targetId: this.targetId,
      actionEntryName: this.actionEntryName,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.targetId = (data.targetId as string) ?? '';
    this.actionEntryName = (data.actionEntryName as string) ?? '';
  }
}
