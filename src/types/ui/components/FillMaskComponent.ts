import { UIComponent, type PropertyDef, type AnimatablePropertyDef } from '../UIComponent';

export class FillMaskComponent extends UIComponent {
  readonly type = 'fillMask';
  readonly label = 'フィルマスク';

  direction: 'horizontal' | 'vertical' | 'radial' = 'horizontal';
  fillAmount = 1;
  reverse = false;

  getAnimatablePropertyDefs(): AnimatablePropertyDef[] {
    return [
      { key: 'fillAmount', label: 'フィル量', valueType: 'number' },
    ];
  }

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'horizontal', label: '水平' },
          { value: 'vertical', label: '垂直' },
          { value: 'radial', label: 'ラジアル' },
        ],
      },
      { key: 'fillAmount', label: '充填量', type: 'number', min: 0, max: 1, step: 0.01 },
      { key: 'reverse', label: '反転', type: 'boolean' },
    ];
  }

  serialize(): unknown {
    return {
      direction: this.direction,
      fillAmount: this.fillAmount,
      reverse: this.reverse,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.direction = (d.direction as 'horizontal' | 'vertical' | 'radial') ?? 'horizontal';
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
