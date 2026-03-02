import { UIAction } from './UIAction';

/**
 * UIオブジェクトのプロパティを設定するアクション
 *
 * targetId が空の場合は自身（ActionComponent の所有者）を対象にする。
 */
export class SetPropertyAction extends UIAction {
  readonly type = 'uiSetProperty';

  targetId: string = '';
  /** 対象コンポーネントタイプ。'transform' または各 UIComponent の type */
  component: string = 'transform';
  property: string = '';
  value: unknown = 0;

  toJSON(): Record<string, unknown> {
    return {
      targetId: this.targetId,
      component: this.component,
      property: this.property,
      value: this.value,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.targetId = (data.targetId as string) ?? '';
    this.component = (data.component as string) ?? 'transform';
    this.property = (data.property as string) ?? '';
    this.value = data.value ?? 0;
  }
}
