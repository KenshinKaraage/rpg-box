'use client';

import type { ReactNode } from 'react';
import { Component } from '../Component';
import type { ComponentPanelProps } from '../Component';
import { TriggerPropertyPanel } from '@/features/map-editor/components/panels/TriggerPropertyPanel';
import type { EditableAction } from '@/types/ui/actions/UIAction';

export class StepTriggerComponent extends Component {
  readonly type = 'stepTrigger';
  readonly label = 'Step Trigger';

  eventId = '';
  actions: EditableAction[] = [];

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      actions: this.actions.map((a) => ({
        type: a.type,
        data:
          typeof a.toJSON === 'function'
            ? a.toJSON()
            : ((a as unknown as { data?: unknown }).data ?? a),
      })),
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    // actions deserialization is handled at a higher level; store raw data
    this.actions = (data.actions as EditableAction[]) ?? [];
  }

  clone(): StepTriggerComponent {
    const c = new StepTriggerComponent();
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
    return (
      <TriggerPropertyPanel component={this} onChange={props.onChange} objectId={props.objectId} />
    );
  }
}
