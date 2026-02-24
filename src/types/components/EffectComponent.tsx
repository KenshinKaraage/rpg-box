'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { EffectPropertyPanel } from '@/features/map-editor/components/panels/EffectPropertyPanel';

export class EffectComponent extends Component {
  readonly type = 'effect';

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

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <EffectPropertyPanel component={this} onChange={props.onChange} />;
  }
}
