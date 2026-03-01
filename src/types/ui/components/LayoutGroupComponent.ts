import { UIComponent } from '../UIComponent';

export class LayoutGroupComponent extends UIComponent {
  readonly type = 'layoutGroup';
  readonly label = 'レイアウトグループ';

  direction: 'horizontal' | 'vertical' = 'vertical';
  spacing = 0;
  alignment: 'start' | 'center' | 'end' = 'start';
  reverseOrder = false;

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
