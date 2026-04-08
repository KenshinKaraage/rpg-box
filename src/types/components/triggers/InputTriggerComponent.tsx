'use client';

import type { ReactNode } from 'react';
import { Component } from '../Component';
import type { ComponentPanelProps } from '../Component';
import { TriggerPropertyPanel } from '@/features/map-editor/components/panels/TriggerPropertyPanel';
import type { EditableAction } from '@/types/ui/actions/UIAction';

export class InputTriggerComponent extends Component {
  readonly type = 'inputTrigger';
  readonly label = 'Input Trigger';

  eventId = '';
  key = '';
  actions: EditableAction[] = [];

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      key: this.key,
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
    this.key = (data.key as string) ?? '';
    // actions deserialization is handled at a higher level; store raw data
    this.actions = (data.actions as EditableAction[]) ?? [];
  }

  clone(): InputTriggerComponent {
    const c = new InputTriggerComponent();
    c.eventId = this.eventId;
    c.key = this.key;
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
