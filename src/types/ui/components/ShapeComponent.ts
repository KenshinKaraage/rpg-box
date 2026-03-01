import { UIComponent } from '../UIComponent';

export class ShapeComponent extends UIComponent {
  readonly type = 'shape';
  readonly label = '図形';

  shapeType: 'rectangle' | 'ellipse' | 'polygon' = 'rectangle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth = 1;
  cornerRadius = 0;

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
