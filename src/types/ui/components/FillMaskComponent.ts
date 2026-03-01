import { UIComponent } from '../UIComponent';

export class FillMaskComponent extends UIComponent {
  readonly type = 'fillMask';
  readonly label = 'フィルマスク';

  direction: 'horizontal' | 'vertical' = 'horizontal';
  fillAmount = 1;
  reverse = false;

  serialize(): unknown {
    return {
      direction: this.direction,
      fillAmount: this.fillAmount,
      reverse: this.reverse,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.direction = (d.direction as 'horizontal' | 'vertical') ?? 'horizontal';
    this.fillAmount = (d.fillAmount as number) ?? 1;
    this.reverse = (d.reverse as boolean) ?? false;
  }

  clone(): FillMaskComponent {
    const c = new FillMaskComponent();
    c.direction = this.direction;
    c.fillAmount = this.fillAmount;
    c.reverse = this.reverse;
    return c;
  }
}
