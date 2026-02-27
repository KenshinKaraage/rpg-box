import { Component } from './Component';

export interface CanvasElement {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export class ObjectCanvasComponent extends Component {
  readonly type = 'objectCanvas';
  readonly label = 'Object Canvas';

  offsetX = 0;
  offsetY = 0;
  elements: CanvasElement[] = [];

  serialize(): Record<string, unknown> {
    return {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      elements: structuredClone(this.elements),
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.offsetX = (data.offsetX as number) ?? 0;
    this.offsetY = (data.offsetY as number) ?? 0;
    const elems = data.elements as CanvasElement[] | undefined;
    this.elements = elems ? structuredClone(elems) : [];
  }

  clone(): ObjectCanvasComponent {
    const c = new ObjectCanvasComponent();
    c.offsetX = this.offsetX;
    c.offsetY = this.offsetY;
    c.elements = structuredClone(this.elements);
    return c;
  }
}
