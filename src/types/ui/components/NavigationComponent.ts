import { UIComponent } from '../UIComponent';

export class NavigationComponent extends UIComponent {
  readonly type = 'navigation';
  readonly label = 'ナビゲーション';

  direction: 'horizontal' | 'vertical' | 'grid' = 'vertical';
  wrap = false;
  initialIndex = 0;
  columns?: number;

  serialize(): unknown {
    return {
      direction: this.direction,
      wrap: this.wrap,
      initialIndex: this.initialIndex,
      columns: this.columns,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.direction = (d.direction as 'horizontal' | 'vertical' | 'grid') ?? 'vertical';
    this.wrap = (d.wrap as boolean) ?? false;
    this.initialIndex = (d.initialIndex as number) ?? 0;
    this.columns = d.columns as number | undefined;
  }

  clone(): NavigationComponent {
    const c = new NavigationComponent();
    c.direction = this.direction;
    c.wrap = this.wrap;
    c.initialIndex = this.initialIndex;
    c.columns = this.columns;
    return c;
  }
}
