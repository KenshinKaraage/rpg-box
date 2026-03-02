import { UIComponent, type PropertyDef } from '../UIComponent';

export class ImageComponent extends UIComponent {
  readonly type = 'image';
  readonly label = '画像';

  imageId?: string;
  tint?: string;
  opacity = 1;
  sliceMode: 'none' | 'nine-slice' = 'none';

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'imageId', label: '画像', type: 'assetImage' },
      { key: 'opacity', label: '不透明度', type: 'number', min: 0, max: 1, step: 0.1 },
      { key: 'tint', label: 'ティント', type: 'color' },
      {
        key: 'sliceMode',
        label: 'スライスモード',
        type: 'select',
        options: [
          { value: 'none', label: 'なし' },
          { value: 'nine-slice', label: 'ナインスライス' },
        ],
      },
    ];
  }

  serialize(): unknown {
    return {
      imageId: this.imageId,
      tint: this.tint,
      opacity: this.opacity,
      sliceMode: this.sliceMode,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.imageId = d.imageId as string | undefined;
    this.tint = d.tint as string | undefined;
    this.opacity = (d.opacity as number) ?? 1;
    this.sliceMode = (d.sliceMode as 'none' | 'nine-slice') ?? 'none';
  }

  clone(): ImageComponent {
    const c = new ImageComponent();
    c.imageId = this.imageId;
    c.tint = this.tint;
    c.opacity = this.opacity;
    c.sliceMode = this.sliceMode;
    return c;
  }
}
