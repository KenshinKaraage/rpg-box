'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { MovementPropertyPanel } from '@/features/map-editor/components/panels/MovementPropertyPanel';

/** ルートの1ステップ（移動方向） */
export type RouteStep = 'up' | 'down' | 'left' | 'right';

export class MovementComponent extends Component {
  readonly type = 'movement';
  readonly label = 'Movement';

  pattern: 'fixed' | 'random' | 'route' = 'fixed';
  speed = 1;
  /** 活発さ（1=おとなしい〜10=せわしない）。ランダム移動時の移動頻度 */
  activeness = 3;
  routeSteps: RouteStep[] = [];
  /** ルート完了後にループするか */
  routeLoop = true;

  serialize(): Record<string, unknown> {
    return {
      pattern: this.pattern,
      speed: this.speed,
      activeness: this.activeness,
      routeSteps: [...this.routeSteps],
      routeLoop: this.routeLoop,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.pattern = (data.pattern as 'fixed' | 'random' | 'route') ?? 'fixed';
    this.speed = (data.speed as number) ?? 1;
    this.activeness = (data.activeness as number) ?? 3;
    this.routeSteps = (data.routeSteps as RouteStep[]) ?? [];
    this.routeLoop = (data.routeLoop as boolean) ?? true;
  }

  clone(): MovementComponent {
    const c = new MovementComponent();
    c.pattern = this.pattern;
    c.speed = this.speed;
    c.activeness = this.activeness;
    c.routeSteps = [...this.routeSteps];
    c.routeLoop = this.routeLoop;
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <MovementPropertyPanel component={this} onChange={props.onChange} />;
  }
}
