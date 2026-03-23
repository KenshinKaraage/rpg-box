import { UIAction, type UIActionManager } from './UIAction';

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

  async execute(canvasId: string, manager: UIActionManager): Promise<void> {
    if (!this.targetId) return;
    manager.setPropertyById(canvasId, this.targetId, this.component, this.property, this.value);
  }

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
