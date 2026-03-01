import { AnimationComponent } from './AnimationComponent';
import type { InlineTimeline } from './AnimationComponent';

describe('AnimationComponent', () => {
  it('has type "animation"', () => {
    const c = new AnimationComponent();
    expect(c.type).toBe('animation');
  });

  it('has label "アニメーション"', () => {
    const c = new AnimationComponent();
    expect(c.label).toBe('アニメーション');
  });

  it('has correct default values', () => {
    const c = new AnimationComponent();
    expect(c.mode).toBe('inline');
    expect(c.timelineId).toBeUndefined();
    expect(c.inlineTimeline).toBeUndefined();
    expect(c.autoPlay).toBe(false);
    expect(c.loop).toBe(false);
  });

  it('round-trips serialize and deserialize with inline timeline', () => {
    const c = new AnimationComponent();
    c.mode = 'inline';
    c.autoPlay = true;
    c.loop = true;
    c.inlineTimeline = {
      duration: 1000,
      tracks: [
        {
          property: 'transform.x',
          startTime: 0,
          duration: 500,
          from: 0,
          to: 100,
          easing: 'easeOut',
        },
        {
          property: 'opacity',
          startTime: 200,
          duration: 800,
          from: 0,
          to: 1,
          easing: 'linear',
        },
      ],
    };

    const data = c.serialize();
    const c2 = new AnimationComponent();
    c2.deserialize(data);

    expect(c2.mode).toBe('inline');
    expect(c2.autoPlay).toBe(true);
    expect(c2.loop).toBe(true);
    expect(c2.inlineTimeline).toEqual({
      duration: 1000,
      tracks: [
        {
          property: 'transform.x',
          startTime: 0,
          duration: 500,
          from: 0,
          to: 100,
          easing: 'easeOut',
        },
        {
          property: 'opacity',
          startTime: 200,
          duration: 800,
          from: 0,
          to: 1,
          easing: 'linear',
        },
      ],
    });
  });

  it('round-trips serialize and deserialize with reference mode', () => {
    const c = new AnimationComponent();
    c.mode = 'reference';
    c.timelineId = 'timeline-001';

    const data = c.serialize();
    const c2 = new AnimationComponent();
    c2.deserialize(data);

    expect(c2.mode).toBe('reference');
    expect(c2.timelineId).toBe('timeline-001');
    expect(c2.inlineTimeline).toBeUndefined();
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new AnimationComponent();
    c.deserialize({});

    expect(c.mode).toBe('inline');
    expect(c.timelineId).toBeUndefined();
    expect(c.inlineTimeline).toBeUndefined();
    expect(c.autoPlay).toBe(false);
    expect(c.loop).toBe(false);
  });

  it('clone creates independent copy', () => {
    const c = new AnimationComponent();
    c.mode = 'inline';
    c.autoPlay = true;
    c.loop = true;
    c.inlineTimeline = {
      duration: 500,
      tracks: [
        {
          property: 'opacity',
          startTime: 0,
          duration: 500,
          from: 0,
          to: 1,
          easing: 'linear',
        },
      ],
    };

    const cloned = c.clone();

    // Modify the clone
    cloned.autoPlay = false;
    cloned.loop = false;
    cloned.inlineTimeline!.tracks[0]!.to = 0.5;

    // Original should be unchanged
    expect(c.autoPlay).toBe(true);
    expect(c.loop).toBe(true);
    expect(c.inlineTimeline!.tracks[0]!.to).toBe(1);
  });

  it('clone deep-clones inlineTimeline', () => {
    const c = new AnimationComponent();
    c.inlineTimeline = {
      duration: 300,
      tracks: [
        {
          property: 'transform.y',
          startTime: 0,
          duration: 300,
          from: -20,
          to: 0,
          easing: 'easeOut',
        },
      ],
    };

    const cloned = c.clone();

    // They should be equal but not the same reference
    expect(cloned.inlineTimeline).toEqual(c.inlineTimeline);
    expect(cloned.inlineTimeline).not.toBe(c.inlineTimeline);
    expect(cloned.inlineTimeline!.tracks).not.toBe(c.inlineTimeline!.tracks);
  });
});
