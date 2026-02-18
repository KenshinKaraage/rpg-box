import { Component } from '../Component';

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
}
