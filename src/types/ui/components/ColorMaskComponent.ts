import { UIComponent, type PropertyDef, type AnimatablePropertyDef } from '../UIComponent';

export class ColorMaskComponent extends UIComponent {
  readonly type = 'colorMask';
  readonly label = 'カラーマスク';

  color = '#ffffff';
  blendMode: 'multiply' | 'add' | 'overlay' = 'multiply';
  opacity = 1;

  getAnimatablePropertyDefs(): AnimatablePropertyDef[] {
    return [
      { key: 'opacity', label: '不透明度', valueType: 'number' },
      { key: 'color', label: '色', valueType: 'color' },
    ];
  }

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'color', label: '色', type: 'color' },
      {
        key: 'blendMode',
        label: 'ブレンドモード',
        type: 'select',
        options: [
          { value: 'multiply', label: '乗算' },
          { value: 'add', label: '加算' },
          { value: 'overlay', label: 'オーバーレイ' },
        ],
      },
      { key: 'opacity', label: '不透明度', type: 'number', min: 0, max: 1, step: 0.1 },
    ];
  }

  serialize(): unknown {
    return {
      color: this.color,
      blendMode: this.blendMode,
      opacity: this.opacity,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.color = (d.color as string) ?? '#ffffff';
    this.blendMode = (d.blendMode as 'multiply' | 'add' | 'overlay') ?? 'multiply';
    this.opacity = (d.opacity as number) ?? 1;
  }

  clone(): ColorMaskComponent {
    const c = new ColorMaskComponent();
    c.color = this.color;
    c.blendMode = this.blendMode;
    c.opacity = this.opacity;
    return c;
  }
}
