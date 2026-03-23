import { UIAction, type UIActionManager } from './UIAction';

/**
 * プロパティの値ソース
 * - literal: 固定値（直接入力した値）
 * - arg: UIFunction の引数（argId で参照）
 */
export type PropertyValueSource =
  | { source: 'literal'; value: unknown }
  | { source: 'arg'; argId: string };

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
  valueSource: PropertyValueSource = { source: 'literal', value: 0 };

  async execute(canvasId: string, manager: UIActionManager, fnArgs: Record<string, unknown>): Promise<void> {
    if (!this.targetId) return;
    const resolved = this.resolveValue(fnArgs);
    manager.setPropertyById(canvasId, this.targetId, this.component, this.property, resolved);
  }

  private resolveValue(fnArgs: Record<string, unknown>): unknown {
    if (this.valueSource.source === 'arg') {
      return fnArgs[this.valueSource.argId];
    }
    return this.valueSource.value;
  }

  toJSON(): Record<string, unknown> {
    return {
      targetId: this.targetId,
      component: this.component,
      property: this.property,
      valueSource: this.valueSource,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.targetId = (data.targetId as string) ?? '';
    this.component = (data.component as string) ?? 'transform';
    this.property = (data.property as string) ?? '';
    // 後方互換: 古いデータは value フィールドで保存されている
    if (data.valueSource) {
      this.valueSource = data.valueSource as PropertyValueSource;
    } else if ('value' in data) {
      this.valueSource = { source: 'literal', value: data.value ?? 0 };
    }
  }
}
