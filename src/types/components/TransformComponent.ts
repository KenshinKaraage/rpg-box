import { Component } from './Component';

export class TransformComponent extends Component {
  readonly type = 'transform';

  x = 0;
  y = 0;
  rotation = 0;
  scaleX = 1;
  scaleY = 1;

  serialize(): Record<string, unknown> {
    return {
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.x = (data.x as number) ?? 0;
    this.y = (data.y as number) ?? 0;
    this.rotation = (data.rotation as number) ?? 0;
    this.scaleX = (data.scaleX as number) ?? 1;
    this.scaleY = (data.scaleY as number) ?? 1;
  }

  clone(): TransformComponent {
    const c = new TransformComponent();
    c.x = this.x;
    c.y = this.y;
    c.rotation = this.rotation;
    c.scaleX = this.scaleX;
    c.scaleY = this.scaleY;
    return c;
  }
}
