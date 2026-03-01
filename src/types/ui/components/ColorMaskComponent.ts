import { UIComponent } from '../UIComponent';

export class ColorMaskComponent extends UIComponent {
  readonly type = 'colorMask';
  readonly label = 'カラーマスク';

  color = '#ffffff';
  blendMode: 'multiply' | 'add' | 'overlay' = 'multiply';
  opacity = 1;

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
