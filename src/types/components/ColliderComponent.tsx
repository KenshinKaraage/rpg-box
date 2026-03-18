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
  /** ぶつかるマップレイヤーIDの一覧 */
  collideLayers: string[] = [];

  serialize(): Record<string, unknown> {
    return {
      width: this.width,
      height: this.height,
      collideLayers: [...this.collideLayers],
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.width = (data.width as number) ?? 1;
    this.height = (data.height as number) ?? 1;
    this.collideLayers = (data.collideLayers as string[]) ?? [];
    // 旧データ互換: passable=false + layer=0 だった場合
    if (!data.collideLayers && data.passable === false) {
      this.collideLayers = []; // 後でマップのレイヤーIDで初期化
    }
  }

  clone(): ColliderComponent {
    const c = new ColliderComponent();
    c.width = this.width;
    c.height = this.height;
    c.collideLayers = [...this.collideLayers];
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <ColliderPropertyPanel component={this} onChange={props.onChange} />;
  }
}
