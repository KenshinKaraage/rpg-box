import { Component } from './Component';

export class EffectComponent extends Component {
  readonly type = 'effect';
  readonly label = 'Effect';

  effectId?: string;
  onComplete: 'delete' | 'hide' | 'none' = 'none';

  serialize(): Record<string, unknown> {
    return {
      effectId: this.effectId,
      onComplete: this.onComplete,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.effectId = data.effectId as string | undefined;
    this.onComplete = (data.onComplete as 'delete' | 'hide' | 'none') ?? 'none';
  }

  clone(): EffectComponent {
    const c = new EffectComponent();
    c.effectId = this.effectId;
    c.onComplete = this.onComplete;
    return c;
  }
}
