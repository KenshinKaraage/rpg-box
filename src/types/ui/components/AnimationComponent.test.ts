import { AnimationComponent } from './AnimationComponent';

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
    expect(c.animations).toEqual([]);
    expect(c.autoPlay).toBe(false);
    expect(c.loop).toBe(false);
  });

  it('round-trips serialize and deserialize with named animations', () => {
    const c = new AnimationComponent();
    c.mode = 'inline';
    c.autoPlay = true;
    c.loop = true;
    c.animations = [
      {
        name: 'fadeIn',
        timeline: {
          tracks: [
            {
              property: 'opacity',
              startTime: 0,
              duration: 1000,
              from: 0,
              to: 1,
              easing: 'easeOut',
            },
          ],
        },
      },
      {
        name: 'slideIn',
        timeline: {
          tracks: [
            {
              property: 'transform.x',
              startTime: 0,
              duration: 500,
              from: -100,
              to: 0,
              easing: 'easeOut',
            },
          ],
        },
      },
    ];

    const data = c.serialize();
    const c2 = new AnimationComponent();
    c2.deserialize(data);

    expect(c2.mode).toBe('inline');
    expect(c2.autoPlay).toBe(true);
    expect(c2.loop).toBe(true);
    expect(c2.animations).toHaveLength(2);
    expect(c2.animations[0]!.name).toBe('fadeIn');
    expect(c2.animations[0]!.timeline.tracks).toHaveLength(1);
    expect(c2.animations[1]!.name).toBe('slideIn');
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
    expect(c2.animations).toEqual([]);
  });

  it('deserialize with empty object uses defaults', () => {
    const c = new AnimationComponent();
    c.deserialize({});

    expect(c.mode).toBe('inline');
    expect(c.timelineId).toBeUndefined();
    expect(c.animations).toEqual([]);
    expect(c.autoPlay).toBe(false);
    expect(c.loop).toBe(false);
  });

  it('backward compat: deserializes legacy single inlineTimeline to animations array', () => {
    const c = new AnimationComponent();
    c.deserialize({
      mode: 'inline',
      autoPlay: true,
      loop: false,
      inlineTimeline: {
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
        ],
      },
    });

    expect(c.animations).toHaveLength(1);
    expect(c.animations[0]!.name).toBe('default');
    expect(c.animations[0]!.timeline.tracks).toHaveLength(1);
    expect(c.autoPlay).toBe(true);
  });

  it('clone creates independent copy', () => {
    const c = new AnimationComponent();
    c.mode = 'inline';
    c.autoPlay = true;
    c.loop = true;
    c.animations = [
      {
        name: 'bounce',
        timeline: {
          tracks: [
            {
              property: 'transform.y',
              startTime: 0,
              duration: 500,
              from: -20,
              to: 0,
              easing: 'easeOut',
            },
          ],
        },
      },
    ];

    const cloned = c.clone();

    // Modify the clone
    cloned.autoPlay = false;
    cloned.loop = false;
    cloned.animations[0]!.timeline.tracks[0]!.to = 50;

    // Original should be unchanged
    expect(c.autoPlay).toBe(true);
    expect(c.loop).toBe(true);
    expect(c.animations[0]!.timeline.tracks[0]!.to).toBe(0);
  });

  it('clone deep-clones animations array', () => {
    const c = new AnimationComponent();
    c.animations = [
      {
        name: 'test',
        timeline: {
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
        },
      },
    ];

    const cloned = c.clone();

    // They should be equal but not the same reference
    expect(cloned.animations).toEqual(c.animations);
    expect(cloned.animations).not.toBe(c.animations);
    expect(cloned.animations[0]).not.toBe(c.animations[0]);
  });
});
