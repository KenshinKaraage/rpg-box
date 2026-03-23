import { UIAction, type UIActionManager } from './UIAction';

/**
 * UIキャンバス間のナビゲーションアクション
 *
 * メニュー内のサブ画面切り替えなど、UIキャンバス単位での遷移を行う。
 * ゲーム状態の遷移（マップ→バトルなど）はスクリプト/イベントシステムが担当する。
 */
export class NavigateAction extends UIAction {
  readonly type = 'uiNavigate';

  canvasId: string = '';
  transition: 'none' | 'fade' | 'slide' = 'none';

  async execute(_canvasId: string, manager: UIActionManager): Promise<void> {
    if (!this.canvasId) return;
    manager.showCanvas(this.canvasId);
  }

  toJSON(): Record<string, unknown> {
    return {
      canvasId: this.canvasId,
      transition: this.transition,
    };
  }

  fromJSON(data: Record<string, unknown>): void {
    this.canvasId = (data.canvasId as string) ?? '';
    this.transition = (data.transition as 'none' | 'fade' | 'slide') ?? 'none';
  }
}
