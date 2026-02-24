'use client';

import type { ReactNode } from 'react';
import { Component } from '../Component';
import type { ComponentPanelProps } from '../Component';
import { TriggerPropertyPanel } from '@/features/map-editor/components/panels/TriggerPropertyPanel';

export class InputTriggerComponent extends Component {
  readonly type = 'inputTrigger';

  eventId = '';
  key = '';

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      key: this.key,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    this.key = (data.key as string) ?? '';
  }

  clone(): InputTriggerComponent {
    const c = new InputTriggerComponent();
    c.eventId = this.eventId;
    c.key = this.key;
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <TriggerPropertyPanel component={this} onChange={props.onChange} />;
  }
}
