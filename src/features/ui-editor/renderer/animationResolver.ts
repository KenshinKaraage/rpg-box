/**
 * Animation / Tween 補間ロジック
 *
 * AnimationComponent の InlineTimeline に基づいて
 * 指定時刻におけるプロパティ値を計算する。
 * 数値プロパティとカラープロパティの両方を補間可能。
 */
import type {
  TweenTrack,
  InlineTimeline,
  NamedAnimation,
} from '@/types/ui/components/AnimationComponent';
import { computeCycleDuration } from '@/types/ui/components/AnimationComponent';
import { getEasing } from '@/engine/tween/easings';

// ──────────────────────────────────────────────
// Color interpolation helpers
// ──────────────────────────────────────────────

/** Parse hex color (#RRGGBB or #RGB) to [r, g, b] (0-255) */
export function parseHexColor(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0]!, 16),
      parseInt(h[1]! + h[1]!, 16),
      parseInt(h[2]! + h[2]!, 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert [r, g, b] (0-255) to hex string #RRGGBB */
export function toHexColor(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    clamp(r).toString(16).padStart(2, '0') +
    clamp(g).toString(16).padStart(2, '0') +
    clamp(b).toString(16).padStart(2, '0')
  );
}

/** Interpolate between two hex colors */
export function lerpColor(fromHex: string, toHex: string, t: number): string {
  const [fr, fg, fb] = parseHexColor(fromHex);
  const [tr, tg, tb] = parseHexColor(toHex);
  return toHexColor(
    fr + (tr - fr) * t,
    fg + (tg - fg) * t,
    fb + (tb - fb) * t
  );
}

// ──────────────────────────────────────────────
// Track evaluation
// ──────────────────────────────────────────────

/**
 * 単一 TweenTrack の指定時刻における数値を計算
 *
 * @param track TweenTrack 定義
 * @param timeMs 現在時刻（ms）
 * @returns 補間された値。トラック範囲外の場合は from/to のクランプ値
 */
export function evaluateTrack(track: TweenTrack, timeMs: number): number {
  const { startTime, duration, from, to, easing } = track;

  if (timeMs <= startTime) return from;
  if (timeMs >= startTime + duration) return to;

  const elapsed = timeMs - startTime;
  const rawT = duration > 0 ? elapsed / duration : 1;

  const easingFn = getEasing(easing);
  const easedT = easingFn ? easingFn(rawT) : rawT;

  return from + (to - from) * easedT;
}

/**
 * 単一カラー TweenTrack の指定時刻における色を計算
 */
export function evaluateColorTrack(track: TweenTrack, timeMs: number): string {
  const { startTime, duration, fromColor, toColor, easing } = track;
  const fc = fromColor ?? '#000000';
  const tc = toColor ?? '#ffffff';

  if (timeMs <= startTime) return fc;
  if (timeMs >= startTime + duration) return tc;

  const elapsed = timeMs - startTime;
  const rawT = duration > 0 ? elapsed / duration : 1;

  const easingFn = getEasing(easing);
  const easedT = easingFn ? easingFn(rawT) : rawT;

  return lerpColor(fc, tc, easedT);
}

// ──────────────────────────────────────────────
// Timeline evaluation
// ──────────────────────────────────────────────

/**
 * InlineTimeline の全トラックを評価し、プロパティごとの値マップを返す
 *
 * @param timeline InlineTimeline 定義
 * @param timeMs 現在時刻（ms）
 * @param loop (legacy) ループ有効時は duration で折り返す。timeline.loopType が指定されている場合はそちらを優先。
 * @returns property → value (number | string) のマップ
 */
export function evaluateTimeline(
  timeline: InlineTimeline,
  timeMs: number,
  loop: boolean
): Map<string, number | string> {
  const result = new Map<string, number | string>();

  const cycleDuration = computeCycleDuration(timeline.tracks);
  if (cycleDuration === 0) return result;

  // Determine effective loop settings
  const loopType = timeline.loopType ?? (loop ? 'loop' : 'none');
  const loopCount = timeline.loopCount ?? (loop ? 0 : 1);

  let t = timeMs;
  if (loopType !== 'none' && cycleDuration > 0) {
    if (loopCount === 0) {
      // infinite loop
      if (loopType === 'pingpong') {
        const iteration = Math.floor(t / cycleDuration);
        const remainder = t % cycleDuration;
        t = iteration % 2 === 0 ? remainder : cycleDuration - remainder;
      } else {
        t = t % cycleDuration;
      }
    } else {
      const totalDuration = cycleDuration * loopCount;
      if (t >= totalDuration) {
        t = cycleDuration; // clamp to end of last cycle
      } else if (loopType === 'pingpong') {
        const iteration = Math.floor(t / cycleDuration);
        const remainder = t % cycleDuration;
        t = iteration % 2 === 0 ? remainder : cycleDuration - remainder;
      } else {
        t = t % cycleDuration;
      }
    }
  } else {
    t = Math.min(t, cycleDuration);
  }

  for (const track of timeline.tracks) {
    if (track.valueType === 'color') {
      result.set(track.property, evaluateColorTrack(track, t));
    } else {
      result.set(track.property, evaluateTrack(track, t));
    }
  }

  return result;
}

/**
 * AnimationComponent のシリアライズデータから
 * 指定時刻のプロパティ値を解決する
 *
 * @param animData AnimationComponent.serialize() の結果
 * @param timeMs 現在時刻（ms）
 * @param animationName 再生するアニメーション名（省略時は最初のアニメーション）
 * @returns property → value のマップ（空の場合あり）
 */
export function resolveAnimationValues(
  animData: Record<string, unknown>,
  timeMs: number,
  animationName?: string
): Map<string, number | string> {
  const mode = animData.mode as string | undefined;
  const loop = (animData.loop as boolean) ?? false;

  if (mode === 'inline') {
    // New format: animations array
    const animations = animData.animations as NamedAnimation[] | undefined;
    if (animations && Array.isArray(animations) && animations.length > 0) {
      const anim = animationName
        ? animations.find((a) => a.name === animationName)
        : animations[0];
      if (!anim || !anim.timeline.tracks || anim.timeline.tracks.length === 0) {
        return new Map();
      }
      return evaluateTimeline(anim.timeline, timeMs, loop);
    }

    // Legacy format: single inlineTimeline
    const timeline = animData.inlineTimeline as InlineTimeline | undefined;
    if (!timeline || !timeline.tracks || timeline.tracks.length === 0) {
      return new Map();
    }
    return evaluateTimeline(timeline, timeMs, loop);
  }

  // reference モードはランタイムで TimelineAsset を解決するため、
  // エディタプレビューでは空を返す
  return new Map();
}
