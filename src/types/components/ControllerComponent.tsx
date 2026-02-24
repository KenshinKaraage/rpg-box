'use client';

import type { ReactNode } from 'react';
import { Component } from './Component';
import type { ComponentPanelProps } from './Component';
import { ControllerPropertyPanel } from '@/features/map-editor/components/panels/ControllerPropertyPanel';

export class ControllerComponent extends Component {
  readonly type = 'controller';

  moveSpeed = 1;
  dashEnabled = true;
  inputEnabled = true;

  serialize(): Record<string, unknown> {
    return {
      moveSpeed: this.moveSpeed,
      dashEnabled: this.dashEnabled,
      inputEnabled: this.inputEnabled,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.moveSpeed = (data.moveSpeed as number) ?? 1;
    this.dashEnabled = (data.dashEnabled as boolean) ?? true;
    this.inputEnabled = (data.inputEnabled as boolean) ?? true;
  }

  clone(): ControllerComponent {
    const c = new ControllerComponent();
    c.moveSpeed = this.moveSpeed;
    c.dashEnabled = this.dashEnabled;
    c.inputEnabled = this.inputEnabled;
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <ControllerPropertyPanel component={this} onChange={props.onChange} />;
  }
}
