import { UIAction } from './UIAction';

/**
 * UIオブジェクトのプロパティを設定するアクション
 *
 * targetId が空の場合は自身（ActionComponent の所有者）を対象にする。
 */
export class SetPropertyAction extends UIAction {
  readonly type = 'uiSetProperty';

  targetId: string = '';
  property: string = '';
  value: unknown = 0;

  toJSON(): Record<string, unknown> {
    return {
      targetId: this.targetId,
      property: this.property,
      value: this.value,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.targetId = (data.targetId as string) ?? '';
    this.property = (data.property as string) ?? '';
    this.value = data.value ?? 0;
  }
}
