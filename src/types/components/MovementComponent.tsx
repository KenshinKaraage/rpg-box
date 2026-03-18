'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { MovementPropertyPanel } from '@/features/map-editor/components/panels/MovementPropertyPanel';

export interface RoutePoint {
  x: number;
  y: number;
}

export class MovementComponent extends Component {
  readonly type = 'movement';
  readonly label = 'Movement';

  pattern: 'fixed' | 'random' | 'route' = 'fixed';
  speed = 1;
  /** 活発さ（1=おとなしい〜10=せわしない）。ランダム移動時の移動頻度 */
  activeness = 3;
  routePoints: RoutePoint[] = [];
  /** ルート完了後にループするか */
  routeLoop = true;

  serialize(): Record<string, unknown> {
    return {
      pattern: this.pattern,
      speed: this.speed,
      activeness: this.activeness,
      routePoints: this.routePoints.map((p) => ({ x: p.x, y: p.y })),
      routeLoop: this.routeLoop,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.pattern = (data.pattern as 'fixed' | 'random' | 'route') ?? 'fixed';
    this.speed = (data.speed as number) ?? 1;
    this.activeness = (data.activeness as number) ?? 3;
    const points = data.routePoints as RoutePoint[] | undefined;
    this.routePoints = points ? points.map((p) => ({ x: p.x, y: p.y })) : [];
    this.routeLoop = (data.routeLoop as boolean) ?? true;
  }

  clone(): MovementComponent {
    const c = new MovementComponent();
    c.pattern = this.pattern;
    c.speed = this.speed;
    c.activeness = this.activeness;
    c.routePoints = this.routePoints.map((p) => ({ x: p.x, y: p.y }));
    c.routeLoop = this.routeLoop;
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <MovementPropertyPanel component={this} onChange={props.onChange} />;
  }
}
