import { UIComponent, type PropertyDef } from '../UIComponent';

export type ShapeType = 'rectangle' | 'ellipse' | 'polygon' | 'polygon_regular' | 'line';

export const DEFAULT_TRIANGLE_VERTICES = [
  { x: 0.5, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

export class ShapeComponent extends UIComponent {
  readonly type = 'shape';
  readonly label = '図形';

  shapeType: ShapeType = 'rectangle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth = 1;
  cornerRadius = 0;
  vertices: { x: number; y: number }[] = [...DEFAULT_TRIANGLE_VERTICES];
  sides = 6;

  getPropertyDefs(): PropertyDef[] {
    const defs: PropertyDef[] = [
      {
        key: 'shapeType',
        label: '種類',
        type: 'select',
        options: [
          { value: 'rectangle', label: '矩形' },
          { value: 'ellipse', label: '楕円' },
          { value: 'polygon', label: 'ポリゴン' },
          { value: 'polygon_regular', label: '正多角形' },
          { value: 'line', label: '線' },
        ],
      },
    ];

    if (this.shapeType !== 'line') {
      defs.push({ key: 'fillColor', label: '塗り', type: 'colorAlpha' });
    }
    defs.push({ key: 'strokeColor', label: '線色', type: 'colorAlpha' });
    defs.push({ key: 'strokeWidth', label: '線幅', type: 'number', min: 0 });

    if (this.shapeType === 'rectangle') {
      defs.push({ key: 'cornerRadius', label: '角丸', type: 'number', min: 0 });
    }
    if (this.shapeType === 'polygon_regular') {
      defs.push({ key: 'sides', label: '辺数', type: 'number', min: 3, max: 32 });
    }
    // polygon vertices は ComponentPropertyEditor で別途表示

    return defs;
  }

  serialize(): unknown {
    return {
      shapeType: this.shapeType,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      cornerRadius: this.cornerRadius,
      vertices: this.vertices,
      sides: this.sides,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.shapeType = (d.shapeType as ShapeType) ?? 'rectangle';
    this.fillColor = d.fillColor as string | undefined;
    this.strokeColor = d.strokeColor as string | undefined;
    this.strokeWidth = (d.strokeWidth as number) ?? 1;
    this.cornerRadius = (d.cornerRadius as number) ?? 0;
    this.vertices = Array.isArray(d.vertices) ? d.vertices as { x: number; y: number }[] : [...DEFAULT_TRIANGLE_VERTICES];
    this.sides = (d.sides as number) ?? 6;
  }

  clone(): ShapeComponent {
    const c = new ShapeComponent();
    c.shapeType = this.shapeType;
    c.fillColor = this.fillColor;
    c.strokeColor = this.strokeColor;
    c.strokeWidth = this.strokeWidth;
    c.cornerRadius = this.cornerRadius;
    c.vertices = this.vertices.map((v) => ({ ...v }));
    c.sides = this.sides;
    return c;
  }
}
