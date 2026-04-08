'use client';

import type { ReactNode } from 'react';
import { Component } from '../Component';
import type { ComponentPanelProps } from '../Component';
import { TriggerPropertyPanel } from '@/features/map-editor/components/panels/TriggerPropertyPanel';
import type { EditableAction } from '@/types/ui/actions/UIAction';

export class AutoTriggerComponent extends Component {
  readonly type = 'autoTrigger';
  readonly label = 'Auto Trigger';

  eventId = '';
  interval = 0;
  runOnce = true;
  actions: EditableAction[] = [];

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      interval: this.interval,
      runOnce: this.runOnce,
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
    this.interval = (data.interval as number) ?? 0;
    this.runOnce = (data.runOnce as boolean) ?? true;
    // actions deserialization is handled at a higher level; store raw data
    this.actions = (data.actions as EditableAction[]) ?? [];
  }

  clone(): AutoTriggerComponent {
    const c = new AutoTriggerComponent();
    c.eventId = this.eventId;
    c.interval = this.interval;
    c.runOnce = this.runOnce;
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
