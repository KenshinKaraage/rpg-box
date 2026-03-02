/**
 * Animation / Tween 補間ロジック
 *
 * AnimationComponent の InlineTimeline に基づいて
 * 指定時刻におけるプロパティ値を計算する。
 */
import type { TweenTrack, InlineTimeline } from '@/types/ui/components/AnimationComponent';
import { getEasing } from '@/engine/tween/easings';

/**
 * 単一 TweenTrack の指定時刻における値を計算
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
 * InlineTimeline の全トラックを評価し、プロパティごとの値マップを返す
 *
 * @param timeline InlineTimeline 定義
 * @param timeMs 現在時刻（ms）
 * @param loop ループ有効時は duration で折り返す
 * @returns property → value のマップ
 */
export function evaluateTimeline(
  timeline: InlineTimeline,
  timeMs: number,
  loop: boolean
): Map<string, number> {
  const result = new Map<string, number>();

  let t = timeMs;
  if (loop && timeline.duration > 0) {
    t = timeMs % timeline.duration;
  } else {
    t = Math.min(timeMs, timeline.duration);
  }

  for (const track of timeline.tracks) {
    const value = evaluateTrack(track, t);
    result.set(track.property, value);
  }

  return result;
}

/**
 * AnimationComponent のシリアライズデータから
 * 指定時刻のプロパティ値を解決する
 *
 * @param animData AnimationComponent.serialize() の結果
 * @param timeMs 現在時刻（ms）
 * @returns property → value のマップ（空の場合あり）
 */
export function resolveAnimationValues(
  animData: Record<string, unknown>,
  timeMs: number
): Map<string, number> {
  const mode = animData.mode as string | undefined;
  const loop = (animData.loop as boolean) ?? false;

  if (mode === 'inline') {
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
