import { UIComponent } from '../UIComponent';

export class NavigationCursorComponent extends UIComponent {
  readonly type = 'navigationCursor';
  readonly label = 'ナビゲーションカーソル';

  offsetX = 0;
  offsetY = 0;

  serialize(): unknown {
    return {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.offsetX = (d.offsetX as number) ?? 0;
    this.offsetY = (d.offsetY as number) ?? 0;
  }

  clone(): NavigationCursorComponent {
    const c = new NavigationCursorComponent();
    c.offsetX = this.offsetX;
    c.offsetY = this.offsetY;
    return c;
  }
}
