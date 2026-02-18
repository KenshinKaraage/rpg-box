import { Component } from '../Component';

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
}
