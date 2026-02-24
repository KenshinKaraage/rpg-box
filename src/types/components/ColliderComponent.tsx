'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { ColliderPropertyPanel } from '@/features/map-editor/components/panels/ColliderPropertyPanel';

export class ColliderComponent extends Component {
  readonly type = 'collider';
  readonly label = 'Collider';

  width = 1;
  height = 1;
  passable = false;
  layer = 0;

  serialize(): Record<string, unknown> {
    return {
      width: this.width,
      height: this.height,
      passable: this.passable,
      layer: this.layer,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.width = (data.width as number) ?? 1;
    this.height = (data.height as number) ?? 1;
    this.passable = (data.passable as boolean) ?? false;
    this.layer = (data.layer as number) ?? 0;
  }

  clone(): ColliderComponent {
    const c = new ColliderComponent();
    c.width = this.width;
    c.height = this.height;
    c.passable = this.passable;
    c.layer = this.layer;
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <ColliderPropertyPanel component={this} onChange={props.onChange} />;
  }
}
