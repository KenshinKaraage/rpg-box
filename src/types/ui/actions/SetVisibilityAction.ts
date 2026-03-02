import { UIAction } from './UIAction';

/**
 * UIオブジェクトの表示/非表示を切り替えるアクション
 *
 * targetId が空の場合は自身を対象にする。
 */
export class SetVisibilityAction extends UIAction {
  readonly type = 'uiSetVisibility';

  targetId: string = '';
  visible: boolean = true;

  toJSON(): Record<string, unknown> {
    return {
      targetId: this.targetId,
      visible: this.visible,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.targetId = (data.targetId as string) ?? '';
    this.visible = (data.visible as boolean) ?? true;
  }
}
