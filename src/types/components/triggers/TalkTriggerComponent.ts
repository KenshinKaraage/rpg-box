import { Component } from '../Component';

export class TalkTriggerComponent extends Component {
  readonly type = 'talkTrigger';

  eventId = '';
  direction: 'front' | 'any' = 'front';

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      direction: this.direction,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    this.direction = (data.direction as TalkTriggerComponent['direction']) ?? 'front';
  }

  clone(): TalkTriggerComponent {
    const c = new TalkTriggerComponent();
    c.eventId = this.eventId;
    c.direction = this.direction;
    return c;
  }
}
