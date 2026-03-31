'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { MovementPropertyPanel } from '@/features/map-editor/components/panels/MovementPropertyPanel';

/** ルートの1ステップ: 移動 or 向き変更 */
export type RouteStep =
  | { type: 'move'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'face'; direction: 'up' | 'down' | 'left' | 'right' };

/** 旧形式（文字列）との互換 */
export function normalizeRouteStep(step: unknown): RouteStep {
  if (typeof step === 'string') {
    return { type: 'move', direction: step as 'up' | 'down' | 'left' | 'right' };
  }
  return step as RouteStep;
}

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
    this.routeSteps = ((data.routeSteps as unknown[]) ?? []).map(normalizeRouteStep);
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
