import { UIComponent, type PropertyDef } from '../UIComponent';

export const DEFAULT_LINE_VERTICES = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
];

export class LineComponent extends UIComponent {
  readonly type = 'line';
  readonly label = '線';

  strokeColor?: string;
  strokeWidth = 2;
  vertices: { x: number; y: number }[] = [...DEFAULT_LINE_VERTICES];

  getPropertyDefs(): PropertyDef[] {
    return [
      { key: 'strokeColor', label: '線色', type: 'colorAlpha' },
      { key: 'strokeWidth', label: '線幅', type: 'number', min: 0 },
    ];
    // vertices は ComponentPropertyEditor で別途表示
  }

  serialize(): unknown {
    return {
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      vertices: this.vertices,
    };
  }

  deserialize(data: unknown): void {
    const d = data as Record<string, unknown>;
    this.strokeColor = d.strokeColor as string | undefined;
    this.strokeWidth = (d.strokeWidth as number) ?? 2;
    this.vertices = Array.isArray(d.vertices)
      ? (d.vertices as { x: number; y: number }[])
      : [...DEFAULT_LINE_VERTICES];
  }

  clone(): LineComponent {
    const c = new LineComponent();
    c.strokeColor = this.strokeColor;
    c.strokeWidth = this.strokeWidth;
    c.vertices = this.vertices.map((v) => ({ ...v }));
    return c;
  }
}
