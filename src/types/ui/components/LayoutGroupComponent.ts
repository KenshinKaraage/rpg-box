import { UIComponent, type PropertyDef } from '../UIComponent';

export class LayoutGroupComponent extends UIComponent {
  readonly type = 'layoutGroup';
  readonly label = 'レイアウトグループ';

  direction: 'horizontal' | 'vertical' = 'vertical';
  spacing = 0;
  paddingTop = 0;
  paddingBottom = 0;
  paddingLeft = 0;
  paddingRight = 0;
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
      { key: 'paddingTop', label: '上余白', type: 'number', min: 0 },
      { key: 'paddingBottom', label: '下余白', type: 'number', min: 0 },
      { key: 'paddingLeft', label: '左余白', type: 'number', min: 0 },
      { key: 'paddingRight', label: '右余白', type: 'number', min: 0 },
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
      paddingTop: this.paddingTop,
      paddingBottom: this.paddingBottom,
      paddingLeft: this.paddingLeft,
      paddingRight: this.paddingRight,
      alignment: this.alignment,
      reverseOrder: this.reverseOrder,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.direction = (data.direction as 'horizontal' | 'vertical') ?? 'vertical';
    this.spacing = (data.spacing as number) ?? 0;
    this.paddingTop = (data.paddingTop as number) ?? 0;
    this.paddingBottom = (data.paddingBottom as number) ?? 0;
    this.paddingLeft = (data.paddingLeft as number) ?? 0;
    this.paddingRight = (data.paddingRight as number) ?? 0;
    this.alignment = (data.alignment as 'start' | 'center' | 'end') ?? 'start';
    this.reverseOrder = (data.reverseOrder as boolean) ?? false;
  }

  clone(): LayoutGroupComponent {
    const c = new LayoutGroupComponent();
    c.direction = this.direction;
    c.spacing = this.spacing;
    c.paddingTop = this.paddingTop;
    c.paddingBottom = this.paddingBottom;
    c.paddingLeft = this.paddingLeft;
    c.paddingRight = this.paddingRight;
    c.alignment = this.alignment;
    c.reverseOrder = this.reverseOrder;
    return c;
  }
}
