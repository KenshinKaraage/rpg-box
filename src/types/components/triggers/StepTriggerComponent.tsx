'use client';

import type { ReactNode } from 'react';
import { Component } from '../Component';
import type { ComponentPanelProps } from '../Component';
import { TriggerPropertyPanel } from '@/features/map-editor/components/panels/TriggerPropertyPanel';

export class StepTriggerComponent extends Component {
  readonly type = 'stepTrigger';

  eventId = '';

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
  }

  clone(): StepTriggerComponent {
    const c = new StepTriggerComponent();
    c.eventId = this.eventId;
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <TriggerPropertyPanel component={this} onChange={props.onChange} />;
  }
}
