import { UIComponent, type PropertyDef } from '../UIComponent';

export class LayoutGroupComponent extends UIComponent {
  readonly type = 'layoutGroup';
  readonly label = 'レイアウトグループ';

  direction: 'horizontal' | 'vertical' = 'vertical';
  spacing = 0;
  alignment: 'start' | 'center' | 'end' = 'start';
  reverseOrder = false;

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'vertical', label: '垂直' },
          { value: 'horizontal', label: '水平' },
        ],
      },
      { key: 'spacing', label: '間隔', type: 'number', min: 0 },
      {
        key: 'alignment',
        label: '配置',
        type: 'select',
        options: [
          { value: 'start', label: '先頭' },
          { value: 'center', label: '中央' },
          { value: 'end', label: '末尾' },
        ],
      },
      { key: 'reverseOrder', label: '逆順', type: 'boolean' },
    ];
  }

  serialize(): Record<string, unknown> {
    return {
      direction: this.direction,
      spacing: this.spacing,
      alignment: this.alignment,
      reverseOrder: this.reverseOrder,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.direction = (data.direction as 'horizontal' | 'vertical') ?? 'vertical';
    this.spacing = (data.spacing as number) ?? 0;
    this.alignment = (data.alignment as 'start' | 'center' | 'end') ?? 'start';
    this.reverseOrder = (data.reverseOrder as boolean) ?? false;
  }

  clone(): LayoutGroupComponent {
    const c = new LayoutGroupComponent();
    c.direction = this.direction;
    c.spacing = this.spacing;
    c.alignment = this.alignment;
    c.reverseOrder = this.reverseOrder;
    return c;
  }
}
