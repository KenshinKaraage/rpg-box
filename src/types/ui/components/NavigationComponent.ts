import { UIComponent, type PropertyDef } from '../UIComponent';

export class NavigationComponent extends UIComponent {
  readonly type = 'navigation';
  readonly label = 'ナビゲーション';

  direction: 'horizontal' | 'vertical' | 'grid' = 'vertical';
  wrap = false;
  initialIndex = 0;
  columns?: number;

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        options: [
          { value: 'vertical', label: '垂直' },
          { value: 'horizontal', label: '水平' },
          { value: 'grid', label: 'グリッド' },
        ],
      },
      { key: 'wrap', label: '折り返し', type: 'boolean' },
      { key: 'initialIndex', label: '初期インデックス', type: 'number', min: 0 },
      { key: 'columns', label: '列数(grid用)', type: 'number', min: 1 },
    ];
  }

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
