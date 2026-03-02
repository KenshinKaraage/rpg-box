import { evaluateTrack, evaluateTimeline, resolveAnimationValues } from './animationResolver';
import type { TweenTrack, InlineTimeline } from '@/types/ui/components/AnimationComponent';

// ────────────────────────────────────────────────
// evaluateTrack
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
    // easeIn = t*t, at midpoint (t=0.5): 0.25
    const val = evaluateTrack(easeInTrack, 200); // t = 0.5
    expect(val).toBeCloseTo(0.25, 5);
  });

  it('falls back to linear when easing not found', () => {
    const unknownEasing: TweenTrack = { ...track, easing: 'nonexistent' };
    expect(evaluateTrack(unknownEasing, 200)).toBeCloseTo(0.5, 5);
  });

  it('handles zero duration', () => {
    const zeroTrack: TweenTrack = { ...track, duration: 0 };
    expect(evaluateTrack(zeroTrack, 100)).toBe(0); // at start, returns from
    expect(evaluateTrack(zeroTrack, 101)).toBe(1); // after start, returns to
  });

  it('interpolates negative values', () => {
    const negTrack: TweenTrack = { ...track, from: -100, to: 100 };
    expect(evaluateTrack(negTrack, 200)).toBeCloseTo(0, 5); // midpoint: -100 + 200*0.5 = 0
  });
});

// ────────────────────────────────────────────────
// evaluateTimeline
// ────────────────────────────────────────────────

describe('evaluateTimeline', () => {
  const timeline: InlineTimeline = {
    duration: 1000,
    tracks: [
      { property: 'opacity', startTime: 0, duration: 500, from: 0, to: 1, easing: 'linear' },
      { property: 'transform.x', startTime: 200, duration: 800, from: 0, to: 100, easing: 'linear' },
    ],
  };

  it('evaluates all tracks at given time', () => {
    const result = evaluateTimeline(timeline, 250, false);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
    expect(result.get('transform.x')).toBeCloseTo(6.25, 5); // (250-200)/800 * 100
  });

  it('clamps time to duration without loop', () => {
    const result = evaluateTimeline(timeline, 2000, false);
    expect(result.get('opacity')).toBe(1);
    expect(result.get('transform.x')).toBe(100);
  });

  it('wraps time with loop enabled', () => {
    // 1500ms with loop → 1500 % 1000 = 500ms
    const result = evaluateTimeline(timeline, 1500, true);
    expect(result.get('opacity')).toBe(1); // at 500ms, track ends
    // transform.x at 500ms: (500-200)/800 = 0.375 → 37.5
    expect(result.get('transform.x')).toBeCloseTo(37.5, 5);
  });

  it('returns values for all tracks', () => {
    const result = evaluateTimeline(timeline, 0, false);
    expect(result.size).toBe(2);
    expect(result.has('opacity')).toBe(true);
    expect(result.has('transform.x')).toBe(true);
  });

  it('handles empty tracks', () => {
    const empty: InlineTimeline = { duration: 1000, tracks: [] };
    const result = evaluateTimeline(empty, 500, false);
    expect(result.size).toBe(0);
  });
});

// ────────────────────────────────────────────────
// resolveAnimationValues
// ────────────────────────────────────────────────

describe('resolveAnimationValues', () => {
  it('resolves inline animation values', () => {
    const data = {
      mode: 'inline',
      loop: false,
      inlineTimeline: {
        duration: 1000,
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

  it('returns empty map for inline mode without timeline', () => {
    const data = { mode: 'inline' };
    const result = resolveAnimationValues(data, 500);
    expect(result.size).toBe(0);
  });

  it('returns empty map for inline mode with empty tracks', () => {
    const data = {
      mode: 'inline',
      inlineTimeline: { duration: 1000, tracks: [] },
    };
    const result = resolveAnimationValues(data, 500);
    expect(result.size).toBe(0);
  });

  it('respects loop flag', () => {
    const data = {
      mode: 'inline',
      loop: true,
      inlineTimeline: {
        duration: 100,
        tracks: [
          { property: 'opacity', startTime: 0, duration: 100, from: 0, to: 1, easing: 'linear' },
        ],
      },
    };
    // 150ms with loop → 150 % 100 = 50ms → opacity = 0.5
    const result = resolveAnimationValues(data, 150);
    expect(result.get('opacity')).toBeCloseTo(0.5, 5);
  });
});
