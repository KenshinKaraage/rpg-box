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
  routePoints: RoutePoint[] = [];

  serialize(): Record<string, unknown> {
    return {
      pattern: this.pattern,
      speed: this.speed,
      routePoints: this.routePoints.map((p) => ({ x: p.x, y: p.y })),
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.pattern = (data.pattern as 'fixed' | 'random' | 'route') ?? 'fixed';
    this.speed = (data.speed as number) ?? 1;
    const points = data.routePoints as RoutePoint[] | undefined;
    this.routePoints = points ? points.map((p) => ({ x: p.x, y: p.y })) : [];
  }

  clone(): MovementComponent {
    const c = new MovementComponent();
    c.pattern = this.pattern;
    c.speed = this.speed;
    c.routePoints = this.routePoints.map((p) => ({ x: p.x, y: p.y }));
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <MovementPropertyPanel component={this} onChange={props.onChange} />;
  }
}
