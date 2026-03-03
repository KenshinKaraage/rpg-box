import {
  evaluateTrack,
  evaluateColorTrack,
  evaluateTimeline,
  resolveAnimationValues,
  parseHexColor,
  toHexColor,
  lerpColor,
} from './animationResolver';
import type { TweenTrack, InlineTimeline } from '@/types/ui/components/AnimationComponent';

// ────────────────────────────────────────────────
// Color helpers
// ────────────────────────────────────────────────

describe('parseHexColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseHexColor('#ff0000')).toEqual([255, 0, 0]);
    expect(parseHexColor('#00ff00')).toEqual([0, 255, 0]);
    expect(parseHexColor('#0000ff')).toEqual([0, 0, 255]);
  });

  it('parses 3-digit hex', () => {
    expect(parseHexColor('#f00')).toEqual([255, 0, 0]);
    expect(parseHexColor('#0f0')).toEqual([0, 255, 0]);
  });

  it('parses without hash', () => {
    expect(parseHexColor('ff8000')).toEqual([255, 128, 0]);
  });
});

describe('toHexColor', () => {
  it('converts RGB to hex', () => {
    expect(toHexColor(255, 0, 0)).toBe('#ff0000');
    expect(toHexColor(0, 255, 0)).toBe('#00ff00');
    expect(toHexColor(0, 0, 255)).toBe('#0000ff');
  });

  it('clamps out-of-range values', () => {
    expect(toHexColor(300, -10, 128)).toBe('#ff0080');
  });
});

describe('lerpColor', () => {
  it('interpolates between two colors', () => {
    expect(lerpColor('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('returns from color at t=0', () => {
    expect(lerpColor('#ff0000', '#00ff00', 0)).toBe('#ff0000');
  });

  it('returns to color at t=1', () => {
    expect(lerpColor('#ff0000', '#00ff00', 1)).toBe('#00ff00');
  });
});

// ────────────────────────────────────────────────
// evaluateTrack (numeric)
// ────────────────────────────────────────────────

describe('evaluateTrack', () => {
  const track: TweenTrack = {
    property: 'opacity',
    startTime: 100,
    duration: 200,
    from: 0,
    to: 1,
    easing: 'linear',
  };

  it('returns from value before startTime', () => {
    expect(evaluateTrack(track, 0)).toBe(0);
    expect(evaluateTrack(track, 100)).toBe(0);
  });

  it('returns to value after track ends', () => {
    expect(evaluateTrack(track, 300)).toBe(1);
    expect(evaluateTrack(track, 500)).toBe(1);
  });

  it('interpolates linearly at midpoint', () => {
    expect(evaluateTrack(track, 200)).toBeCloseTo(0.5, 5);
  });

  it('interpolates linearly at quarter', () => {
    expect(evaluateTrack(track, 150)).toBeCloseTo(0.25, 5);
  });

  it('uses easing function when available', () => {
    const easeInTrack: TweenTrack = { ...track, easing: 'easeIn' };
    const val = evaluateTrack(easeInTrack, 200);
    expect(val).toBeCloseTo(0.25, 5);
  });

  it('falls back to linear when easing not found', () => {
    const unknownEasing: TweenTrack = { ...track, easing: 'nonexistent' };
    expect(evaluateTrack(unknownEasing, 200)).toBeCloseTo(0.5, 5);
  });

  it('handles zero duration', () => {
    const zeroTrack: TweenTrack = { ...track, duration: 0 };
    expect(evaluateTrack(zeroTrack, 100)).toBe(0);
    expect(evaluateTrack(zeroTrack, 101)).toBe(1);
  });

  it('interpolates negative values', () => {
    const negTrack: TweenTrack = { ...track, from: -100, to: 100 };
    expect(evaluateTrack(negTrack, 200)).toBeCloseTo(0, 5);
  });
});

// ────────────────────────────────────────────────
// evaluateColorTrack
// ────────────────────────────────────────────────

describe('evaluateColorTrack', () => {
  const track: TweenTrack = {
    property: 'image.tint',
    valueType: 'color',
    startTime: 0,
    duration: 100,
    from: 0,
    to: 0,
    fromColor: '#ff0000',
    toColor: '#0000ff',
    easing: 'linear',
  };

  it('returns fromColor before startTime', () => {
    expect(evaluateColorTrack(track, 0)).toBe('#ff0000');
  });

  it('returns toColor after track ends', () => {
    expect(evaluateColorTrack(track, 100)).toBe('#0000ff');
  });

  it('interpolates color at midpoint', () => {
    const result = evaluateColorTrack(track, 50);
    expect(result).toBe('#800080');
  });

  it('uses easing for color interpolation', () => {
    const easeTrack: TweenTrack = { ...track, easing: 'easeIn' };
    // easeIn: t^2, at t=0.5 → 0.25
    const result = evaluateColorTrack(easeTrack, 50);
    // from #ff0000, lerp 0.25 toward #0000ff → r=191, g=0, b=64
    expect(result).toBe('#bf0040');
  });

  it('defaults to black/white when fromColor/toColor missing', () => {
    const noColor: TweenTrack = {
      ...track,
      fromColor: undefined,
      toColor: undefined,
    };
    expect(evaluateColorTrack(noColor, 0)).toBe('#000000');
    expect(evaluateColorTrack(noColor, 100)).toBe('#ffffff');
  });
});

// ────────────────────────────────────────────────
// evaluateTimeline (mixed numeric + color)
// ────────────────────────────────────────────────

describe('evaluateTimeline', () => {
  const timeline: InlineTimeline = {
    tracks: [
      { property: 'opacity', startTime: 0, duration: 500, from: 0, to: 1, easing: 'linear' },
      { property: 'transform.x', startTime: 200, duration: 800, from: 0, to: 100, easing: 'linear' },
    ],
  };

  it('evaluates all tracks at given time', () => {
    const result = evaluateTimeline(timeline, 250, false);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
    expect(result.get('transform.x')).toBeCloseTo(6.25, 5);
  });

  it('clamps time to duration without loop', () => {
    const result = evaluateTimeline(timeline, 2000, false);
    expect(result.get('opacity')).toBe(1);
    expect(result.get('transform.x')).toBe(100);
  });

  it('wraps time with loop enabled', () => {
    const result = evaluateTimeline(timeline, 1500, true);
    expect(result.get('opacity')).toBe(1);
    expect(result.get('transform.x')).toBeCloseTo(37.5, 5);
  });

  it('returns values for all tracks', () => {
    const result = evaluateTimeline(timeline, 0, false);
    expect(result.size).toBe(2);
  });

  it('handles empty tracks', () => {
    const empty: InlineTimeline = { tracks: [] };
    const result = evaluateTimeline(empty, 500, false);
    expect(result.size).toBe(0);
  });

  it('handles mixed numeric and color tracks', () => {
    const mixed: InlineTimeline = {
      tracks: [
        { property: 'opacity', startTime: 0, duration: 100, from: 0, to: 1, easing: 'linear' },
        {
          property: 'image.tint',
          valueType: 'color',
          startTime: 0,
          duration: 100,
          from: 0,
          to: 0,
          fromColor: '#000000',
          toColor: '#ffffff',
          easing: 'linear',
        },
      ],
    };
    const result = evaluateTimeline(mixed, 50, false);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
    expect(result.get('image.tint')).toBe('#808080');
  });
});

// ────────────────────────────────────────────────
// resolveAnimationValues
// ────────────────────────────────────────────────

describe('resolveAnimationValues', () => {
  it('resolves inline animation values (new animations format)', () => {
    const data = {
      mode: 'inline',
      loop: false,
      animations: [
        {
          name: 'fadeIn',
          timeline: {
            tracks: [
              { property: 'opacity', startTime: 0, duration: 1000, from: 0, to: 1, easing: 'linear' },
            ],
          },
        },
      ],
    };
    const result = resolveAnimationValues(data, 500);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
  });

  it('selects animation by name', () => {
    const data = {
      mode: 'inline',
      loop: false,
      animations: [
        {
          name: 'fadeIn',
          timeline: {
            tracks: [
              { property: 'opacity', startTime: 0, duration: 1000, from: 0, to: 1, easing: 'linear' },
            ],
          },
        },
        {
          name: 'slideIn',
          timeline: {
            tracks: [
              { property: 'transform.x', startTime: 0, duration: 500, from: -100, to: 0, easing: 'linear' },
            ],
          },
        },
      ],
    };
    const result = resolveAnimationValues(data, 250, 'slideIn');
    expect(result.has('opacity')).toBe(false);
    expect(result.get('transform.x')).toBeCloseTo(-50, 5);
  });

  it('uses first animation when no name specified', () => {
    const data = {
      mode: 'inline',
      loop: false,
      animations: [
        {
          name: 'first',
          timeline: {
            tracks: [
              { property: 'opacity', startTime: 0, duration: 1000, from: 0, to: 1, easing: 'linear' },
            ],
          },
        },
      ],
    };
    const result = resolveAnimationValues(data, 500);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
  });

  it('returns empty map for non-existent animation name', () => {
    const data = {
      mode: 'inline',
      loop: false,
      animations: [
        {
          name: 'fadeIn',
          timeline: {
            tracks: [
              { property: 'opacity', startTime: 0, duration: 1000, from: 0, to: 1, easing: 'linear' },
            ],
          },
        },
      ],
    };
    const result = resolveAnimationValues(data, 500, 'nonexistent');
    expect(result.size).toBe(0);
  });

  it('backward compat: resolves legacy inlineTimeline format', () => {
    const data = {
      mode: 'inline',
      loop: false,
      inlineTimeline: {
        tracks: [
          { property: 'opacity', startTime: 0, duration: 1000, from: 0, to: 1, easing: 'linear' },
        ],
      },
    };
    const result = resolveAnimationValues(data, 500);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
  });

  it('returns empty map for reference mode', () => {
    const data = { mode: 'reference', timelineId: 'some-id' };
    const result = resolveAnimationValues(data, 500);
    expect(result.size).toBe(0);
  });

  it('returns empty map for inline mode without animations', () => {
    const data = { mode: 'inline', animations: [] };
    const result = resolveAnimationValues(data, 500);
    expect(result.size).toBe(0);
  });

  it('returns empty map for inline mode with empty tracks in animation', () => {
    const data = {
      mode: 'inline',
      animations: [{ name: 'empty', timeline: { tracks: [] } }],
    };
    const result = resolveAnimationValues(data, 500);
    expect(result.size).toBe(0);
  });

  it('respects loop flag', () => {
    const data = {
      mode: 'inline',
      loop: true,
      animations: [
        {
          name: 'looping',
          timeline: {
            tracks: [
              { property: 'opacity', startTime: 0, duration: 100, from: 0, to: 1, easing: 'linear' },
            ],
          },
        },
      ],
    };
    const result = resolveAnimationValues(data, 150);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
  });

  it('resolves color tracks in animations', () => {
    const data = {
      mode: 'inline',
      loop: false,
      animations: [
        {
          name: 'colorShift',
          timeline: {
            tracks: [
              {
                property: 'image.tint',
                valueType: 'color',
                startTime: 0,
                duration: 100,
                from: 0,
                to: 0,
                fromColor: '#ff0000',
                toColor: '#0000ff',
                easing: 'linear',
              },
            ],
          },
        },
      ],
    };
    const result = resolveAnimationValues(data, 50);
    expect(result.get('image.tint')).toBe('#800080');
  });
});
