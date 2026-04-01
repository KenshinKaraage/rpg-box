import { UIComponent, type PropertyDef } from '../UIComponent';

export class LayoutElementComponent extends UIComponent {
  readonly type = 'layoutElement';
  readonly label = 'レイアウト要素';

  /** レイアウトに参加するか（false = 配置スキップ、元の transform を維持） */
  participate = true;
  /** この要素の後に追加するスペース（px） */
  space = 0;

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'participate', label: 'レイアウト参加', type: 'boolean' },
      { key: 'space', label: '追加スペース', type: 'number', min: 0 },
    ];
  }

  serialize(): Record<string, unknown> {
    return {
      participate: this.participate,
      space: this.space,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.participate = (data.participate as boolean) ?? true;
    this.space = (data.space as number) ?? 0;
  }

  clone(): LayoutElementComponent {
    const c = new LayoutElementComponent();
    c.participate = this.participate;
    c.space = this.space;
    return c;
  }
}
