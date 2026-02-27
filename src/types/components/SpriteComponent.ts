import { Component } from './Component';

export class SpriteComponent extends Component {
  readonly type = 'sprite';
  readonly label = 'Sprite';

  imageId?: string;
  animationId?: string;
  flipX = false;
  flipY = false;
  tint?: string;
  opacity = 1;

  serialize(): Record<string, unknown> {
    return {
      imageId: this.imageId,
      animationId: this.animationId,
      flipX: this.flipX,
      flipY: this.flipY,
      tint: this.tint,
      opacity: this.opacity,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.imageId = data.imageId as string | undefined;
    this.animationId = data.animationId as string | undefined;
    this.flipX = (data.flipX as boolean) ?? false;
    this.flipY = (data.flipY as boolean) ?? false;
    this.tint = data.tint as string | undefined;
    this.opacity = (data.opacity as number) ?? 1;
  }

  clone(): SpriteComponent {
    const c = new SpriteComponent();
    c.imageId = this.imageId;
    c.animationId = this.animationId;
    c.flipX = this.flipX;
    c.flipY = this.flipY;
    c.tint = this.tint;
    c.opacity = this.opacity;
    return c;
  }
}
