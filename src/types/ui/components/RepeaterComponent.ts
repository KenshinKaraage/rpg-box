import { UIComponent } from '../UIComponent';
import type { PropertyDef } from '../UIComponent';

/**
 * 配列データからテンプレートインスタンスを動的生成するコンポーネント
 *
 * スクリプトから getComponent("repeater").setData(items) で配列データを供給。
 * 各要素は TemplateControllerComponent の onApply を通じてUIに反映される。
 */
export class RepeaterComponent extends UIComponent {
  readonly type = 'repeater';
  readonly label = 'リピーター';

  /** 繰り返し生成するテンプレートID */
  templateId: string = '';

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'templateId', label: 'テンプレート', type: 'text' },
    ];
  }

  serialize(): unknown {
    return { templateId: this.templateId };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.templateId = (d.templateId as string) ?? '';
  }

  clone(): RepeaterComponent {
    const c = new RepeaterComponent();
    c.templateId = this.templateId;
    return c;
  }
}
