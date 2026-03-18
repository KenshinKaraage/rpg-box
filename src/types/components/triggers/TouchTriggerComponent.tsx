'use client';

import type { ReactNode } from 'react';
import { Component } from '../Component';
import type { ComponentPanelProps } from '../Component';
import { TriggerPropertyPanel } from '@/features/map-editor/components/panels/TriggerPropertyPanel';
import type { EditableAction } from '@/types/ui/actions/UIAction';

export class TouchTriggerComponent extends Component {
  readonly type = 'touchTrigger';
  readonly label = 'Touch Trigger';

  eventId = '';
  actions: EditableAction[] = [];

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      actions: this.actions.map((a) => ({ type: a.type, data: a.toJSON() })),
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    // actions deserialization is handled at a higher level; store raw data
    this.actions = (data.actions as EditableAction[]) ?? [];
  }

  clone(): TouchTriggerComponent {
    const c = new TouchTriggerComponent();
    c.eventId = this.eventId;
    c.actions = this.actions.map((a) => {
      const cloned = Object.create(Object.getPrototypeOf(a));
      Object.assign(cloned, a);
      if (typeof a.fromJSON === 'function' && typeof a.toJSON === 'function') {
        cloned.fromJSON(a.toJSON());
      }
      return cloned;
    });
    return c;
  }

  renderPropertyPanel(props: ComponentPanelProps): ReactNode {
    return <TriggerPropertyPanel component={this} onChange={props.onChange} />;
  }
}
