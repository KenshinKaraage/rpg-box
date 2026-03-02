import { UIComponent, type PropertyDef } from '../UIComponent';

export class ShapeComponent extends UIComponent {
  readonly type = 'shape';
  readonly label = '図形';

  shapeType: 'rectangle' | 'ellipse' | 'polygon' = 'rectangle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth = 1;
  cornerRadius = 0;

  getPropertyDefs(): PropertyDef[] {
    return [
      {
        key: 'shapeType',
        label: '種類',
        type: 'select',
        options: [
          { value: 'rectangle', label: '矩形' },
          { value: 'ellipse', label: '楕円' },
          { value: 'polygon', label: 'ポリゴン' },
        ],
      },
      { key: 'fillColor', label: '塗り', type: 'color' },
      { key: 'strokeColor', label: '線色', type: 'color' },
      { key: 'strokeWidth', label: '線幅', type: 'number', min: 0 },
      { key: 'cornerRadius', label: '角丸', type: 'number', min: 0 },
    ];
  }

  serialize(): unknown {
    return {
      shapeType: this.shapeType,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      cornerRadius: this.cornerRadius,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.shapeType = (d.shapeType as 'rectangle' | 'ellipse' | 'polygon') ?? 'rectangle';
    this.fillColor = d.fillColor as string | undefined;
    this.strokeColor = d.strokeColor as string | undefined;
    this.strokeWidth = (d.strokeWidth as number) ?? 1;
    this.cornerRadius = (d.cornerRadius as number) ?? 0;
  }

  clone(): ShapeComponent {
    const c = new ShapeComponent();
    c.shapeType = this.shapeType;
    c.fillColor = this.fillColor;
    c.strokeColor = this.strokeColor;
    c.strokeWidth = this.strokeWidth;
    c.cornerRadius = this.cornerRadius;
    return c;
  }
}
