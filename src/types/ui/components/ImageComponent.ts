import { UIComponent, type PropertyDef, type AnimatablePropertyDef } from '../UIComponent';

export class ImageComponent extends UIComponent {
  readonly type = 'image';
  readonly label = '画像';

  imageId?: string;
  tint?: string;
  opacity = 1;
  sliceMode: 'none' | 'nine-slice' = 'none';
  /** 9-slice border size in pixels (uniform for all 4 sides) */
  sliceBorder = 16;
  sliceFill: 'stretch' | 'repeat' = 'stretch';

  getAnimatablePropertyDefs(): AnimatablePropertyDef[] {
    return [
      { key: 'opacity', label: '不透明度', valueType: 'number' },
      { key: 'tint', label: '色', valueType: 'color' },
    ];
  }

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
      { key: 'sliceBorder', label: 'スライス幅', type: 'number', min: 1 },
      {
        key: 'sliceFill',
        label: 'スライス補填',
        type: 'select',
        options: [
          { value: 'stretch', label: 'ストレッチ' },
          { value: 'repeat', label: 'リピート' },
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
      sliceBorder: this.sliceBorder,
      sliceFill: this.sliceFill,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.imageId = d.imageId as string | undefined;
    this.tint = d.tint as string | undefined;
    this.opacity = (d.opacity as number) ?? 1;
    this.sliceMode = (d.sliceMode as 'none' | 'nine-slice') ?? 'none';
    this.sliceBorder = (d.sliceBorder as number) ?? 16;
    this.sliceFill = (d.sliceFill as 'stretch' | 'repeat') ?? 'stretch';
  }

  clone(): ImageComponent {
    const c = new ImageComponent();
    c.imageId = this.imageId;
    c.tint = this.tint;
    c.opacity = this.opacity;
    c.sliceMode = this.sliceMode;
    c.sliceBorder = this.sliceBorder;
    c.sliceFill = this.sliceFill;
    return c;
  }
}
