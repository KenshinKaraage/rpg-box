import { Component } from '../Component';

export class TouchTriggerComponent extends Component {
  readonly type = 'touchTrigger';
  readonly label = 'Touch Trigger';

  eventId = '';

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
  }

  clone(): TouchTriggerComponent {
    const c = new TouchTriggerComponent();
    c.eventId = this.eventId;
    return c;
  }
}
