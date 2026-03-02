import { UIComponent, type PropertyDef } from '../UIComponent';

export class GridLayoutComponent extends UIComponent {
  readonly type = 'gridLayout';
  readonly label = 'グリッドレイアウト';

  columns = 2;
  spacingX = 0;
  spacingY = 0;
  cellWidth?: number;
  cellHeight?: number;

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'columns', label: '列数', type: 'number', min: 1 },
      { key: 'spacingX', label: '水平間隔', type: 'number', min: 0 },
      { key: 'spacingY', label: '垂直間隔', type: 'number', min: 0 },
      { key: 'cellWidth', label: 'セル幅', type: 'number', min: 0 },
      { key: 'cellHeight', label: 'セル高', type: 'number', min: 0 },
    ];
  }

  serialize(): Record<string, unknown> {
    return {
      columns: this.columns,
      spacingX: this.spacingX,
      spacingY: this.spacingY,
      cellWidth: this.cellWidth,
      cellHeight: this.cellHeight,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.columns = (data.columns as number) ?? 2;
    this.spacingX = (data.spacingX as number) ?? 0;
    this.spacingY = (data.spacingY as number) ?? 0;
    this.cellWidth = data.cellWidth as number | undefined;
    this.cellHeight = data.cellHeight as number | undefined;
  }

  clone(): GridLayoutComponent {
    const c = new GridLayoutComponent();
    c.columns = this.columns;
    c.spacingX = this.spacingX;
    c.spacingY = this.spacingY;
    c.cellWidth = this.cellWidth;
    c.cellHeight = this.cellHeight;
    return c;
  }
}
