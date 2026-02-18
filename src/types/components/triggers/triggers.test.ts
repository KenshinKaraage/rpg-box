import { TalkTriggerComponent } from './TalkTriggerComponent';
import { TouchTriggerComponent } from './TouchTriggerComponent';
import { StepTriggerComponent } from './StepTriggerComponent';
import { AutoTriggerComponent } from './AutoTriggerComponent';
import { InputTriggerComponent } from './InputTriggerComponent';

describe('TalkTriggerComponent', () => {
  it('has correct type', () => {
    const c = new TalkTriggerComponent();
    expect(c.type).toBe('talkTrigger');
  });

  it('has correct default values', () => {
    const c = new TalkTriggerComponent();
    expect(c.eventId).toBe('');
    expect(c.direction).toBe('front');
  });

  it('round-trip serialize → deserialize', () => {
    const original = new TalkTriggerComponent();
    original.eventId = 'evt_001';
    original.direction = 'any';

    const data = original.serialize();
    const restored = new TalkTriggerComponent();
    restored.deserialize(data);

    expect(restored.eventId).toBe('evt_001');
    expect(restored.direction).toBe('any');
  });

  it('clone creates independent copy', () => {
    const original = new TalkTriggerComponent();
    original.eventId = 'evt_002';
    original.direction = 'any';

    const cloned = original.clone();
    expect(cloned.eventId).toBe('evt_002');
    expect(cloned.direction).toBe('any');

    cloned.eventId = 'evt_changed';
    expect(original.eventId).toBe('evt_002');
  });
});

describe('TouchTriggerComponent', () => {
  it('has correct type', () => {
    const c = new TouchTriggerComponent();
    expect(c.type).toBe('touchTrigger');
  });

  it('has correct default values', () => {
    const c = new TouchTriggerComponent();
    expect(c.eventId).toBe('');
  });

  it('round-trip serialize → deserialize', () => {
    const original = new TouchTriggerComponent();
    original.eventId = 'evt_010';

    const data = original.serialize();
    const restored = new TouchTriggerComponent();
    restored.deserialize(data);

    expect(restored.eventId).toBe('evt_010');
  });

  it('clone creates independent copy', () => {
    const original = new TouchTriggerComponent();
    original.eventId = 'evt_011';

    const cloned = original.clone();
    expect(cloned.eventId).toBe('evt_011');

    cloned.eventId = 'evt_changed';
    expect(original.eventId).toBe('evt_011');
  });
});

describe('StepTriggerComponent', () => {
  it('has correct type', () => {
    const c = new StepTriggerComponent();
    expect(c.type).toBe('stepTrigger');
  });

  it('has correct default values', () => {
    const c = new StepTriggerComponent();
    expect(c.eventId).toBe('');
  });

  it('round-trip serialize → deserialize', () => {
    const original = new StepTriggerComponent();
    original.eventId = 'evt_020';

    const data = original.serialize();
    const restored = new StepTriggerComponent();
    restored.deserialize(data);

    expect(restored.eventId).toBe('evt_020');
  });

  it('clone creates independent copy', () => {
    const original = new StepTriggerComponent();
    original.eventId = 'evt_021';

    const cloned = original.clone();
    expect(cloned.eventId).toBe('evt_021');

    cloned.eventId = 'evt_changed';
    expect(original.eventId).toBe('evt_021');
  });
});

describe('AutoTriggerComponent', () => {
  it('has correct type', () => {
    const c = new AutoTriggerComponent();
    expect(c.type).toBe('autoTrigger');
  });

  it('has correct default values', () => {
    const c = new AutoTriggerComponent();
    expect(c.eventId).toBe('');
    expect(c.interval).toBe(0);
    expect(c.runOnce).toBe(true);
  });

  it('round-trip serialize → deserialize', () => {
    const original = new AutoTriggerComponent();
    original.eventId = 'evt_030';
    original.interval = 500;
    original.runOnce = false;

    const data = original.serialize();
    const restored = new AutoTriggerComponent();
    restored.deserialize(data);

    expect(restored.eventId).toBe('evt_030');
    expect(restored.interval).toBe(500);
    expect(restored.runOnce).toBe(false);
  });

  it('clone creates independent copy', () => {
    const original = new AutoTriggerComponent();
    original.eventId = 'evt_031';
    original.interval = 1000;
    original.runOnce = false;

    const cloned = original.clone();
    expect(cloned.eventId).toBe('evt_031');
    expect(cloned.interval).toBe(1000);
    expect(cloned.runOnce).toBe(false);

    cloned.interval = 2000;
    expect(original.interval).toBe(1000);
  });
});

describe('InputTriggerComponent', () => {
  it('has correct type', () => {
    const c = new InputTriggerComponent();
    expect(c.type).toBe('inputTrigger');
  });

  it('has correct default values', () => {
    const c = new InputTriggerComponent();
    expect(c.eventId).toBe('');
    expect(c.key).toBe('');
  });

  it('round-trip serialize → deserialize', () => {
    const original = new InputTriggerComponent();
    original.eventId = 'evt_040';
    original.key = 'Space';

    const data = original.serialize();
    const restored = new InputTriggerComponent();
    restored.deserialize(data);

    expect(restored.eventId).toBe('evt_040');
    expect(restored.key).toBe('Space');
  });

  it('clone creates independent copy', () => {
    const original = new InputTriggerComponent();
    original.eventId = 'evt_041';
    original.key = 'Enter';

    const cloned = original.clone();
    expect(cloned.eventId).toBe('evt_041');
    expect(cloned.key).toBe('Enter');

    cloned.key = 'Escape';
    expect(original.key).toBe('Enter');
  });
});
