'use client';

import type { ReactNode } from 'react';
import { Component } from '../Component';
import type { ComponentPanelProps } from '../Component';
import { TriggerPropertyPanel } from '@/features/map-editor/components/panels/TriggerPropertyPanel';
import type { EditableAction } from '@/types/ui/actions/UIAction';

export class TalkTriggerComponent extends Component {
  readonly type = 'talkTrigger';
  readonly label = 'Talk Trigger';

  eventId = '';
  direction: 'front' | 'any' = 'front';
  actions: EditableAction[] = [];

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      direction: this.direction,
      actions: this.actions.map((a) => ({ type: a.type, data: a.toJSON() })),
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    this.direction = (data.direction as TalkTriggerComponent['direction']) ?? 'front';
    // actions deserialization is handled at a higher level; store raw data
    this.actions = (data.actions as EditableAction[]) ?? [];
  }

  clone(): TalkTriggerComponent {
    const c = new TalkTriggerComponent();
    c.eventId = this.eventId;
    c.direction = this.direction;
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
