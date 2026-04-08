import { UIComponent, type PropertyDef } from '../UIComponent';

export class NavigationCursorComponent extends UIComponent {
  readonly type = 'navigationCursor';
  readonly label = 'ナビゲーションカーソル';

  anchorX: 'left' | 'center' | 'right' = 'left';
  anchorY: 'top' | 'center' | 'bottom' = 'top';
  offsetX = 0;
  offsetY = 0;

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'anchorX',
        label: '基準X',
        type: 'select',
        options: [
          { value: 'left', label: '左' },
          { value: 'center', label: '中央' },
          { value: 'right', label: '右' },
        ],
      },
      {
        key: 'anchorY',
        label: '基準Y',
        type: 'select',
        options: [
          { value: 'top', label: '上' },
          { value: 'center', label: '中央' },
          { value: 'bottom', label: '下' },
        ],
      },
      { key: 'offsetX', label: 'オフセットX', type: 'number' },
      { key: 'offsetY', label: 'オフセットY', type: 'number' },
    ];
  }

  serialize(): unknown {
    return {
      anchorX: this.anchorX,
      anchorY: this.anchorY,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.anchorX = (d.anchorX as 'left' | 'center' | 'right') ?? 'left';
    this.anchorY = (d.anchorY as 'top' | 'center' | 'bottom') ?? 'top';
    this.offsetX = (d.offsetX as number) ?? 0;
    this.offsetY = (d.offsetY as number) ?? 0;
  }

  clone(): NavigationCursorComponent {
    const c = new NavigationCursorComponent();
    c.anchorX = this.anchorX;
    c.anchorY = this.anchorY;
    c.offsetX = this.offsetX;
    c.offsetY = this.offsetY;
    return c;
  }
}
