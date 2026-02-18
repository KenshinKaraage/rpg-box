import { Component } from '../Component';

export class AutoTriggerComponent extends Component {
  readonly type = 'autoTrigger';

  eventId = '';
  interval = 0;
  runOnce = true;

  serialize(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      interval: this.interval,
      runOnce: this.runOnce,
    };
  }

  deserialize(data: Record<string, unknown>): void {
    this.eventId = (data.eventId as string) ?? '';
    this.interval = (data.interval as number) ?? 0;
    this.runOnce = (data.runOnce as boolean) ?? true;
  }

  clone(): AutoTriggerComponent {
    const c = new AutoTriggerComponent();
    c.eventId = this.eventId;
    c.interval = this.interval;
    c.runOnce = this.runOnce;
    return c;
  }
}
